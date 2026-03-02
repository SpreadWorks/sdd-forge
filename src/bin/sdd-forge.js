#!/usr/bin/env node
/**
 * bin/sdd-forge.js
 *
 * sdd-forge のメイン CLI エントリポイント。
 * サブコマンドを対応スクリプトへ振り分ける。
 *
 * Usage:
 *   sdd-forge <subcommand> [options]
 *   sdd-forge --project <name> <subcommand> [options]
 *   sdd-forge help
 */

import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import path from "path";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** サブコマンド → スクリプト相対パス */
const SCRIPTS = {
  help:          "help.js",
  default:       "projects/setdefault.js",
  scan:          "analyzers/scan.js",
  init:          "engine/init.js",
  data:          "engine/populate.js",
  text:          "engine/tfill.js",
  readme:        "engine/readme.js",
  spec:          "spec/spec.js",
  gate:          "spec/gate.js",
  forge:         "forge/forge.js",
  flow:          "flow/flow.js",
  setup:         "setup/setup.js",
};

/** プロジェクトコンテキスト解決が不要なコマンド */
const PROJECT_MGMT = new Set(["default", "help", "setup"]);

// --project フラグを argv から抽出
const rawArgs = process.argv.slice(2);
let projectName;
let filteredArgs = rawArgs;

const projIdx = rawArgs.indexOf("--project");
if (projIdx !== -1) {
  projectName = rawArgs[projIdx + 1];
  filteredArgs = [
    ...rawArgs.slice(0, projIdx),
    ...rawArgs.slice(projIdx + 2),
  ];
}

const [subCmd, ...rest] = filteredArgs;

// ヘルプ（引数なし / -h / --help）
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  const helpPath = path.join(PKG_DIR, "help.js");
  process.argv = [process.argv[0], helpPath];
  await import(helpPath);
  process.exit(0);
}

// プロジェクトコンテキストの解決（管理コマンド以外）
if (!PROJECT_MGMT.has(subCmd)) {
  const { resolveProject, workRootFor } = await import(
    path.join(PKG_DIR, "projects/projects.js")
  );
  try {
    const project = resolveProject(projectName);
    if (project) {
      process.env.SDD_SOURCE_ROOT = project.path;
      process.env.SDD_WORK_ROOT   = workRootFor(project.name);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// review: bash スクリプトを直接実行
if (subCmd === "review") {
  const scriptPath = path.join(PKG_DIR, "templates/checks/check-docs.sh");
  try {
    execFileSync("bash", [scriptPath, ...rest], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env },
    });
  } catch (err) {
    process.exit(err.status || 1);
  }
  process.exit(0);
}

// build: scan → init → data → text → readme を順に実行
if (subCmd === "build") {
  const scanPath     = path.join(PKG_DIR, "analyzers/scan.js");
  const initPath     = path.join(PKG_DIR, "engine/init.js");
  const populatePath = path.join(PKG_DIR, "engine/populate.js");
  const tfillPath    = path.join(PKG_DIR, "engine/tfill.js");
  const readmePath   = path.join(PKG_DIR, "engine/readme.js");

  // --force は init に渡す
  const initArgs = rest.filter((a) => a === "--force");
  const otherArgs = rest.filter((a) => a !== "--force");

  // 1. scan — analysis.json を先に生成（init の章選別に必要）
  process.argv = [process.argv[0], scanPath];
  await import(scanPath);

  // 2. init — analysis.json を参照して章をフィルタ
  process.argv = [process.argv[0], initPath, ...initArgs];
  await import(initPath);

  // 3. data (populate)
  process.argv = [process.argv[0], populatePath];
  await import(populatePath);

  // 4. text (tfill) — defaultAgent を config から取得
  const { loadJsonFile } = await import(path.join(PKG_DIR, "lib/config.js"));
  const workRoot = process.env.SDD_WORK_ROOT || process.cwd();
  let agentArgs = [];
  try {
    const cfg = loadJsonFile(path.join(workRoot, ".sdd-forge", "config.json"));
    const agentName = otherArgs.includes("--agent")
      ? otherArgs[otherArgs.indexOf("--agent") + 1]
      : cfg.defaultAgent;
    if (agentName) {
      agentArgs = ["--agent", agentName];
    }
  } catch (_) {
    // config が読めない場合は --agent なしで tfill に任せる（エラーになる）
  }

  if (agentArgs.length > 0) {
    process.argv = [process.argv[0], tfillPath, ...agentArgs];
    await import(tfillPath);
  } else {
    console.error("[build] WARN: no defaultAgent configured, skipping text generation.");
    console.error("[build] Set 'defaultAgent' in config.json or use: sdd-forge text --agent <name>");
  }

  // 5. readme
  process.argv = [process.argv[0], readmePath];
  await import(readmePath);

  process.exit(0);
}

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(1);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);
