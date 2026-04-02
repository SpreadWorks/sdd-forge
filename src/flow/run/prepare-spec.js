/**
 * src/flow/run/prepare-spec.js
 *
 * flow run prepare-spec — create branch/worktree and initialize spec directory.
 * Returns JSON envelope.
 */

import fs from "fs";
import path from "path";
import { parseArgs, isInsideWorktree } from "../../lib/cli.js";
import { sddConfigPath, sddDir, DEFAULT_LANG } from "../../lib/config.js";
import { runSync } from "../../lib/process.js";
import { translate } from "../../lib/i18n.js";
import { saveFlowState, buildInitialSteps, addActiveFlow, cleanStaleFlows } from "../../lib/flow-state.js";
import { getWorktreeStatus } from "../../lib/git-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function runGit(root, args) {
  const res = runSync("git", ["-C", root, ...args]);
  if (res.ok) return res.stdout.trim();
  throw new Error(`git ${args.join(" ")} failed: ${(res.stderr || "").trim()}`);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function nextIndex(root) {
  const specsDir = path.join(root, "specs");
  let max = 0;

  if (fs.existsSync(specsDir)) {
    for (const ent of fs.readdirSync(specsDir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const m = ent.name.match(/^([0-9]{3})-/);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }

  const branchLines = runGit(root, ["branch", "--list", "feature/[0-9][0-9][0-9]-*"])
    .split("\n")
    .map((x) => x.replace(/^[* ]+/, "").trim())
    .filter(Boolean);
  for (const b of branchLines) {
    const m = b.match(/^feature\/([0-9]{3})-/);
    if (m) max = Math.max(max, Number(m[1]));
  }

  return max + 1;
}

function ensureClean(root) {
  const status = runGit(root, ["status", "--porcelain"]);
  if (status.trim()) {
    throw new Error("worktree is dirty. commit/stash before spec.");
  }
}

function ensureBaseBranch(root, base) {
  try {
    runGit(root, ["rev-parse", "--verify", base]);
  } catch (_) {
    throw new Error(`base branch not found: ${base}`);
  }
}

function detectBaseBranch(root) {
  try {
    return runGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  } catch (_) {
    return "main";
  }
}

function buildQaTemplate() {
  const t = translate();
  const prompt = t("messages:spec.qaConfirmationPrompt");
  return [
    "# Clarification Q&A",
    "",
    "- Q: ",
    "  - A: ",
    "",
    "## Confirmation",
    "- Before implementation, ask the user:",
    `  - "${prompt}"`,
    "- If approved, update `spec.md` -> `## User Confirmation` with checked state.",
    "",
  ].join("\n");
}

const DEFAULT_SPEC_TEMPLATE = `# Feature Specification: {{SPEC_DIR}}

**Feature Branch**: \`{{BRANCH_NAME}}\`
**Created**: {{DATE}}
**Status**: Draft
**Input**: User request

## Goal
-

## Scope
-

## Out of Scope
-

## Clarifications (Q&A)
- Q:
  - A:

## User Confirmation
- [ ] User approved this spec
- Confirmed at:
- Notes:

## Requirements
-

## Acceptance Criteria
-

## Open Questions
- [ ]
`;

function loadLocalTemplate(root, lang, fileName, fallback) {
  const localPath = path.join(root, ".sdd-forge", "templates", lang, "specs", fileName);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, "utf8");
  return fallback;
}

function createQaTemplate(root, lang) {
  return loadLocalTemplate(root, lang, "qa.md", buildQaTemplate());
}

function createSpecTemplate({ branchName, specDirName }, root, lang) {
  const template = loadLocalTemplate(root, lang, "spec.md", DEFAULT_SPEC_TEMPLATE);
  const today = new Date().toISOString().slice(0, 10);
  return template
    .replace(/\{\{BRANCH_NAME\}\}/g, branchName)
    .replace(/\{\{SPEC_DIR\}\}/g, specDirName)
    .replace(/\{\{DATE\}\}/g, today)
    .replace(/\{\{STATUS\}\}/g, "Draft");
}

export async function execute(ctx) {
  const { root } = ctx;

  // Dirty worktree check — abort early if uncommitted changes exist
  const { dirty, dirtyFiles } = getWorktreeStatus(root);
  if (dirty) {
    output(fail("run", "prepare-spec", "DIRTY_WORKTREE", dirtyFiles));
    return;
  }

  const cli = parseArgs(ctx.args, {
    flags: ["--no-branch", "--worktree", "--dry-run"],
    options: ["--title", "--base", "--issue", "--request"],
    defaults: { title: "", base: "", issue: "", request: "", noBranch: false, worktree: false, dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow prepare [options]",
        "",
        "Create branch/worktree and initialize spec directory.",
        "",
        "Options:",
        "  --title <name>     Feature title (required)",
        "  --base <branch>    Base branch (default: current HEAD)",
        "  --worktree         Use git worktree mode",
        "  --no-branch        Spec-only mode (no branch creation)",
        "  --issue <number>   GitHub Issue number to link",
        "  --request <text>   User request text to save in flow.json",
        "  --dry-run          Show what would happen without executing",
      ].join("\n"),
    );
    return;
  }

  if (!cli.title) {
    output(fail("run", "prepare-spec", "MISSING_TITLE", "--title is required"));
    return;
  }

  const config = ctx.config;
  if (!config) {
    output(fail("run", "prepare-spec", "NO_CONFIG", "config.json not found"));
    return;
  }
  const lang = config.lang || DEFAULT_LANG;
  cli.base = cli.base || detectBaseBranch(root);

  // Determine branching strategy
  const inWorktree = isInsideWorktree(root);
  const skipBranch = cli.noBranch || inWorktree;
  const useWorktree = !skipBranch && cli.worktree;

  if (!cli.dryRun) ensureClean(root);
  if (!skipBranch) ensureBaseBranch(root, cli.base);

  const idx = String(nextIndex(root)).padStart(3, "0");
  const slug = slugify(cli.title) || "feature";
  const branchName = `feature/${idx}-${slug}`;
  const specDirName = `${idx}-${slug}`;

  // Determine where spec files live
  const worktreePath = useWorktree
    ? path.join(sddDir(root), "worktree", branchName.replace(/\//g, "-"))
    : null;
  const specRoot = useWorktree ? worktreePath : root;
  const specDir = path.join(specRoot, "specs", specDirName);
  const specPath = path.join(specDir, "spec.md");
  const qaPath = path.join(specDir, "qa.md");

  if (cli.dryRun) {
    const mode = useWorktree ? "worktree" : skipBranch ? "spec-only" : "branch";
    output(ok("run", "prepare-spec", {
      result: "dry-run",
      changed: [],
      artifacts: { specDir: `specs/${specDirName}`, branch: branchName, worktree: worktreePath, mode },
      next: null,
      output: [
        `[dry-run] mode: ${mode}`,
        `[dry-run] base: ${cli.base}`,
        `[dry-run] branch: ${branchName}`,
        `[dry-run] spec dir: specs/${specDirName}`,
      ].join("\n"),
    }));
    return;
  }

  // Helper: write spec files
  function writeSpecFiles() {
    fs.mkdirSync(specDir, { recursive: true });
    if (!fs.existsSync(specPath)) {
      fs.writeFileSync(specPath, createSpecTemplate({ branchName, specDirName }, root, lang));
    }
    if (!fs.existsSync(qaPath)) {
      fs.writeFileSync(qaPath, createQaTemplate(root, lang));
    }
  }

  // Helper: write flow.json state
  // NOTE: prepare-spec writes issue/request directly into flow.json at creation time.
  // This is an exception to the hook pattern — prepare-spec is the only command that
  // *creates* flow.json. All other run commands operate on an existing flow.json
  // and use registry hooks for state writes.
  function writeFlowState(extra) {
    const steps = buildInitialSteps();
    for (const id of ["approach", "branch", "spec"]) {
      const step = steps.find((s) => s.id === id);
      if (step) step.status = "done";
    }
    const state = {
      spec: `specs/${specDirName}/spec.md`,
      baseBranch: cli.base,
      featureBranch: branchName,
      steps,
      requirements: [],
      ...(cli.issue ? { issue: Number(cli.issue) } : {}),
      ...(cli.request ? { request: cli.request } : {}),
      ...extra,
    };
    saveFlowState(specRoot, state);
  }

  // Clean stale .active-flow entries before creating a new flow
  cleanStaleFlows(root);

  const changed = [`specs/${specDirName}/spec.md`, `specs/${specDirName}/qa.md`];
  const lines = [];

  if (useWorktree) {
    runGit(root, ["worktree", "add", worktreePath, "-b", branchName, cli.base]);
    writeSpecFiles();
    writeFlowState({ worktree: true });
    addActiveFlow(root, specDirName, "worktree");
    lines.push(
      `created worktree: ${worktreePath}`,
      `created branch: ${branchName} (from ${cli.base})`,
      `created spec: specs/${specDirName}/spec.md`,
      `created qa: specs/${specDirName}/qa.md`,
      "",
      "next:",
      `1) cd ${worktreePath}`,
      `2) fill specs/${specDirName}/spec.md`,
      `3) run: sdd-forge spec gate --spec specs/${specDirName}/spec.md`,
      `4) start implementation`,
    );
  } else if (skipBranch) {
    writeSpecFiles();
    writeFlowState();
    addActiveFlow(root, specDirName, "local");
    lines.push(
      `created spec: specs/${specDirName}/spec.md`,
      `created qa: specs/${specDirName}/qa.md`,
      "",
      "next:",
      `1) fill specs/${specDirName}/spec.md`,
      `2) run: sdd-forge spec gate --spec specs/${specDirName}/spec.md`,
      `3) start implementation`,
    );
  } else {
    runGit(root, ["checkout", "-b", branchName, cli.base]);
    writeSpecFiles();
    writeFlowState();
    addActiveFlow(root, specDirName, "branch");
    lines.push(
      `created branch: ${branchName} (from ${cli.base})`,
      `created spec: specs/${specDirName}/spec.md`,
      `created qa: specs/${specDirName}/qa.md`,
      "",
      "next:",
      `1) fill specs/${specDirName}/spec.md`,
      `2) run: sdd-forge spec gate --spec specs/${specDirName}/spec.md`,
      `3) start implementation`,
    );
  }

  output(ok("run", "prepare-spec", {
    result: "ok",
    changed,
    artifacts: {
      specDir: `specs/${specDirName}`,
      branch: branchName,
      worktree: worktreePath,
      mode: useWorktree ? "worktree" : (skipBranch ? "spec-only" : "branch"),
    },
    next: "draft",
    output: lines.join("\n"),
  }));
}
