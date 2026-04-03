/**
 * src/flow/lib/run-retro.js
 *
 * FlowCommand: retro — evaluate spec accuracy after implementation by comparing
 * spec requirements against git diff. Saves retro.json in the spec directory.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { repairJson } from "../../lib/json-parse.js";
import { FlowCommand } from "./base-command.js";

/**
 * Extract requirements text from spec.md.
 * Returns the raw text of the Requirements section.
 */
function extractRequirements(specText) {
  const match = specText.match(/^\s*##\s+Requirements\b/im);
  if (!match) return "";
  const start = match.index + match[0].length;
  const tail = specText.slice(start);
  const nextHeading = tail.match(/\n\s*##\s+/m);
  return nextHeading ? tail.slice(0, nextHeading.index).trim() : tail.trim();
}

/**
 * Get git diff between base branch and HEAD.
 */
function getDiff(root, baseBranch) {
  try {
    return execFileSync(
      "git", ["diff", `${baseBranch}...HEAD`, "--stat"],
      { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    ).trim();
  } catch (_) {
    return "";
  }
}

/**
 * Get detailed diff for AI evaluation.
 */
function getDetailedDiff(root, baseBranch) {
  try {
    return execFileSync(
      "git", ["diff", `${baseBranch}...HEAD`],
      { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    ).trim();
  } catch (_) {
    return "";
  }
}

/**
 * Build the prompt for AI evaluation.
 */
function buildRetroPrompt(requirementsText, requirements, diff) {
  const reqList = requirements.map((r, i) => `  ${i + 1}. ${r.desc}`).join("\n");

  return [
    "You are evaluating the accuracy of a feature specification after implementation.",
    "Compare the spec requirements against the actual code changes (git diff) and produce a JSON evaluation.",
    "",
    "## Spec Requirements",
    requirementsText,
    "",
    "## Requirements List (from flow.json)",
    reqList,
    "",
    "## Git Diff",
    diff,
    "",
    "## Instructions",
    "For each requirement in the Requirements List, evaluate whether the diff satisfies it.",
    "Also identify any changes in the diff that are NOT covered by any requirement (unplanned changes).",
    "",
    "Output ONLY valid JSON in this exact format (no markdown fencing, no preamble):",
    '{',
    '  "requirements": [',
    '    { "desc": "requirement text", "status": "done|partial|not_done", "note": "brief reason" }',
    '  ],',
    '  "unplanned": [',
    '    { "file": "path/to/file", "change": "brief description of unplanned change" }',
    '  ],',
    '  "summary": {',
    '    "notes": "overall assessment"',
    '  }',
    '}',
  ].join("\n");
}

/**
 * Parse AI response into retro data structure.
 * Adds computed summary fields.
 */
function parseRetroResponse(response, requirements) {
  const cleaned = response.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (_) {
    data = JSON.parse(repairJson(cleaned));
  }

  // Ensure requirements array matches flow.json length
  const reqs = (data.requirements || []).slice(0, requirements.length);
  while (reqs.length < requirements.length) {
    reqs.push({ desc: requirements[reqs.length].desc, status: "not_done", note: "not evaluated" });
  }

  // Compute summary stats
  const total = reqs.length;
  const done = reqs.filter((r) => r.status === "done").length;
  const partial = reqs.filter((r) => r.status === "partial").length;
  const notDone = reqs.filter((r) => r.status === "not_done").length;
  const rate = total > 0 ? (done + partial * 0.5) / total : 0;

  return {
    requirements: reqs,
    unplanned: data.unplanned || [],
    summary: {
      total,
      done,
      partial,
      not_done: notDone,
      rate: Math.round(rate * 100) / 100,
      notes: data.summary?.notes || "",
    },
  };
}

export class RunRetroCommand extends FlowCommand {
  async execute(ctx) {
    const { root } = ctx;
    const force = ctx.force || false;
    const dryRun = ctx.dryRun || false;

    const state = ctx.flowState;

    const specPath = state.spec;
    const specDir = path.resolve(root, path.dirname(specPath));
    const retroPath = path.join(specDir, "retro.json");

    // Check existing retro.json
    if (fs.existsSync(retroPath) && !force) {
      throw new Error("retro.json already exists. Use --force to overwrite.");
    }

    // Read spec
    const absSpecPath = path.resolve(root, specPath);
    if (!fs.existsSync(absSpecPath)) {
      throw new Error(`spec not found: ${specPath}`);
    }
    const specText = fs.readFileSync(absSpecPath, "utf8");
    const requirementsText = extractRequirements(specText);

    // Get requirements from flow.json
    const requirements = state.requirements || [];
    if (requirements.length === 0) {
      throw new Error("no requirements found in flow.json");
    }

    // Get diff
    const baseBranch = state.baseBranch;
    if (!baseBranch) {
      throw new Error("baseBranch not set in flow.json");
    }

    const diffStat = getDiff(root, baseBranch);
    const detailedDiff = getDetailedDiff(root, baseBranch);

    if (!detailedDiff) {
      throw new Error("no diff found between base branch and HEAD");
    }

    if (dryRun) {
      return {
        result: "dry-run",
        artifacts: {
          spec: specPath,
          baseBranch,
          retroPath: path.relative(root, retroPath),
          requirementsCount: requirements.length,
          diffStat,
        },
      };
    }

    // Resolve AI agent
    const config = ctx.config;
    if (!config) {
      throw new Error("failed to load config");
    }

    const agent = resolveAgent(config, "flow.retro");
    if (!agent) {
      throw new Error("no AI agent configured (agent.default or agent.commands.flow.retro)");
    }

    // Build prompt and call AI
    const prompt = buildRetroPrompt(requirementsText, requirements, detailedDiff);

    let response;
    try {
      response = callAgent(agent, prompt);
    } catch (e) {
      throw new Error(`AI agent call failed: ${e.message}`);
    }

    // Parse response
    let retroData;
    try {
      retroData = parseRetroResponse(response, requirements);
    } catch (e) {
      throw new Error(`failed to parse AI response: ${e.message}`);
    }

    // Build retro.json
    const retro = {
      spec: specPath,
      date: new Date().toISOString(),
      ...retroData,
    };

    // Write retro.json
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(retroPath, JSON.stringify(retro, null, 2) + "\n", "utf8");

    return {
      result: "ok",
      changed: [path.relative(root, retroPath)],
      artifacts: {
        spec: specPath,
        retroPath: path.relative(root, retroPath),
        summary: retro.summary,
      },
    };
  }
}

export default RunRetroCommand;
export { extractRequirements, buildRetroPrompt, parseRetroResponse };
