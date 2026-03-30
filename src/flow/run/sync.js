#!/usr/bin/env node
/**
 * src/flow/run/sync.js
 *
 * flow run sync [--dry-run]
 * Sync documentation: build -> review -> add -> commit.
 */

import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, PKG_DIR } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--dry-run"],
    defaults: { dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run sync [options]",
        "",
        "Sync documentation: build -> review -> add -> commit.",
        "",
        "Options:",
        "  --dry-run   Preview only",
      ].join("\n"),
    );
    return;
  }

  const docsScript = path.join(PKG_DIR, "docs.js");

  // Step 1: build
  const buildRes = runSync("node", [docsScript, "build"], { cwd: root });
  const buildOutput = (buildRes.stdout || "").trim();

  if (!buildRes.ok) {
    output(fail("run", "sync", "BUILD_FAILED", [
      "docs build failed",
      ...(buildRes.stderr ? [buildRes.stderr.trim()] : []),
      ...(buildOutput ? [buildOutput] : []),
    ]));
    return;
  }

  // Step 2: review
  const reviewRes = runSync("node", [docsScript, "review"], { cwd: root });
  const reviewOutput = (reviewRes.stdout || "").trim();

  if (!reviewRes.ok) {
    output(fail("run", "sync", "REVIEW_FAILED", [
      "docs review failed",
      ...(reviewRes.stderr ? [reviewRes.stderr.trim()] : []),
      ...(reviewOutput ? [reviewOutput] : []),
    ]));
    return;
  }

  if (cli.dryRun) {
    output(ok("run", "sync", {
      result: "dry-run",
      changed: [],
      artifacts: { buildOutput, reviewResult: reviewOutput },
    }));
    return;
  }

  // Step 3: git add (ignore errors for missing files)
  try {
    execFileSync("git", ["add", "docs/", "AGENTS.md", "CLAUDE.md", "README.md"], {
      cwd: root,
      encoding: "utf8",
    });
  } catch (_) {
    // some files may not exist — that's fine
  }

  // Collect changed files
  let changed = [];
  try {
    const diff = execFileSync("git", ["diff", "--cached", "--name-only"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    changed = diff ? diff.split("\n").filter(Boolean) : [];
  } catch (_) {
    // ignore
  }

  // Step 4: commit (skip if nothing to commit)
  if (changed.length > 0) {
    try {
      execFileSync("git", ["commit", "-m", "docs: sync documentation"], {
        cwd: root,
        encoding: "utf8",
      });
    } catch (e) {
      if (!/nothing to commit/i.test(String(e.stderr || e.message || ""))) {
        output(fail("run", "sync", "COMMIT_FAILED", String(e.stderr || e.message)));
        return;
      }
    }
  }

  output(ok("run", "sync", {
    result: changed.length > 0 ? "ok" : "skipped",
    changed,
    artifacts: { buildOutput, reviewResult: reviewOutput },
  }));
}

export { main };
runIfDirect(import.meta.url, main);
