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

export const DEFAULT_AGENT_TIMEOUT_MS = 120000;
export const LONG_AGENT_TIMEOUT_MS = 300000;
export const MID_AGENT_TIMEOUT_MS = 180000;

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
 * @param {number} [timeoutMs]  - Timeout in milliseconds (default: 120000)
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
 * @param {number} [timeoutMs]  - Timeout in milliseconds (default: 120000)
 * @param {string} [cwd]        - Working directory
 * @param {Object} [options]    - Additional options
 * @param {string} [options.systemPrompt] - System prompt text
 * @param {function} [options.onStdout] - Streaming callback for stdout chunks
 * @param {function} [options.onStderr] - Streaming callback for stderr chunks
 * @returns {Promise<string>} Agent response (trimmed)
 */
export function callAgentAsync(agent, prompt, timeoutMs, cwd, options) {
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
 * Load agent config from SddConfig by provider name.
 *
 * @param {Object} cfg       - SddConfig object
 * @param {string} [agentName] - Agent name override (defaults to cfg.defaultAgent)
 * @returns {Object} Agent config object
 * @throws {Error} If no agent is configured or provider is unknown
 */
export function loadAgentConfig(cfg, agentName) {
  const providerKey = agentName || cfg.defaultAgent;
  if (!providerKey) {
    throw new Error("No default agent configured. Set 'defaultAgent' in config.json or run 'sdd-forge setup'.");
  }
  const provider = cfg.providers?.[providerKey];
  if (!provider) {
    throw new Error(`Unknown agent provider: ${providerKey}. Available: ${Object.keys(cfg.providers || {}).join(", ")}`);
  }
  return provider;
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
 * Resolve agent config from SddConfig.
 *
 * @param {Object} cfg       - SddConfig object
 * @param {string} [agentName] - Agent name override (defaults to cfg.defaultAgent)
 * @returns {Object|null} Agent config object, or null if not configured
 */
export function resolveAgent(cfg, agentName) {
  const key = agentName || cfg.defaultAgent;
  if (!key) return null;
  return cfg.providers?.[key] || null;
}

// ---------------------------------------------------------------------------
// Agent context file utilities
// ---------------------------------------------------------------------------

/**
 * config.agentWorkDir を解決する。
 *
 * @param {string} root - プロジェクトルート
 * @param {Object} config - SddConfig
 * @returns {string} 作業ディレクトリの絶対パス
 */
export function resolveWorkDir(root, config) {
  const dir = config?.agentWorkDir || ".tmp";
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
  try { fs.unlinkSync(filePath); } catch (_) {}
}
