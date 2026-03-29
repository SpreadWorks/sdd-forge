#!/usr/bin/env node
/**
 * src/flow/run/prepare-spec.js
 *
 * flow run prepare-spec — wraps `spec init` to create branch/worktree and
 * initialize spec directory. Returns JSON envelope.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, PKG_DIR } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--no-branch", "--worktree", "--dry-run"],
    options: ["--title", "--base"],
    defaults: { title: "", base: "", noBranch: false, worktree: false, dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run prepare-spec [options]",
        "",
        "Create branch/worktree and initialize spec directory.",
        "",
        "Options:",
        "  --title <name>   Feature title (required)",
        "  --base <branch>  Base branch (default: current HEAD)",
        "  --worktree       Use git worktree mode",
        "  --no-branch      Spec-only mode (no branch creation)",
        "  --dry-run        Show what would happen without executing",
      ].join("\n"),
    );
    return;
  }

  if (!cli.title) {
    output(fail("run", "prepare-spec", "MISSING_TITLE", "--title is required"));
    return;
  }

  // Build args for spec init
  const scriptPath = path.join(PKG_DIR, "spec", "commands", "init.js");
  const args = ["--title", cli.title];
  if (cli.base) args.push("--base", cli.base);
  if (cli.worktree) args.push("--worktree");
  if (cli.noBranch) args.push("--no-branch");
  if (cli.dryRun) args.push("--dry-run");

  const res = runSync("node", [scriptPath, ...args], { cwd: root });

  if (!res.ok) {
    output(fail("run", "prepare-spec", "SPEC_INIT_FAILED", [
      "spec init failed",
      ...(res.stderr ? [res.stderr.trim()] : []),
      ...(res.stdout ? [res.stdout.trim()] : []),
    ]));
    return;
  }

  const stdout = res.stdout.trim();

  // Parse output for artifacts
  const branchMatch = stdout.match(/created branch:\s*(\S+)/);
  const specDirMatch = stdout.match(/created spec:\s*(\S+)/);
  const worktreeMatch = stdout.match(/created worktree:\s*(\S+)/);
  const dryRunMode = stdout.match(/\[dry-run\] mode:\s*(\S+)/);

  const branch = branchMatch ? branchMatch[1] : null;
  const specDir = specDirMatch ? path.dirname(specDirMatch[1]) : null;
  const worktreePath = worktreeMatch ? worktreeMatch[1] : null;

  const changed = [];
  if (specDirMatch) changed.push(specDirMatch[1]);
  const qaMatch = stdout.match(/created qa:\s*(\S+)/);
  if (qaMatch) changed.push(qaMatch[1]);

  const next = cli.dryRun ? null : "draft";

  output(ok("run", "prepare-spec", {
    result: cli.dryRun ? "dry-run" : "ok",
    changed,
    artifacts: {
      specDir,
      branch,
      worktree: worktreePath,
      mode: dryRunMode ? dryRunMode[1] : (worktreePath ? "worktree" : (cli.noBranch ? "spec-only" : "branch")),
    },
    next,
    output: stdout,
  }));
}

export { main };
runIfDirect(import.meta.url, main);
