/**
 * src/flow/run/retro.js
 *
 * flow run retro [--force] [--dry-run]
 * Evaluate spec accuracy after implementation by comparing spec requirements
 * against git diff. Saves retro.json in the spec directory.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { parseArgs } from "../../lib/cli.js";
import { callAgent, resolveAgent } from "../../lib/agent.js";
import { ok, fail } from "../../lib/flow-envelope.js";

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
  const data = JSON.parse(cleaned);

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

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
    flags: ["--force", "--dry-run"],
    defaults: { force: false, dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run retro [options]",
        "",
        "Evaluate spec accuracy after implementation.",
        "Compares spec requirements against git diff and saves retro.json.",
        "",
        "Options:",
        "  --force     Overwrite existing retro.json",
        "  --dry-run   Preview only, do not write retro.json",
      ].join("\n"),
    );
    return;
  }

  // Load flow state
  const state = ctx.flowState;
  if (!state) {
    return fail("run", "retro", "NO_FLOW", "no active flow (flow.json not found)"));

  }

  const specPath = state.spec;
  const specDir = path.resolve(root, path.dirname(specPath));
  const retroPath = path.join(specDir, "retro.json");

  // Check existing retro.json
  if (fs.existsSync(retroPath) && !cli.force) {
    return fail("run", "retro", "RETRO_EXISTS", "retro.json already exists. Use --force to overwrite."));

  }

  // Read spec
  const absSpecPath = path.resolve(root, specPath);
  if (!fs.existsSync(absSpecPath)) {
    return fail("run", "retro", "SPEC_NOT_FOUND", `spec not found: ${specPath}`));

  }
  const specText = fs.readFileSync(absSpecPath, "utf8");
  const requirementsText = extractRequirements(specText);

  // Get requirements from flow.json
  const requirements = state.requirements || [];
  if (requirements.length === 0) {
    return fail("run", "retro", "NO_REQUIREMENTS", "no requirements found in flow.json"));

  }

  // Get diff
  const baseBranch = state.baseBranch;
  if (!baseBranch) {
    return fail("run", "retro", "NO_BASE_BRANCH", "baseBranch not set in flow.json"));

  }

  const diffStat = getDiff(root, baseBranch);
  const detailedDiff = getDetailedDiff(root, baseBranch);

  if (!detailedDiff) {
    return fail("run", "retro", "NO_DIFF", "no diff found between base branch and HEAD"));

  }

  if (cli.dryRun) {
    return ok("run", "retro", {
      result: "dry-run",
      artifacts: {
        spec: specPath,
        baseBranch,
        retroPath: path.relative(root, retroPath),
        requirementsCount: requirements.length,
        diffStat,
      },
    }));
  }

  // Resolve AI agent
  const config = ctx.config;
  if (!config) {
    return fail("run", "retro", "CONFIG_ERROR", "failed to load config"));

  }

  const agent = resolveAgent(config, "flow.retro");
  if (!agent) {
    return fail("run", "retro", "NO_AGENT", "no AI agent configured (agent.default or agent.commands.flow.retro)"));

  }

  // Build prompt and call AI
  const prompt = buildRetroPrompt(requirementsText, requirements, detailedDiff);

  let response;
  try {
    response = callAgent(agent, prompt);
  } catch (e) {
    return fail("run", "retro", "AGENT_ERROR", `AI agent call failed: ${e.message}`));

  }

  // Parse response
  let retroData;
  try {
    retroData = parseRetroResponse(response, requirements);
  } catch (e) {
    return fail("run", "retro", "PARSE_ERROR", `failed to parse AI response: ${e.message}`));

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

  return ok("run", "retro", {
    result: "ok",
    changed: [path.relative(root, retroPath)],
    artifacts: {
      spec: specPath,
      retroPath: path.relative(root, retroPath),
      summary: retro.summary,
    },
  });
}

export { extractRequirements, buildRetroPrompt, parseRetroResponse };
