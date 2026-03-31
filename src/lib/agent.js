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

function buildAgentInvocation(agent, prompt, options) {
  const { systemPrompt } = options || {};
  const args = Array.isArray(agent.args) ? [...agent.args] : [];
  const flag = agent.systemPromptFlag;
  const { prefix } = createSystemPromptPrefix(flag, systemPrompt);
  const effectivePrompt = resolveEffectivePrompt(prompt, systemPrompt, flag);
  const resolvedArgs = resolvePromptArgs(args, effectivePrompt);
  const finalArgs = [...prefix, ...resolvedArgs];
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
  const stdinFinalArgs = [...prefix, ...strippedArgs];
  return { finalArgs: stdinFinalArgs, env, stdinContent: effectivePrompt };
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
 * @param {Object} agent        - Agent config ({ command, args, systemPromptFlag? })
 * @param {string} prompt       - The prompt text
 * @param {number} [timeoutMs]  - Timeout in milliseconds (default: DEFAULT_AGENT_TIMEOUT * 1000)
 * @param {string} [cwd]        - Working directory
 * @param {Object} [options]    - Additional options
 * @param {string} [options.systemPrompt] - System prompt text
 * @returns {string} Agent response (trimmed)
 */
export function callAgent(agent, prompt, timeoutMs, cwd, options) {
  const { finalArgs, env, stdinContent } = buildAgentInvocation(agent, prompt, options);

  const result = execFileSync(agent.command, finalArgs, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: timeoutMs || DEFAULT_AGENT_TIMEOUT_MS,
    cwd: cwd || process.cwd(),
    env,
    ...(stdinContent != null ? { input: stdinContent } : {}),
  });

  return result.trim();
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
  const { retryCount = 0, retryDelayMs = 3000, ...restOptions } = options || {};
  if (retryCount <= 0) {
    return callAgentAsyncOnce(agent, prompt, timeoutMs, cwd, restOptions);
  }
  return callAgentAsyncWithRetry(agent, prompt, timeoutMs, cwd, restOptions, retryCount, retryDelayMs);
}

async function callAgentAsyncWithRetry(agent, prompt, timeoutMs, cwd, options, retryCount, retryDelayMs) {
  let lastError = null;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const result = await callAgentAsyncOnce(agent, prompt, timeoutMs, cwd, options);
      if (result) return result;
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

function callAgentAsyncOnce(agent, prompt, timeoutMs, cwd, options) {
  const { systemPrompt, onStdout, onStderr } = options || {};
  const { finalArgs, env, stdinContent } = buildAgentInvocation(agent, prompt, { systemPrompt });

  const timeout = timeoutMs || DEFAULT_AGENT_TIMEOUT_MS;

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
 * Resolve command-specific agent settings from commands config.
 * Lookup order: commands["docs.review"] → commands["docs"] → null.
 *
 * @param {Object} commands - cfg.commands object
 * @param {string} commandId - Dot-separated command ID (e.g. "docs.review")
 * @returns {{ agent?: string, profile?: string }|null}
 */
function resolveCommandSettings(commands, commandId) {
  if (!commands || !commandId) return null;

  // Exact match
  if (commands[commandId]) return commands[commandId];

  // Parent fallback: "docs.review" → "docs"
  const dotIdx = commandId.lastIndexOf(".");
  if (dotIdx > 0) {
    const parent = commandId.slice(0, dotIdx);
    if (commands[parent]) return commands[parent];
  }

  return null;
}

/**
 * Build final args by concatenating profile args + provider base args.
 *
 * @param {Object} provider - Provider config ({ command, args, profiles? })
 * @param {string} [profileName] - Profile name to look up
 * @returns {string[]} Merged args array
 */
function mergeProfileArgs(provider, profileName) {
  const baseArgs = Array.isArray(provider.args) ? [...provider.args] : [];
  if (!profileName || !provider.profiles) return baseArgs;

  const profileArgs = provider.profiles[profileName];
  if (!Array.isArray(profileArgs) || profileArgs.length === 0) return baseArgs;

  return [...profileArgs, ...baseArgs];
}

/**
 * Resolve agent config from SddConfig.
 *
 * When commandId is provided, resolves via commands config with fallback:
 *   commands["docs.review"] → commands["docs"] → providers[defaultAgent]
 *
 * @param {Object} cfg         - SddConfig object
 * @param {string} [commandId] - Dot-separated command ID (e.g. "docs.review")
 * @returns {Object|null} Agent config object with merged args, or null if not configured
 */
export function resolveAgent(cfg, commandId) {
  const agentSection = cfg.agent || {};
  const commands = agentSection.commands;
  const providers = agentSection.providers;
  const defaultAgent = agentSection.default;

  const cmdSettings = resolveCommandSettings(commands, commandId);

  const agentKey = cmdSettings?.agent || defaultAgent;
  if (!agentKey) return null;

  const provider = providers?.[agentKey];
  if (!provider) return null;

  // No profiles support in provider → return as-is (backward compat)
  if (!cmdSettings && !provider.profiles) return provider;

  const profileName = cmdSettings?.profile || "default";
  const mergedArgs = mergeProfileArgs(provider, profileName);

  return {
    ...provider,
    args: mergedArgs,
  };
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
  const dir = config?.agent?.workDir || ".tmp";
  return path.resolve(root, dir);
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
