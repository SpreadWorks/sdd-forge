#!/usr/bin/env node
/**
 * sdd-forge/docs/commands/scan.js
 *
 * DataSource ベースのスキャンパイプライン。
 * 親 preset (webapp/cli) → 子 preset の順で DataSource をロードし、
 * 各 DataSource の scan() を実行して analysis.json を生成する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot, sourceRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig } from "../../lib/config.js";
import { resolveType } from "../../lib/types.js";
import { analyzeExtras } from "../lib/scanner.js";
import { presetByLeaf } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("scan");

const PRESETS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../presets",
);

function printHelp() {
  console.log(
    [
      "Usage: sdd-forge scan [options]",
      "",
      "Options:",
      "  --stdout        結果を stdout に出力（ファイル書き込みしない）",
      "  --dry-run       --stdout と同じ（ファイル書き込みしない）",
      "  -h, --help      このヘルプを表示",
    ].join("\n"),
  );
}

// ---------------------------------------------------------------------------
// DataSource ローダ（scan 用）
// ---------------------------------------------------------------------------

/**
 * data/ ディレクトリから DataSource クラスをロードし、
 * scan() メソッドを持つもののみインスタンス化して返す。
 *
 * @param {string} dataDir - data/ ディレクトリの絶対パス
 * @param {Map<string, Object>} existing - 親 preset から継承済みの Map
 * @returns {Promise<Map<string, Object>>} name → DataSource instance
 */
async function loadScanSources(dataDir, existing) {
  const sources = new Map(existing || []);
  if (!fs.existsSync(dataDir)) return sources;

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const name = path.basename(file, ".js");
    try {
      const mod = await import(path.join(dataDir, file));
      const Source = mod.default;
      if (typeof Source === "function") {
        const instance = new Source();
        if (typeof instance.scan === "function") {
          sources.set(name, instance);
        }
      }
    } catch (err) {
      logger.verbose(`failed to load DataSource ${name}: ${err.message}`);
    }
  }
  return sources;
}

// ---------------------------------------------------------------------------
// サマリー構築
// ---------------------------------------------------------------------------

const SUMMARY_BUILDERS = {
  controllers(c) {
    return {
      ...c.summary,
      top: c.controllers.slice(0, 10).map((x) => ({
        className: x.className,
        actions: x.actions.slice(0, 8),
      })),
    };
  },
  models(m) {
    return { ...m.summary };
  },
  shells(sh) {
    return {
      ...sh.summary,
      items: sh.shells.map((x) => ({
        className: x.className,
        methods: x.publicMethods,
      })),
    };
  },
  routes(r) {
    return { ...r.summary };
  },
};

const SUMMARY_SKIP_KEYS = new Set(["analyzedAt", "extras", "files"]);

function buildSummary(analysis) {
  const s = { analyzedAt: analysis.analyzedAt };

  for (const key of Object.keys(analysis)) {
    if (SUMMARY_SKIP_KEYS.has(key)) continue;
    if (!analysis[key]?.summary) continue;

    if (SUMMARY_BUILDERS[key]) {
      s[key] = SUMMARY_BUILDERS[key](analysis[key]);
    } else {
      // 汎用カテゴリ: summary + 先頭 10 件の items
      const data = analysis[key];
      const items = data[key] || [];
      s[key] = {
        ...data.summary,
        items: items.slice(0, 10).map((x) => ({
          file: x.file,
          className: x.className,
          methods: (x.methods || []).slice(0, 8),
        })),
      };
    }
  }

  if (analysis.extras) {
    const e = analysis.extras;
    s.extras = {};
    const pick = ["composerDeps", "packageDeps", "appController", "constants", "appModel"];
    for (const k of pick) {
      if (e[k]) s.extras[k] = e[k];
    }
  }
  if (analysis.files) {
    s.files = analysis.files;
  }

  return s;
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--stdout", "--dry-run"],
    defaults: { stdout: false, dryRun: false },
  });
  if (cli.help) {
    printHelp();
    return;
  }

  const root = repoRoot(import.meta.url);
  const src = sourceRoot();
  const cfg = loadConfig(root);
  const rawType = cfg.type || "php-mvc";
  const type = resolveType(rawType);

  logger.verbose(`type=${type}`);

  // preset からスキャン設定を取得
  const leaf = type.split("/").pop();
  const arch = type.split("/")[0];
  const preset = presetByLeaf(leaf);
  const presetScan = preset?.scan || {};
  const scanOverrides = cfg.scan || {};
  const scanCfg = { ...presetScan, ...scanOverrides };

  // DataSource ロード: 親 preset → 子 preset（子が親を override）
  const parentDataDir = path.join(PRESETS_DIR, arch, "data");
  let dataSources = await loadScanSources(parentDataDir);

  if (preset?.dir) {
    dataSources = await loadScanSources(
      path.join(preset.dir, "data"),
      dataSources,
    );
  }

  // プロジェクトローカルの DataSource（.sdd-forge/data/）
  const projectDataDir = path.join(root, ".sdd-forge", "data");
  dataSources = await loadScanSources(projectDataDir, dataSources);

  // スキャン実行
  const result = { analyzedAt: new Date().toISOString() };

  for (const [name, source] of dataSources) {
    logger.verbose(`${name} ...`);
    const data = source.scan(src, scanCfg);
    if (data == null) continue;

    if (data.summary) {
      // プライマリカテゴリ → analysis[name]
      result[name] = data;
      if (data.summary.total != null) {
        logger.verbose(`${name}: ${data.summary.total} items`);
      }
    } else {
      // エクストラカテゴリ → analysis.extras にマージ
      if (!result.extras) result.extras = {};
      Object.assign(result.extras, data);
    }
  }

  // 汎用 extras（composer.json / package.json）
  logger.verbose("extras ...");
  const universalExtras = analyzeExtras(src);
  // DataSource extras が汎用 extras を override（FW 固有の方が詳細）
  result.extras = { ...universalExtras, ...(result.extras || {}) };

  const extrasKeys = Object.keys(result.extras);
  if (extrasKeys.length > 0) {
    logger.verbose(`extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`);
  }

  // 出力
  const json = JSON.stringify(result);

  if (cli.stdout || cli.dryRun) {
    process.stdout.write(json + "\n");
  } else {
    const outputDir = path.join(root, ".sdd-forge", "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "analysis.json");
    fs.writeFileSync(outputPath, json + "\n");
    logger.log(`output: ${path.relative(root, outputPath)}`);

    const summary = buildSummary(result);
    const summaryPath = path.join(outputDir, "summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summary) + "\n");
    logger.log(`output: ${path.relative(root, summaryPath)}`);
  }
}

export { main };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}
