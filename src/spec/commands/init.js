#!/usr/bin/env node
/**
 * sdd-forge/spec/spec.js
 *
 * development から連番 feature ブランチを作成し、同じ連番で specs ディレクトリを初期化する。
 *
 * 例:
 *   node sdd-forge/spec/spec.js --title "contact-form"
 *   node sdd-forge/spec/spec.js --title "contact-form" --dry-run
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, isInsideWorktree } from "../../lib/cli.js";
import { sddConfigPath, sddDir, DEFAULT_LANG } from "../../lib/config.js";
import { runSync } from "../../lib/process.js";
import { translate } from "../../lib/i18n.js";
import { saveFlowState, buildInitialSteps } from "../../lib/flow-state.js";

function runGit(root, args) {
  const res = runSync("git", ["-C", root, ...args]);
  if (res.ok) {
    return res.stdout.trim();
  }
  throw new Error(
    `git ${args.join(" ")} failed: ${(res.stderr || "").trim()}`,
  );
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

/**
 * Detect the default base branch.
 * Uses the current branch (HEAD).
 */
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

/**
 * Load project-local template if it exists, otherwise return the default.
 */
function loadLocalTemplate(root, lang, fileName, fallback) {
  const localPath = path.join(root, ".sdd-forge", "templates", lang, "specs", fileName);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, "utf8");
  }
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

function main() {
  const opts = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--allow-dirty", "--no-branch", "--worktree"],
    options: ["--title", "--base"],
    defaults: { title: "", base: "", dryRun: false, allowDirty: false, noBranch: false, worktree: false },
  });
  if (opts.help) {
    const tu = translate();
    const h = tu.raw("ui:help.cmdHelp.spec");
    const o = h.options;
    console.log(
      [
        h.usage, "", "Options:",
        `  ${o.title}`, `  ${o.base}`, `  ${o.dryRun}`,
        `  ${o.allowDirty}`, `  ${o.noBranch}`, `  ${o.worktree}`,
      ].join("\n"),
    );
    return;
  }
  if (!opts.title) {
    throw new Error("--title is required");
  }
  const root = repoRoot(import.meta.url);
  const configPath = sddConfigPath(root);
  const sddConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : null;
  const lang = sddConfig?.lang || DEFAULT_LANG;
  opts.base = opts.base || detectBaseBranch(root);

  // Determine branching strategy
  const inWorktree = isInsideWorktree(root);
  const skipBranch = opts.noBranch || inWorktree;
  const useWorktree = !skipBranch && opts.worktree;

  if (!opts.dryRun && !opts.allowDirty) {
    ensureClean(root);
  }
  if (!skipBranch) {
    ensureBaseBranch(root, opts.base);
  }

  const idx = String(nextIndex(root)).padStart(3, "0");
  const slug = slugify(opts.title) || "feature";
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

  if (opts.dryRun) {
    const mode = useWorktree ? "worktree" : skipBranch ? "spec-only" : "branch";
    const lines = [
      `[dry-run] mode: ${mode}`,
      `[dry-run] base: ${opts.base}`,
      `[dry-run] branch: ${branchName}`,
      `[dry-run] spec dir: specs/${specDirName}`,
      `[dry-run] spec file: specs/${specDirName}/spec.md`,
    ];
    if (useWorktree) {
      lines.push(`[dry-run] worktree: ${worktreePath}`);
    }
    console.log(lines.join("\n"));
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
  function writeFlowState(extra) {
    const state = {
      spec: `specs/${specDirName}/spec.md`,
      baseBranch: opts.base,
      featureBranch: branchName,
      steps: buildInitialSteps(),
      requirements: [],
      ...extra,
    };
    saveFlowState(root, state);
  }

  if (useWorktree) {
    // Create worktree with new branch
    const absPath = worktreePath;
    runGit(root, ["worktree", "add", absPath, "-b", branchName, opts.base]);
    writeSpecFiles();
    writeFlowState({ worktree: true, worktreePath: absPath });
    console.log(
      [
        `created worktree: ${absPath}`,
        `created branch: ${branchName} (from ${opts.base})`,
        `created spec: specs/${specDirName}/spec.md`,
        `created qa: specs/${specDirName}/qa.md`,
        "",
        "next:",
        `1) cd ${absPath}`,
        `2) fill specs/${specDirName}/spec.md`,
        `3) run: sdd-forge spec gate --spec specs/${specDirName}/spec.md`,
        `4) start implementation`,
      ].join("\n"),
    );
  } else if (skipBranch) {
    // Spec-only: no branch creation
    writeSpecFiles();
    writeFlowState();
    console.log(
      [
        `created spec: ${path.relative(root, specPath)}`,
        `created qa: ${path.relative(root, qaPath)}`,
        "",
        "next:",
        `1) fill ${path.relative(root, specPath)}`,
        `2) run: sdd-forge spec gate --spec ${path.relative(root, specPath)}`,
        `3) start implementation`,
      ].join("\n"),
    );
  } else {
    // Default: create branch
    runGit(root, ["checkout", "-b", branchName, opts.base]);
    writeSpecFiles();
    writeFlowState();
    console.log(
      [
        `created branch: ${branchName} (from ${opts.base})`,
        `created spec: ${path.relative(root, specPath)}`,
        `created qa: ${path.relative(root, qaPath)}`,
        "",
        "next:",
        `1) fill ${path.relative(root, specPath)}`,
        `2) run: sdd-forge spec gate --spec ${path.relative(root, specPath)}`,
        `3) start implementation`,
      ].join("\n"),
    );
  }
}

export { main };

runIfDirect(import.meta.url, main);
