/**
 * sdd-forge/lib/agent.js
 *
 * AI agent invocation utility.
 * Provides a shared interface for calling configured AI agents.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync, spawn } from "child_process";

export const DEFAULT_AGENT_TIMEOUT_MS = 120000;
export const LONG_AGENT_TIMEOUT_MS = 300000;
export const MID_AGENT_TIMEOUT_MS = 180000;

function createSystemPromptPrefix(flag, systemPrompt) {
  if (!flag || !systemPrompt) return { prefix: [], cleanupFile: null };
  if (flag === "--system-prompt-file") {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-forge-"));
    const tmpFile = path.join(tmpDir, "system-prompt.md");
    fs.writeFileSync(tmpFile, systemPrompt, "utf8");
    return { prefix: [flag, tmpFile], cleanupFile: tmpFile };
  }
  return { prefix: [flag, systemPrompt], cleanupFile: null };
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

function cleanupTempPromptFile(cleanupFile) {
  if (!cleanupFile) return;
  try { fs.unlinkSync(cleanupFile); fs.rmdirSync(path.dirname(cleanupFile)); } catch (_) {}
}

function buildAgentInvocation(agent, prompt, options) {
  const { systemPrompt } = options || {};
  const args = Array.isArray(agent.args) ? [...agent.args] : [];
  const flag = agent.systemPromptFlag;
  const { prefix, cleanupFile } = createSystemPromptPrefix(flag, systemPrompt);
  const effectivePrompt = resolveEffectivePrompt(prompt, systemPrompt, flag);
  const resolvedArgs = resolvePromptArgs(args, effectivePrompt);
  const finalArgs = [...prefix, ...resolvedArgs];
  const env = { ...process.env };
  delete env.CLAUDECODE;
  return { finalArgs, env, cleanupFile };
}

/**
 * Call an AI agent with a prompt and return the response.
 *
 * When `options.systemPrompt` is provided:
 *   - If agent.systemPromptFlag is set (e.g. "--system-prompt"),
 *     the flag + systemPrompt are prepended to the argument list.
 *   - If agent.systemPromptFlag is "--system-prompt-file",
 *     a temp file is written and cleaned up after execution.
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
  const { finalArgs, env, cleanupFile } = buildAgentInvocation(agent, prompt, options);

  try {
    const result = execFileSync(agent.command, finalArgs, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: timeoutMs || DEFAULT_AGENT_TIMEOUT_MS,
      cwd: cwd || process.cwd(),
      env,
    });

    return result.trim();
  } finally {
    cleanupTempPromptFile(cleanupFile);
  }
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
  const { finalArgs, env, cleanupFile } = buildAgentInvocation(agent, prompt, { systemPrompt });

  const timeout = timeoutMs || DEFAULT_AGENT_TIMEOUT_MS;

  function cleanup() {
    cleanupTempPromptFile(cleanupFile);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(agent.command, finalArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: cwd || process.cwd(),
      env,
    });

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
      cleanup();
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
      cleanup();
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
