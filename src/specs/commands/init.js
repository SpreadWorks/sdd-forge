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
import { fileURLToPath } from "url";
import { repoRoot, parseArgs, isInsideWorktree } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";

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
 * Detect the default base branch (main or master).
 */
function detectBaseBranch(root) {
  for (const candidate of ["main", "master"]) {
    try {
      runGit(root, ["rev-parse", "--verify", candidate]);
      return candidate;
    } catch (_) {
      // try next
    }
  }
  return "main"; // fallback
}

function createQaTemplate() {
  return [
    "# Clarification Q&A",
    "",
    "- Q: ",
    "  - A: ",
    "",
    "## Confirmation",
    "- Before implementation, ask the user:",
    '  - "この仕様で実装して問題ないですか？"',
    "- If approved, update `spec.md` -> `## User Confirmation` with checked state.",
    "",
  ].join("\n");
}

function createSpecTemplate({ branchName, specDirName }) {
  const today = new Date().toISOString().slice(0, 10);
  return `# Feature Specification: ${specDirName}

**Feature Branch**: \`${branchName}\`
**Created**: ${today}
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
}

function main() {
  const opts = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run", "--allow-dirty", "--no-branch"],
    options: ["--title", "--base", "--worktree"],
    defaults: { title: "", base: "", dryRun: false, allowDirty: false, noBranch: false, worktree: "" },
  });
  if (opts.help) {
    console.log(
      [
        "Usage: node sdd-forge/spec/spec.js --title <name> [options]",
        "",
        "Options:",
        "  --title <name>      連番の後ろに付与する短い名前（必須）",
        "  --base <branch>     ブランチ作成元 (default: auto-detect main/master)",
        "  --dry-run           変更せず結果のみ表示",
        "  --allow-dirty       ワークツリーが dirty でも続行する",
        "  --no-branch         ブランチを作成せず spec のみ作成する",
        "  --worktree <path>   git worktree を作成して spec を配置する",
      ].join("\n"),
    );
    return;
  }
  if (!opts.title) {
    throw new Error("--title is required");
  }
  const root = repoRoot(import.meta.url);
  opts.base = opts.base || detectBaseBranch(root);

  // Determine branching strategy
  const inWorktree = isInsideWorktree(root);
  const skipBranch = opts.noBranch || inWorktree;
  const useWorktree = !skipBranch && !!opts.worktree;

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
  const specRoot = useWorktree ? path.resolve(opts.worktree) : root;
  const specDir = path.join(specRoot, "specs", specDirName);
  const specPath = path.join(specDir, "spec.md");
  const qaPath = path.join(specDir, "qa.md");

  if (opts.dryRun) {
    const mode = useWorktree ? "worktree" : skipBranch ? "spec-only" : "branch";
    const lines = [
      `[dry-run] mode: ${mode}`,
      `[dry-run] branch: ${branchName}`,
      `[dry-run] spec dir: specs/${specDirName}`,
      `[dry-run] spec file: specs/${specDirName}/spec.md`,
    ];
    if (useWorktree) {
      lines.push(`[dry-run] worktree: ${specRoot}`);
    }
    console.log(lines.join("\n"));
    return;
  }

  if (useWorktree) {
    // Create worktree with new branch
    const absPath = path.resolve(opts.worktree);
    runGit(root, ["worktree", "add", absPath, "-b", branchName, opts.base]);
    // Create spec files inside worktree
    fs.mkdirSync(specDir, { recursive: true });
    if (!fs.existsSync(specPath)) {
      fs.writeFileSync(specPath, createSpecTemplate({ branchName, specDirName }));
    }
    if (!fs.existsSync(qaPath)) {
      fs.writeFileSync(qaPath, createQaTemplate());
    }
    console.log(
      [
        `created worktree: ${absPath}`,
        `created branch: ${branchName}`,
        `created spec: specs/${specDirName}/spec.md`,
        `created qa: specs/${specDirName}/qa.md`,
        "",
        "next:",
        `1) cd ${absPath}`,
        `2) fill specs/${specDirName}/spec.md`,
        `3) run: sdd-forge gate --spec specs/${specDirName}/spec.md`,
        `4) start implementation`,
      ].join("\n"),
    );
  } else if (skipBranch) {
    // Spec-only: no branch creation
    fs.mkdirSync(specDir, { recursive: true });
    if (!fs.existsSync(specPath)) {
      fs.writeFileSync(specPath, createSpecTemplate({ branchName, specDirName }));
    }
    if (!fs.existsSync(qaPath)) {
      fs.writeFileSync(qaPath, createQaTemplate());
    }
    console.log(
      [
        `created spec: ${path.relative(root, specPath)}`,
        `created qa: ${path.relative(root, qaPath)}`,
        "",
        "next:",
        `1) fill ${path.relative(root, specPath)}`,
        `2) run: sdd-forge gate --spec ${path.relative(root, specPath)}`,
        `3) start implementation`,
      ].join("\n"),
    );
  } else {
    // Default: create branch
    runGit(root, ["checkout", "-b", branchName, opts.base]);
    fs.mkdirSync(specDir, { recursive: true });
    if (!fs.existsSync(specPath)) {
      fs.writeFileSync(specPath, createSpecTemplate({ branchName, specDirName }));
    }
    if (!fs.existsSync(qaPath)) {
      fs.writeFileSync(qaPath, createQaTemplate());
    }
    console.log(
      [
        `created branch: ${branchName}`,
        `created spec: ${path.relative(root, specPath)}`,
        `created qa: ${path.relative(root, qaPath)}`,
        "",
        "next:",
        `1) fill ${path.relative(root, specPath)}`,
        `2) run: npm run sdd:gate -- --spec ${path.relative(root, specPath)}`,
        `3) start implementation`,
      ].join("\n"),
    );
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}
