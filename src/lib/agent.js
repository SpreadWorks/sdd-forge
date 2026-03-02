/**
 * sdd-forge/lib/agent.js
 *
 * AI agent invocation utility.
 * Provides a shared interface for calling configured AI agents.
 */

import { execFileSync } from "child_process";

/**
 * Call an AI agent with a prompt and return the response.
 *
 * @param {Object} agent        - Agent config ({ command, args })
 * @param {string} prompt       - The prompt text
 * @param {number} [timeoutMs]  - Timeout in milliseconds (default: 120000)
 * @param {string} [cwd]        - Working directory
 * @returns {string} Agent response (trimmed)
 */
export function callAgent(agent, prompt, timeoutMs, cwd) {
  const args = Array.isArray(agent.args) ? [...agent.args] : [];
  const resolvedArgs = args.map((a) =>
    typeof a === "string" ? a.replaceAll("{{PROMPT}}", prompt) : a,
  );

  const hasToken = args.some((a) => typeof a === "string" && a.includes("{{PROMPT}}"));
  const finalArgs = hasToken ? resolvedArgs : [...resolvedArgs, prompt];

  // Remove CLAUDECODE env to avoid nested launch guard
  const env = { ...process.env };
  delete env.CLAUDECODE;

  const result = execFileSync(agent.command, finalArgs, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: timeoutMs || 120000,
    cwd: cwd || process.cwd(),
    env,
  });

  return result.trim();
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
