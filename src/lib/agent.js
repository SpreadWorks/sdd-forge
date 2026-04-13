/**
 * sdd-forge/lib/agent.js
 *
 * AI agent invocation utility.
 * Provides a shared interface for calling configured AI agents.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execFileSync, spawn } from "child_process";
import { resolveWorkDir as resolveConfiguredWorkDir } from "./config.js";
import { Logger, generateRequestId } from "./log.js";


/** Default agent timeout in seconds. */
export const DEFAULT_AGENT_TIMEOUT = 300;

/** Default agent timeout in milliseconds. */
export const DEFAULT_AGENT_TIMEOUT_MS = DEFAULT_AGENT_TIMEOUT * 1000;

function createSystemPromptPrefix(flag, systemPrompt) {
  if (!flag || !systemPrompt) return { prefix: [] };
  return { prefix: [flag, systemPrompt] };
}

function resolveEffectivePrompt(prompt, systemPrompt, systemPromptFlag) {
  if (!systemPromptFlag && systemPrompt) {
    return `${systemPrompt}\n\n${prompt}`;
  }
  return prompt;
}

function resolvePromptArgs(args, prompt) {
  const hasToken = args.some((a) => typeof a === "string" && a.includes("{{PROMPT}}"));
  if (hasToken) {
    return args.map((a) => (typeof a === "string" ? a.replaceAll("{{PROMPT}}", prompt) : a));
  }
  return [...args, prompt];
}

/**
 * args から {{PROMPT}} を含む引数を除去する（stdin フォールバック用）。
 * {{PROMPT}} の直前に -p / --print がある場合はそれも除去する。
 */
function stripPromptFromArgs(args) {
  const result = [];
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === "string" && args[i].includes("{{PROMPT}}")) {
      if (result.length > 0 && ["-p", "--print"].includes(result[result.length - 1])) {
        result.pop();
      }
      continue;
    }
    result.push(args[i]);
  }
  return result;
}

/** argv の合計バイト数がこの閾値を超えたら stdin 経由に切り替える */
const ARGV_SIZE_THRESHOLD = 100_000;

/**
 * agent.command の部分一致で provider を判定する。
 * "claude" を含む → "claude", "codex" を含む → "codex", それ以外 → "unknown"
 *
 * @param {string} command
 * @returns {"claude"|"codex"|"unknown"}
 */
function detectProviderKey(command) {
  if (!command) return "unknown";
  if (command.includes("claude")) return "claude";
  if (command.includes("codex")) return "codex";
  return "unknown";
}

/**
 * jsonOutputFlag を args に注入する。
 * flagParts の全シーケンスがすでに args に連続して含まれている場合は追加しない（重複防止）。
 * 先頭フラグのみのチェックでは --output-format stream のような別値との区別ができないため、
 * 完全シーケンス一致で判定する。
 *
 * @param {string[]} flagParts - jsonOutputFlag を空白で分割した配列
 * @param {string[]} args
 * @returns {string[]}
 */
function injectJsonFlag(flagParts, args) {
  if (flagParts.length === 0) return args;
  // Full-sequence search: check if flagParts appears consecutively in args
  const idx = args.findIndex((_, i) =>
    flagParts.every((part, j) => args[i + j] === part),
  );
  if (idx !== -1) return args;
  // If first arg is a subcommand (not a flag), inject after it so that
  // e.g. `codex exec --json ...` is produced instead of `codex --json exec ...`.
  if (args.length > 0 && !args[0].startsWith("-")) {
    return [args[0], ...flagParts, ...args.slice(1)];
  }
  return [...flagParts, ...args];
}

/**
 * claude の JSON 出力をパースして { text, usage } を返す。
 * @returns {{ text: string, usage: object }}
 */
function parseClaudeOutput(stdout) {
  const data = JSON.parse(stdout);
  return {
    text: String(data.result ?? ""),
    usage: {
      input_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0,
      cache_read_tokens: data.usage?.cache_read_input_tokens ?? 0,
      cache_creation_tokens: data.usage?.cache_creation_input_tokens ?? 0,
      cost_usd: data.total_cost_usd ?? null,
    },
  };
}

/**
 * codex の NDJSON 出力をパースして { text, usage } を返す。
 * @returns {{ text: string, usage: object }}
 */
function parseCodexOutput(stdout) {
  const lines = stdout.trim().split("\n");
  let text = "";
  let usageRaw = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.type === "item.completed" && event.item?.type === "agent_message") {
      text += String(event.item.text ?? "");
    } else if (event.type === "turn.completed") {
      usageRaw = event.usage;
    }
  }
  return {
    text,
    usage: {
      input_tokens: (usageRaw?.input_tokens ?? 0) - (usageRaw?.cached_input_tokens ?? 0),
      output_tokens: usageRaw?.output_tokens ?? 0,
      cache_read_tokens: usageRaw?.cached_input_tokens ?? 0,
      cache_creation_tokens: 0,
      cost_usd: null,
    },
  };
}

const STDERR_WARN = (msg) => process.stderr.write(`[sdd-forge] ${msg}\n`);

/** Provider-to-parser mapping. Each parser throws on invalid input. */
const PROVIDER_PARSERS = {
  claude: parseClaudeOutput,
  codex: parseCodexOutput,
};

/**
 * agent stdout を JSON としてパースし { text, usage } を返す。
 * provider が unknown、またはパース失敗の場合は null を返す。
 *
 * @param {"claude"|"codex"|"unknown"} providerKey
 * @param {string} stdout
 * @returns {{ text: string, usage: object }|null}
 */
function parseAgentOutput(providerKey, stdout) {
  const parser = PROVIDER_PARSERS[providerKey];
  if (!parser) return null; // unknown → plain text
  try {
    return parser(stdout);
  } catch (e) {
    STDERR_WARN(`JSON parse failed (${providerKey}): ${e.message}`);
    return null;
  }
}

/**
 * agent の raw stdout から { text, usage } を解決する。
 * jsonOutputFlag が設定されており provider が claude/codex の場合は JSON パースを試みる。
 * それ以外または失敗時は plain text fallback。
 *
 * @param {Object} agent
 * @param {string} rawOutput
 * @returns {{ text: string, usage: object|null }}
 */
function resolveAgentResult(agent, rawOutput) {
  const providerKey = agent.providerKey ?? "unknown";
  if (agent.jsonOutputFlag && providerKey !== "unknown") {
    const parsed = parseAgentOutput(providerKey, rawOutput.trim());
    if (parsed) return { text: parsed.text.trim(), usage: parsed.usage };
  }
  return { text: rawOutput.trim(), usage: null };
}

function buildAgentInvocation(agent, prompt, options) {
  const { systemPrompt } = options || {};
  const args = Array.isArray(agent.args) ? [...agent.args] : [];
  const flag = agent.systemPromptFlag;
  const { prefix } = createSystemPromptPrefix(flag, systemPrompt);
  const effectivePrompt = resolveEffectivePrompt(prompt, systemPrompt, flag);
  const resolvedArgs = resolvePromptArgs(args, effectivePrompt);

  // Inject jsonOutputFlag when provider is known
  const providerKey = agent.providerKey ?? "unknown";
  const flagParts = (agent.jsonOutputFlag && providerKey !== "unknown")
    ? agent.jsonOutputFlag.trim().split(/\s+/)
    : [];
  const injectedArgs = injectJsonFlag(flagParts, resolvedArgs);

  const finalArgs = [...prefix, ...injectedArgs];
  const env = { ...process.env };
  delete env.CLAUDECODE;

  // Check total argv size; fall back to stdin if over threshold
  const totalBytes = finalArgs.reduce((sum, a) => sum + Buffer.byteLength(String(a)), 0);
  if (totalBytes <= ARGV_SIZE_THRESHOLD) {
    return { finalArgs, env, stdinContent: null };
  }

  // Stdin fallback: route the prompt through stdin instead of CLI args.
  // System prompt stays as CLI arg (small); only the prompt goes via stdin.
  const strippedArgs = stripPromptFromArgs(args);
  const injectedStrippedArgs = injectJsonFlag(flagParts, strippedArgs);
  const stdinFinalArgs = [...prefix, ...injectedStrippedArgs];
  return { finalArgs: stdinFinalArgs, env, stdinContent: effectivePrompt };
}

/**
 * Call an AI agent and return { text, usage }.
 * Internal variant used by callAgent and logging wrappers.
 *
 * @param {Object} agent
 * @param {string} prompt
 * @param {number} [timeoutMs]
 * @param {string} [cwd]
 * @param {Object} [options]
 * @returns {{ text: string, usage: object|null }}
 */
function callAgentRaw(agent, prompt, timeoutMs, cwd, options) {
  const { finalArgs, env, stdinContent } = buildAgentInvocation(agent, prompt, options);

  const rawOutput = execFileSync(agent.command, finalArgs, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: timeoutMs || agent.timeoutMs || DEFAULT_AGENT_TIMEOUT_MS,
    cwd: cwd || process.cwd(),
    env,
    ...(stdinContent != null ? { input: stdinContent } : {}),
  });
  return resolveAgentResult(agent, rawOutput);
}

/**
 * Call an AI agent with a prompt and return the response.
 *
 * When `options.systemPrompt` is provided:
 *   - If agent.systemPromptFlag is set (e.g. "--system-prompt"),
 *     the flag + systemPrompt are prepended to the argument list.
 *   - If no systemPromptFlag but systemPrompt is given,
 *     the system prompt is prepended to the user prompt (fallback).
 *
 * @param {Object} agent        - Agent config ({ command, args, systemPromptFlag?, jsonOutputFlag?, providerKey? })
 * @param {string} prompt       - The prompt text
 * @param {number} [timeoutMs]  - Timeout in milliseconds (default: DEFAULT_AGENT_TIMEOUT * 1000)
 * @param {string} [cwd]        - Working directory
 * @param {Object} [options]    - Additional options
 * @param {string} [options.systemPrompt] - System prompt text
 * @returns {string} Agent response (trimmed)
 */
export function callAgent(agent, prompt, timeoutMs, cwd, options) {
  return callAgentRaw(agent, prompt, timeoutMs, cwd, options).text;
}

/**
 * Async version of callAgent. Uses spawn with stdio: ["ignore", "pipe", "pipe"].
 *
 * execFile は stdin を pipe で開くため、Claude CLI が EOF を待ち続けてハングする。
 * spawn + stdin: "ignore" でこの問題を回避する。
 * See: src/README.md "Agent Invocation" section
 *
 * @param {Object} agent        - Agent config ({ command, args, systemPromptFlag? })
 * @param {string} prompt       - The prompt text
 * @param {number} [timeoutMs]  - Timeout in milliseconds (default: DEFAULT_AGENT_TIMEOUT * 1000)
 * @param {string} [cwd]        - Working directory
 * @param {Object} [options]    - Additional options
 * @param {string} [options.systemPrompt] - System prompt text
 * @param {function} [options.onStdout] - Streaming callback for stdout chunks
 * @param {function} [options.onStderr] - Streaming callback for stderr chunks
 * @param {number} [options.retryCount=0] - Number of retries on empty response or non-zero exit (0 = no retry)
 * @param {number} [options.retryDelayMs=3000] - Delay between retries in milliseconds
 * @returns {Promise<string>} Agent response (trimmed)
 */
export function callAgentAsync(agent, prompt, timeoutMs, cwd, options) {
  return callAgentAsyncRaw(agent, prompt, timeoutMs, cwd, options).then((r) => r.text);
}

/**
 * Build a Logger.agent() end-event payload from a callAgent invocation.
 *
 * @param {Object} agent
 * @param {string} prompt
 * @param {Object} options
 * @param {string|null} response
 * @param {number} exitCode
 * @param {string|null} error
 * @param {number} startedAt
 * @param {object|null} [usage] - Normalized usage from parseAgentOutput
 */
function buildAgentLogPayload(agent, prompt, options, response, exitCode, error, startedAt, usage) {
  return {
    agentKey: agent?.command ?? null,
    model: agent?.model ?? null,
    prompt: {
      system: options?.systemPrompt ?? null,
      user: prompt,
    },
    response: {
      text: response,
      exitCode,
      error,
    },
    usage: usage ?? null,
    durationSec: (Date.now() - startedAt) / 1000,
  };
}

const STDERR_LOG = (e) => process.stderr.write(`[sdd-forge] Logger.agent failed: ${e.message}\n`);

/**
 * invoke の結果から text と usage を取り出す。
 * invoke が { text, usage } オブジェクトを返す場合はそれを使い、
 * 文字列を返す場合は usage: null として扱う。
 */
function extractAgentResult(result) {
  if (result !== null && typeof result === "object" && "text" in result) {
    return { text: result.text, usage: result.usage ?? null };
  }
  return { text: result, usage: null };
}

/**
 * Async runner that wraps an agent invocation in Logger.agent start/end
 * events. Used by both `callAgentAwaitLog` (sync inner call, awaited
 * Logger I/O) and `callAgentAsyncWithLog` (async inner call).
 *
 * invoke は { text, usage } または string を返す。
 * 呼び出し元には text のみを返す。usage は Logger payload に記録される。
 *
 * @param {Object}   spec
 * @param {boolean}  spec.asyncInvoke    — true if invoke returns a Promise
 * @param {()=>any}  spec.invoke
 * @param {Object}   spec.agent
 * @param {string}   spec.prompt
 * @param {Object}   [spec.options]
 * @param {string}   spec.errCodeKey     — "status" (execFileSync) or "code" (spawn)
 */
async function runWithAgentLogging({ asyncInvoke, invoke, agent, prompt, options, errCodeKey }) {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  const logger = Logger.getInstance();
  await logger.agent({ phase: "start", requestId });

  let agentResult = null;
  let err = null;
  try {
    agentResult = asyncInvoke ? await invoke() : invoke();
    const { text } = extractAgentResult(agentResult);
    return text;
  } catch (e) {
    err = e;
    throw e;
  } finally {
    const { text, usage } = extractAgentResult(agentResult);
    const payload = buildAgentLogPayload(
      agent,
      prompt,
      options,
      text,
      err ? (err[errCodeKey] ?? 1) : 0,
      err ? err.message : null,
      startedAt,
      usage,
    );
    await logger.agent({ phase: "end", requestId, ...payload });
  }
}

/**
 * Sync callAgent wrapped with Logger.agent start/end events.
 * End-event Logger.log() is fire-and-forget.
 */
export function callAgentWithLog(agent, prompt, timeoutMs, cwd, options) {
  return runWithAgentLoggingSync({
    invoke: () => callAgentRaw(agent, prompt, timeoutMs, cwd, options),
    agent, prompt, options,
    errCodeKey: "status",
  });
}

/** Sync variant — runs invoke synchronously, fires Logger calls without awaiting. */
function runWithAgentLoggingSync({ invoke, agent, prompt, options, errCodeKey }) {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  const logger = Logger.getInstance();
  logger.agent({ phase: "start", requestId }).catch(STDERR_LOG);
  let agentResult = null;
  let err = null;
  try {
    agentResult = invoke();
    const { text } = extractAgentResult(agentResult);
    return text;
  } catch (e) {
    err = e;
    throw e;
  } finally {
    const { text, usage } = extractAgentResult(agentResult);
    const payload = buildAgentLogPayload(
      agent,
      prompt,
      options,
      text,
      err ? (err[errCodeKey] ?? 1) : 0,
      err ? err.message : null,
      startedAt,
      usage,
    );
    logger.agent({ phase: "end", requestId, ...payload }).catch(STDERR_LOG);
  }
}

/**
 * Sync callAgent wrapped with Logger.agent start/end events, awaited.
 * Use in async function contexts where the existing code uses sync callAgent.
 */
export async function callAgentAwaitLog(agent, prompt, timeoutMs, cwd, options) {
  return runWithAgentLogging({
    asyncInvoke: false,
    invoke: () => callAgentRaw(agent, prompt, timeoutMs, cwd, options),
    agent, prompt, options,
    errCodeKey: "status",
  });
}

/**
 * Async callAgentAsync (spawn-based) wrapped with Logger.agent start/end events.
 */
export async function callAgentAsyncWithLog(agent, prompt, timeoutMs, cwd, options) {
  return runWithAgentLogging({
    asyncInvoke: true,
    invoke: () => callAgentAsyncRaw(agent, prompt, timeoutMs, cwd, options),
    agent, prompt, options,
    errCodeKey: "code",
  });
}

async function callAgentAsyncWithRetry(agent, prompt, timeoutMs, cwd, options, retryCount, retryDelayMs) {
  let lastError = null;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const result = await callAgentAsyncRawOnce(agent, prompt, timeoutMs, cwd, options);
      if (result.text) return result;
      lastError = new Error("empty response");
    } catch (err) {
      if (err.killed || err.signal) throw err;
      lastError = err;
    }
    if (attempt < retryCount) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  throw lastError;
}

/**
 * Single async agent call returning { text, usage }.
 * Internal variant used by callAgentAsyncWithLog and callAgentAsync.
 */
async function callAgentAsyncRawOnce(agent, prompt, timeoutMs, cwd, options) {
  const rawOutput = await callAgentAsyncOnce(agent, prompt, timeoutMs, cwd, options);
  return resolveAgentResult(agent, rawOutput);
}

/**
 * callAgentAsync (with optional retry) returning { text, usage }.
 * Internal variant used by callAgentAsyncWithLog.
 */
function callAgentAsyncRaw(agent, prompt, timeoutMs, cwd, options) {
  const { retryCount = 0, retryDelayMs = 3000, ...restOptions } = options || {};
  return retryCount <= 0
    ? callAgentAsyncRawOnce(agent, prompt, timeoutMs, cwd, restOptions)
    : callAgentAsyncWithRetry(agent, prompt, timeoutMs, cwd, restOptions, retryCount, retryDelayMs);
}

function callAgentAsyncOnce(agent, prompt, timeoutMs, cwd, options) {
  const { systemPrompt, onStdout, onStderr } = options || {};
  const { finalArgs, env, stdinContent } = buildAgentInvocation(agent, prompt, { systemPrompt });

  const timeout = timeoutMs || agent.timeoutMs || DEFAULT_AGENT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawn(agent.command, finalArgs, {
      stdio: [stdinContent != null ? "pipe" : "ignore", "pipe", "pipe"],
      cwd: cwd || process.cwd(),
      env,
    });

    if (stdinContent != null) {
      child.stdin.write(stdinContent);
      child.stdin.end();
    }

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (onStdout) onStdout(String(chunk));
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (onStderr) onStderr(String(chunk));
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeout);

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0 && !signal) {
        resolve(String(stdout).trim());
        return;
      }
      const parts = [];
      if (signal) parts.push(signal === "SIGTERM" ? "timeout" : `signal=${signal}`);
      if (code != null && code !== 0) parts.push(`exit=${code}`);
      if (stderr) parts.push(String(stderr).trim());
      if (!stderr && stdout) parts.push(String(stdout).trim());
      const error = new Error(parts.join(" | ") || "unknown error");
      error.code = code;
      error.signal = signal;
      error.killed = signal === "SIGTERM";
      reject(error);
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Load agent config from SddConfig. Throws on failure.
 * Supports COMMAND_ID for per-command resolution (same as resolveAgent).
 *
 * @param {Object} cfg         - SddConfig object
 * @param {string} [commandId] - Dot-separated command ID (e.g. "docs.review")
 * @returns {Object} Agent config object with merged args
 * @throws {Error} If no agent is configured or provider is unknown
 */
export function loadAgentConfig(cfg, commandId) {
  const agent = resolveAgent(cfg, commandId);
  if (!agent) {
    throw new Error("No default agent configured. Set 'agent.default' in config.json or run 'sdd-forge setup'.");
  }
  return agent;
}

/**
 * agent args の -C <dir> を検証し、プロジェクト内ならディレクトリを自動作成する。
 * プロジェクト外のパスが指定された場合はエラーを投げる。
 *
 * @param {Object} agent       - Agent config ({ args })
 * @param {string} projectRoot - プロジェクトルートの絶対パス
 */
export function ensureAgentWorkDir(agent, projectRoot) {
  const args = agent.args;
  if (!Array.isArray(args)) return;
  const cdIdx = args.indexOf("-C");
  if (cdIdx < 0 || !args[cdIdx + 1]) return;

  const resolved = path.resolve(projectRoot, args[cdIdx + 1]);
  if (!resolved.startsWith(projectRoot + path.sep)) {
    throw new Error(`-C path must be inside project root: ${args[cdIdx + 1]}`);
  }
  fs.mkdirSync(resolved, { recursive: true });
}

/**
 * Built-in provider definitions. Users can override any entry by defining
 * the same key in config.agent.providers.
 */
export const BUILTIN_PROVIDERS = {
  "claude/opus": {
    command: "claude",
    args: ["-p", "{{PROMPT}}", "--model", "opus"],
    systemPromptFlag: "--system-prompt",
  },
  "claude/sonnet": {
    command: "claude",
    args: ["-p", "{{PROMPT}}", "--model", "sonnet"],
    systemPromptFlag: "--system-prompt",
  },
  "codex/gpt-5.4": {
    command: "codex",
    args: ["exec", "-m", "gpt-5.4", "--full-auto", "-C", ".tmp", "{{PROMPT}}"],
  },
  "codex/gpt-5.3": {
    command: "codex",
    args: ["exec", "-m", "gpt-5.3-codex", "--full-auto", "-C", ".tmp", "{{PROMPT}}"],
  },
};

/**
 * Resolve the active profile name.
 * Priority: SDD_FORGE_PROFILE env var > agent.useProfile config.
 *
 * @param {Object} agentSection - cfg.agent object
 * @returns {string|null} Profile name or null if not set
 */
function resolveProfileName(agentSection) {
  const envProfile = process.env.SDD_FORGE_PROFILE;
  if (envProfile) return envProfile;
  const cfgProfile = agentSection.useProfile;
  if (cfgProfile) return cfgProfile;
  return null;
}

/**
 * Build a final agent result object by merging provider settings and resolving timeout.
 *
 * @param {Object} providers       - Provider dictionary
 * @param {string} key             - Provider key to look up
 * @param {number} globalTimeoutMs - Fallback timeout in milliseconds
 * @returns {Object|null}
 */
function buildAgentResult(providers, key, globalTimeoutMs) {
  const provider = providers[key];
  if (!provider) return null;
  const effectiveTimeoutMs = provider.timeoutMs || (provider.timeout ? provider.timeout * 1000 : globalTimeoutMs);
  return { ...provider, timeoutMs: effectiveTimeoutMs, providerKey: detectProviderKey(provider.command) };
}

function resolveProviderKeyFromProfile(profile, commandId) {
  if (!commandId) return null;
  let bestKey = null;
  let bestLen = -1;
  for (const [prefix, providerKey] of Object.entries(profile)) {
    if (commandId === prefix || commandId.startsWith(prefix + ".")) {
      if (prefix.length > bestLen) {
        bestLen = prefix.length;
        bestKey = providerKey;
      }
    }
  }
  return bestKey;
}

/**
 * Resolve agent config from SddConfig.
 *
 * Resolution order:
 *   1. Profile: SDD_FORGE_PROFILE env var > agent.useProfile config
 *      - Profile must exist in agent.profiles (throws if not found)
 *      - Command matched via prefix match within the profile
 *      - Falls back to agent.default if no prefix match
 *   2. No profile: uses agent.default directly
 *
 * Providers are merged: BUILTIN_PROVIDERS as base, user agent.providers override.
 *
 * @param {Object} cfg         - SddConfig object
 * @param {string} [commandId] - Dot-separated command ID (e.g. "docs.review")
 * @returns {Object|null} Agent config object, or null if not configured
 * @throws {Error} If the resolved profile name does not exist in agent.profiles
 */
export function resolveAgent(cfg, commandId) {
  const agentSection = cfg.agent || {};
  const userProviders = agentSection.providers || {};
  const defaultAgent = agentSection.default;
  const timeoutMs = agentSection.timeout != null
    ? Number(agentSection.timeout) * 1000
    : DEFAULT_AGENT_TIMEOUT_MS;

  // Merge: built-in providers as base, user-defined providers override
  const providers = { ...BUILTIN_PROVIDERS, ...userProviders };

  const profileName = resolveProfileName(agentSection);

  if (profileName) {
    const profiles = agentSection.profiles;
    if (!profiles || !profiles[profileName]) {
      throw new Error(`Profile "${profileName}" is not defined in agent.profiles.`);
    }
    const profile = profiles[profileName];
    const providerKey = resolveProviderKeyFromProfile(profile, commandId) || defaultAgent;
    if (!providerKey) return null;
    return buildAgentResult(providers, providerKey, timeoutMs);
  }

  // No profile — use default
  if (!defaultAgent) return null;
  return buildAgentResult(providers, defaultAgent, timeoutMs);
}

// ---------------------------------------------------------------------------
// Agent context file utilities
// ---------------------------------------------------------------------------

/**
 * config.agent.workDir を解決する。
 *
 * @param {string} root - プロジェクトルート
 * @param {Object} config - SddConfig
 * @returns {string} 作業ディレクトリの絶対パス
 */
export function resolveWorkDir(root, config) {
  return resolveConfiguredWorkDir(root, config);
}

/**
 * 作業ディレクトリに .claude/rules/ コンテキストファイルを書き込む。
 * Claude CLI が cwd から自動で読み込む。
 *
 * @param {string} workDir - 作業ディレクトリの絶対パス
 * @param {string} content - コンテキスト内容
 * @returns {string} 書き込んだファイルの絶対パス
 */
export function writeAgentContext(workDir, content) {
  const rulesDir = path.join(workDir, ".claude", "rules");
  fs.mkdirSync(rulesDir, { recursive: true });
  const id = crypto.randomUUID().slice(0, 8);
  const filePath = path.join(rulesDir, `sdd-${id}.md`);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

/**
 * コンテキストファイルを削除する。
 *
 * @param {string} filePath - writeAgentContext が返したパス
 */
export function cleanupAgentContext(filePath) {
  try { fs.unlinkSync(filePath); } catch (err) { if (err.code !== "ENOENT") console.error(err); }
}
