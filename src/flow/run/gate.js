#!/usr/bin/env node
/**
 * src/flow/run/gate.js
 *
 * flow run gate — wraps `spec gate` to check spec readiness.
 * Returns JSON envelope with PASS/FAIL result.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, PKG_DIR } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import path from "path";

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    options: ["--spec", "--phase"],
    flags: ["--skip-guardrail"],
    defaults: { spec: "", phase: "pre", skipGuardrail: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run gate [options]",
        "",
        "Run spec gate check. Resolves --spec from flow.json if omitted.",
        "",
        "Options:",
        "  --spec <path>       Path to spec.md (auto-resolved from flow.json)",
        "  --phase <pre|post>  Gate phase (default: pre)",
        "  --skip-guardrail    Skip AI guardrail compliance check",
      ].join("\n"),
    );
    return;
  }

  // Resolve spec path from flow state if not provided
  let specPath = cli.spec;
  if (!specPath) {
    const state = loadFlowState(root);
    if (state?.spec) {
      specPath = state.spec;
    } else {
      output(fail("run", "gate", "NO_SPEC", "no --spec provided and no active flow found"));
      return;
    }
  }

  // Build args for spec gate
  const scriptPath = path.join(PKG_DIR, "spec", "commands", "gate.js");
  const args = ["--spec", specPath];
  if (cli.phase) args.push("--phase", cli.phase);
  if (cli.skipGuardrail) args.push("--skip-guardrail");

  const res = runSync("node", [scriptPath, ...args], { cwd: root });

  const combined = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();

  // Parse PASS/FAIL lines from output
  const reasons = [];
  for (const line of combined.split("\n")) {
    const m = line.match(/^\s*(PASS|FAIL):\s*(.+)/);
    if (m) reasons.push({ verdict: m[1], detail: m[2].trim() });
  }

  if (!res.ok) {
    // Extract issue lines
    const issues = combined.split("\n")
      .filter((l) => /^- /.test(l))
      .map((l) => l.replace(/^- /, "").trim());

    output(fail("run", "gate", "GATE_FAILED", [
      "spec gate check failed",
      ...issues,
      ...(reasons.filter((r) => r.verdict === "FAIL").map((r) => r.detail)),
    ]));
    return;
  }

  output(ok("run", "gate", {
    result: "pass",
    changed: [],
    artifacts: {
      spec: specPath,
      phase: cli.phase || "pre",
      reasons,
    },
    next: "approval",
  }));
}

export { main };
runIfDirect(import.meta.url, main);
