/**
 * src/flow/lib/run-sync.js
 *
 * FlowCommand: sync — sync documentation: build -> review -> add -> commit.
 * requiresFlow: false (can run independently).
 */

import { execFileSync } from "child_process";
import { PKG_DIR } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { FlowCommand } from "./base-command.js";
import path from "path";

export class RunSyncCommand extends FlowCommand {
  constructor() {
    super({ requiresFlow: false });
  }

  async execute(ctx) {
    const { root } = ctx;
    const dryRun = ctx.dryRun || false;

    const docsScript = path.join(PKG_DIR, "docs.js");

    // Step 1: build
    const buildRes = runSync("node", [docsScript, "build"], { cwd: root });
    const buildOutput = (buildRes.stdout || "").trim();

    if (!buildRes.ok) {
      throw new Error(
        ["docs build failed",
          ...(buildRes.stderr ? [buildRes.stderr.trim()] : []),
          ...(buildOutput ? [buildOutput] : []),
        ].join("\n"),
      );
    }

    // Step 2: review
    const reviewRes = runSync("node", [docsScript, "review"], { cwd: root });
    const reviewOutput = (reviewRes.stdout || "").trim();

    if (!reviewRes.ok) {
      throw new Error(
        ["docs review failed",
          ...(reviewRes.stderr ? [reviewRes.stderr.trim()] : []),
          ...(reviewOutput ? [reviewOutput] : []),
        ].join("\n"),
      );
    }

    if (dryRun) {
      return {
        result: "dry-run",
        changed: [],
        artifacts: { buildOutput, reviewResult: reviewOutput },
      };
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
          throw new Error(String(e.stderr || e.message));
        }
      }
    }

    return {
      result: changed.length > 0 ? "ok" : "skipped",
      changed,
      artifacts: { buildOutput, reviewResult: reviewOutput },
    };
  }
}

export default RunSyncCommand;
