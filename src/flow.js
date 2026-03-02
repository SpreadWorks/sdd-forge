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
import { repoRoot, parseArgs } from "./lib/cli.js";
import { runSync } from "./lib/process.js";
import { saveFlowState } from "./lib/flow-state.js";

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
    options: ["--request", "--title", "--spec", "--agent", "--max-runs", "--forge-mode"],
    defaults: { request: "", title: "", spec: "", agent: "", maxRuns: "5", forgeMode: "local" },
  });
  if (cli.help) {
    console.log(
      [
        "Usage: node sdd-forge/flow/flow.js --request \"...\" [options]",
        "",
        "Options:",
        "  --request <text>   実装要求（必須）",
        "  --title <text>     spec 用タイトル（省略時は request 先頭を利用）",
        "  --spec <path>      既存 spec.md を使う",
        "  --agent <name>     AIエージェント: codex|claude",
        "  --max-runs <n>     docs:forge 反復回数",
        "  --forge-mode <m>   docs:forge mode: local|assist|agent (default: local)",
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
    const s = run(root, "node", [
      path.join(PKG_DIR, "specs", "commands", "init.js"),
      "--title",
      title,
      "--allow-dirty",
    ]);
    process.stdout.write(s.out);
    process.stderr.write(s.err);
    if (!s.ok) {
      process.exit(s.status);
    }
    specRel = parseCreatedSpecPath(s.out);
    if (!specRel) {
      specRel = fallbackLatestSpec(root);
      if (!specRel) {
        console.error("flow: failed to parse created spec path.");
        process.exit(1);
      }
      console.warn(`flow: fallback spec path used: ${specRel}`);
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
    console.log("NEEDS_INPUT");
    console.log("- sdd:gate が失敗しました。以下を解消してください。");
    if (needsApproval || detectUserConfirmationIssue(specAbs)) {
      console.log("- この仕様で実装して問題ないか、ユーザー確認を先に取ってください。");
      console.log("- 承認後、spec.md の `## User Confirmation` に `- [x] User approved this spec` を設定してください。");
    } else if (lines.length === 0) {
      console.log("- spec の未解決事項を解消してください。");
    } else {
      for (const l of lines.slice(0, 8)) {
        console.log(l);
      }
    }
    process.exit(2);
  }

  // Save flow state after gate success
  const currentBranch = run(root, "git", ["-C", root, "rev-parse", "--abbrev-ref", "HEAD"]).out.trim();
  saveFlowState(root, {
    spec: specRel,
    baseBranch: baseBranchBeforeSpec,
    featureBranch: currentBranch,
  });

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
