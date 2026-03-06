#!/usr/bin/env node
/**
 * sdd-forge/flow/flow.js
 *
 * 修正要求を受けて以下を自動実行する:
 * 1) spec 作成（未指定時）+ spec gate
 * 2) gate 失敗時は NEEDS_INPUT を返して停止
 * 3) gate 成功時は sdd:forge を実行
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs, isInsideWorktree, getMainRepoPath } from "./lib/cli.js";
import { runSync } from "./lib/process.js";
import { saveFlowState } from "./lib/flow-state.js";
import { createI18n } from "./lib/i18n.js";

// npm パッケージとして呼ばれた場合でもサブスクリプトを直接起動できるよう
// パッケージディレクトリを保持する
const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

function run(root, cmd, args) {
  const res = runSync(cmd, args, { cwd: root });
  return {
    ok: res.ok,
    status: res.status,
    out: res.stdout,
    err: res.stderr,
  };
}

function collectGateReasons(text) {
  const reasons = String(text || "")
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("- "));
  return reasons.slice(0, 8);
}

function deriveTitle(request) {
  return request
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/g, "-")
    .replace(/^-+|-+$/g, "") || "task";
}

function parseCreatedSpecPath(output) {
  const m = output.match(/created spec:\s+([^\n]+)/);
  return m?.[1]?.trim() || "";
}

function fallbackLatestSpec(root) {
  const specsDir = path.join(root, "specs");
  if (!fs.existsSync(specsDir)) return "";
  const candidates = fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[0-9]{3}-/.test(d.name))
    .map((d) => d.name)
    .sort();
  const latest = candidates[candidates.length - 1];
  if (!latest) return "";
  const p = path.join("specs", latest, "spec.md");
  return fs.existsSync(path.join(root, p)) ? p : "";
}

function ensureRequestInSpec(specAbs, request) {
  if (!fs.existsSync(specAbs)) return;
  const src = fs.readFileSync(specAbs, "utf8");
  if (src.includes("**Input**: User request")) {
    const next = src.replace(
      "**Input**: User request",
      `**Input**: ${request.replace(/\n/g, " ").trim()}`,
    );
    fs.writeFileSync(specAbs, next);
  }
}

function detectUserConfirmationIssue(specAbs) {
  if (!fs.existsSync(specAbs)) return false;
  const text = fs.readFileSync(specAbs, "utf8");
  if (!/^\s*##\s+User Confirmation\b/im.test(text)) return true;
  return !/-\s*\[\s*x\s*\]\s*User approved this spec\b/i.test(text);
}

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--no-branch", "--dry-run", "--worktree"],
    options: ["--request", "--title", "--spec", "--agent", "--max-runs", "--forge-mode"],
    defaults: { request: "", title: "", spec: "", agent: "", maxRuns: "5", forgeMode: "local", noBranch: false, worktree: false, dryRun: false },
  });
  if (cli.help) {
    let uiLang = "en";
    try { uiLang = JSON.parse(fs.readFileSync(path.join(root, ".sdd-forge", "config.json"), "utf8")).uiLang || "en"; } catch (_) {}
    const tu = createI18n(uiLang);
    const h = tu.raw("help.cmdHelp.flow");
    const o = h.options;
    console.log(
      [
        h.usage, "", "Options:",
        `  ${o.request}`, `  ${o.title}`, `  ${o.spec}`, `  ${o.agent}`,
        `  ${o.maxRuns}`, `  ${o.forgeMode}`, `  ${o.noBranch}`, `  ${o.worktree}`, `  ${o.dryRun}`,
      ].join("\n"),
    );
    return;
  }
  if (!cli.request) throw new Error("--request is required");
  if (!["local", "assist", "agent"].includes(cli.forgeMode)) {
    throw new Error("--forge-mode must be one of: local, assist, agent");
  }
  let specRel = cli.spec;

  // Capture base branch before spec creation (spec may create a feature branch)
  const baseBranchBeforeSpec = run(root, "git", ["-C", root, "rev-parse", "--abbrev-ref", "HEAD"]).out.trim();

  if (!specRel) {
    const title = cli.title || deriveTitle(cli.request);
    const specInitArgs = [
      path.join(PKG_DIR, "specs", "commands", "init.js"),
      "--title",
      title,
      "--allow-dirty",
    ];
    if (cli.noBranch) specInitArgs.push("--no-branch");
    if (cli.worktree) specInitArgs.push("--worktree");
    if (cli.dryRun) specInitArgs.push("--dry-run");
    const s = run(root, "node", specInitArgs);
    process.stdout.write(s.out);
    process.stderr.write(s.err);
    if (!s.ok) {
      process.exit(s.status);
    }
    let uiLang = "en";
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(root, ".sdd-forge", "config.json"), "utf8"));
      uiLang = raw.uiLang || "en";
    } catch (_) { /* config optional */ }
    const t = createI18n(uiLang, { domain: "messages" });

    specRel = parseCreatedSpecPath(s.out);
    if (!specRel) {
      specRel = fallbackLatestSpec(root);
      if (!specRel) {
        console.error(t("flow.failedParse"));
        process.exit(1);
      }
      console.warn(t("flow.fallbackSpec", { path: specRel }));
    }
  }

  const specAbs = path.resolve(root, specRel);
  ensureRequestInSpec(specAbs, cli.request);

  const gate = run(root, "node", [path.join(PKG_DIR, "specs", "commands", "gate.js"), "--spec", specRel]);
  process.stdout.write(gate.out);
  process.stderr.write(gate.err);
  if (!gate.ok) {
    const lines = collectGateReasons(`${gate.out}\n${gate.err}`);
    const needsApproval = lines.some((l) =>
      l.toLowerCase().includes("user confirmation is required"),
    );
    console.log(t("flow.needsInput"));
    console.log(t("flow.gateFailed"));
    if (needsApproval || detectUserConfirmationIssue(specAbs)) {
      console.log(t("flow.needsApproval"));
      console.log(t("flow.approvalInstruction"));
    } else if (lines.length === 0) {
      console.log(t("flow.unresolvedItems"));
    } else {
      for (const l of lines.slice(0, 8)) {
        console.log(l);
      }
    }
    process.exit(2);
  }

  // Save flow state after gate success
  const currentBranch = run(root, "git", ["-C", root, "rev-parse", "--abbrev-ref", "HEAD"]).out.trim();
  const flowState = {
    spec: specRel,
    baseBranch: baseBranchBeforeSpec,
    featureBranch: currentBranch,
  };
  if (cli.worktree) {
    // Read worktree path from current-spec (written by spec init)
    const currentSpecPath = path.join(root, ".sdd-forge", "current-spec");
    const currentSpec = JSON.parse(fs.readFileSync(currentSpecPath, "utf8"));
    flowState.worktree = true;
    flowState.worktreePath = currentSpec.worktreePath;
    flowState.mainRepoPath = root;
  } else if (isInsideWorktree(root)) {
    flowState.worktree = true;
    flowState.worktreePath = root;
    flowState.mainRepoPath = getMainRepoPath(root);
  }
  saveFlowState(root, flowState);

  const forgeArgs = [
    path.join(PKG_DIR, "docs", "commands", "forge.js"),
    "--prompt",
    cli.request,
    "--spec",
    specRel,
    "--max-runs",
    cli.maxRuns,
    "--mode",
    cli.forgeMode,
  ];
  if (cli.agent) {
    forgeArgs.push("--agent", cli.agent);
  }
  if (cli.dryRun) {
    forgeArgs.push("--dry-run");
  }
  const forge = run(root, "node", forgeArgs);
  process.stdout.write(forge.out);
  process.stderr.write(forge.err);
  process.exit(forge.status);
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}
