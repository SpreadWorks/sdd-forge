#!/usr/bin/env node
/**
 * sdd-forge/setup/setup.js
 *
 * 対話式セットアップウィザード。
 * プロジェクト登録 + .sdd-forge/config.json 生成を一括で行う。
 *
 * Usage:
 *   sdd-forge setup
 *   sdd-forge setup --name myapp --path /path/to/src --lang ja --type node-cli --purpose developer-guide --tone polite --agent claude
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { repoRoot, parseArgs } from "../lib/cli.js";
import { validateConfig } from "../lib/types.js";
import { saveContext } from "../lib/config.js";
import { addProject, workRootFor, loadProjects } from "../projects/projects.js";

// ---------------------------------------------------------------------------
// readline ヘルパー
// ---------------------------------------------------------------------------

function ask(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function askChoice(rl, prompt, choices) {
  const lines = choices.map((c, i) => `  [${i + 1}] ${c.label}`);
  console.log(`\n${prompt}`);
  for (const line of lines) console.log(line);
  const answer = await ask(rl, `> (1-${choices.length}): `);
  const idx = Number(answer) - 1;
  if (idx >= 0 && idx < choices.length) return choices[idx].value;
  return choices[0].value;
}

// ---------------------------------------------------------------------------
// CLI 引数パース
// ---------------------------------------------------------------------------

function parseSetupArgs(argv) {
  return parseArgs(argv, {
    flags: [],
    options: [
      "--name", "--path",
      "--lang", "--type", "--purpose", "--tone",
      "--agent", "--project-context",
    ],
    defaults: {
      name: "",
      path: "",
      lang: "",
      type: "",
      purpose: "",
      tone: "",
      agent: "",
      projectContext: "",
    },
  });
}

// ---------------------------------------------------------------------------
// プロジェクト登録 + ディレクトリ構造作成
// ---------------------------------------------------------------------------

function registerProject(projectName, sourcePath) {
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`path does not exist: ${resolved}`);
  }

  let data;
  try {
    data = addProject(projectName, resolved);
  } catch (err) {
    // 既に登録済みならスキップ
    const existing = loadProjects();
    if (existing?.projects?.[projectName]) {
      console.log(`[setup] project '${projectName}' already registered. skipping registration.`);
      return { alreadyExists: true, workRoot: workRootFor(projectName) };
    }
    throw err;
  }

  const isDefault = data.default === projectName;

  // projects/<name>/ のディレクトリ構造を作成
  const workRoot = workRootFor(projectName);
  const sddDir = path.join(workRoot, ".sdd-forge");
  const outputDir = path.join(sddDir, "output");
  const docsDir = path.join(workRoot, "docs");
  const specsDir = path.join(workRoot, "specs");

  [sddDir, outputDir, docsDir, specsDir].forEach((d) =>
    fs.mkdirSync(d, { recursive: true }),
  );
  fs.writeFileSync(path.join(outputDir, ".gitkeep"), "");

  console.log(`[setup] project '${projectName}' registered.`);
  console.log(`  source : ${resolved}`);
  console.log(`  workdir: ${workRoot}`);
  if (isDefault) console.log(`  default: yes`);

  return { alreadyExists: false, workRoot };
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseSetupArgs(process.argv.slice(2));

  if (cli.help) {
    console.log([
      "Usage: sdd-forge setup [options]",
      "",
      "プロジェクト登録と config.json 生成を対話式で行います。",
      "",
      "Options:",
      "  --name <name>               プロジェクト名",
      "  --path <path>               ソースコードのパス (default: カレントディレクトリ)",
      "  --lang <lang>               言語: ja|en",
      "  --type <type>               プロジェクト種別: php-mvc|node-cli",
      "  --purpose <purpose>         文書目的: developer-guide|user-guide|api-reference",
      "  --tone <tone>               文体: polite|formal|casual",
      "  --agent <agent>             デフォルトエージェント: claude|codex",
      "  --project-context <text>    プロジェクト概要テキスト",
      "  -h, --help                  このヘルプを表示",
      "",
      "全必須値が揃っていれば対話なしで実行されます。",
    ].join("\n"));
    return;
  }

  // デフォルトパスは cwd
  const defaultPath = process.cwd();
  const defaultName = path.basename(defaultPath);

  // 全必須値がCLI引数で揃っているか
  const hasAllRequired = cli.name && cli.lang && cli.type && cli.purpose && cli.tone;

  let projectName = cli.name;
  let sourcePath = cli.path || defaultPath;
  let lang = cli.lang;
  let type = cli.type;
  let purpose = cli.purpose;
  let tone = cli.tone;
  let projectContext = cli.projectContext;
  let defaultAgent = cli.agent;

  let rl;
  if (!hasAllRequired) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n  SDD Forge — セットアップ");
    console.log("  ========================\n");

    // --- プロジェクト登録 ---
    if (!projectName) {
      const answer = await ask(rl, `プロジェクト名 (default: ${defaultName}): `);
      projectName = answer || defaultName;
    }

    if (!cli.path) {
      const answer = await ask(rl, `ソースコードのパス (default: ${defaultPath}): `);
      sourcePath = answer || defaultPath;
    }

    // --- ドキュメント設定 ---
    if (!lang) {
      lang = await askChoice(rl, "言語を選択してください:", [
        { label: "ja (日本語)", value: "ja" },
        { label: "en (English)", value: "en" },
      ]);
    }

    if (!type) {
      type = await askChoice(rl, "プロジェクト種別を選択してください:", [
        { label: "php-mvc", value: "php-mvc" },
        { label: "node-cli", value: "node-cli" },
      ]);
    }

    if (!purpose) {
      purpose = await askChoice(rl, "ドキュメントの目的を選択してください:", [
        { label: "developer-guide (開発者向け技術ガイド)", value: "developer-guide" },
        { label: "user-guide (利用者向け操作ガイド)", value: "user-guide" },
        { label: "api-reference (API リファレンス)", value: "api-reference" },
        { label: "other (自由入力)", value: "__other__" },
      ]);
      if (purpose === "__other__") {
        purpose = await ask(rl, "目的を入力してください: ");
        if (!purpose) purpose = "developer-guide";
      }
    }

    if (!tone) {
      tone = await askChoice(rl, "文体を選択してください:", [
        { label: "polite (です・ます調 / professional)", value: "polite" },
        { label: "formal (だ・である調 / formal)", value: "formal" },
        { label: "casual (カジュアル / conversational)", value: "casual" },
      ]);
    }

    if (!projectContext) {
      console.log("\nプロジェクト概要を入力してください（空でも可。scan 後に自動生成できます）:");
      projectContext = await ask(rl, "> ");
    }

    if (!defaultAgent) {
      const agentChoice = await askChoice(rl, "デフォルト AI エージェントを選択してください:", [
        { label: "claude", value: "claude" },
        { label: "codex", value: "codex" },
        { label: "スキップ（後で設定）", value: "" },
      ]);
      defaultAgent = agentChoice;
    }

    rl.close();
  } else {
    // 非対話モード: name はあるが path 未指定ならデフォルト
    if (!sourcePath) sourcePath = defaultPath;
    if (!projectName) projectName = defaultName;
  }

  // 1. プロジェクト登録
  const { workRoot } = registerProject(projectName, sourcePath);

  // 2. config オブジェクト構築
  const config = {
    lang,
    type,
    documentStyle: {
      purpose,
      tone,
    },
    textFill: {
      projectContext: "",
      preamblePatterns: [
        { pattern: "^(Here is|以下に|Based on)", flags: "i" },
      ],
    },
  };

  if (defaultAgent) {
    config.defaultAgent = defaultAgent;
    if (defaultAgent === "claude") {
      config.providers = {
        claude: {
          name: "claude-cli",
          command: "claude",
          args: ["--model", "sonnet", "-p", "{{PROMPT}}"],
        },
      };
    } else if (defaultAgent === "codex") {
      config.providers = {
        codex: {
          name: "codex-cli",
          command: "codex",
          args: ["-p", "{{PROMPT}}"],
        },
      };
    }
  }

  // 3. バリデーション
  validateConfig(config);

  // 4. config.json 書き込み（workRoot 配下）
  const sddDir = path.join(workRoot, ".sdd-forge");
  if (!fs.existsSync(sddDir)) {
    fs.mkdirSync(sddDir, { recursive: true });
  }

  const configPath = path.join(sddDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`\n[setup] ${configPath} を生成しました。`);

  // 5. projectContext があれば context.json に書き込み
  if (projectContext) {
    saveContext(workRoot, { projectContext });
    console.log(`[setup] context.json を生成しました。`);
  }

  // サマリ表示
  console.log("\n  設定サマリ:");
  console.log(`    project: ${projectName}`);
  console.log(`    source:  ${path.resolve(sourcePath)}`);
  console.log(`    lang:    ${lang}`);
  console.log(`    type:    ${type}`);
  console.log(`    purpose: ${purpose}`);
  console.log(`    tone:    ${tone}`);
  if (defaultAgent) console.log(`    agent:   ${defaultAgent}`);
  if (projectContext) console.log(`    context: ${projectContext.slice(0, 80)}${projectContext.length > 80 ? "..." : ""}`);

  console.log("\n  次のステップ:");
  console.log("    1. sdd-forge init      — docs/ テンプレートを生成");
  console.log("    2. sdd-forge scan:all  — ソースコード解析 + data");
  console.log("    3. sdd-forge text --agent claude — AI でテキスト生成");
  console.log("");
}

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}

export { main };
