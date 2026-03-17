/**
 * sdd-forge/engine/resolvers/index.js
 *
 * リゾルバファクトリ。
 * type に応じて DataSource モジュールをロードし、リゾルバを返す。
 * parent チェーンを root → leaf の順で歩き、子が親を override する。
 * lang 層が宣言されている場合は追加ロードする。
 */

import fs from "fs";
import path from "path";
import { sddDir, sddDataDir } from "../../lib/config.js";
import { loadDataSources as loadDataSourcesBase } from "./data-source-loader.js";
import { presetByLeaf, resolveChainSafe, resolveLangPreset } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("resolver");

/** Load DataSources and call init(ctx) on each instance */
function loadDataSources(dataDir, ctx, existing) {
  return loadDataSourcesBase(dataDir, {
    existing,
    onInstance: (instance) => { instance.init(ctx); },
  });
}

// ---------------------------------------------------------------------------
// overrides.json 読み込み（キャッシュ付き）
// ---------------------------------------------------------------------------

let _overridesCache = null;
let _overridesRoot = null;

function loadOverridesFor(root) {
  if (_overridesCache && _overridesRoot === root) return _overridesCache;
  const overridesPath = path.join(sddDir(root), "overrides.json");
  if (fs.existsSync(overridesPath)) {
    _overridesCache = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  } else {
    _overridesCache = {};
  }
  _overridesRoot = root;
  return _overridesCache;
}

function descFactory(root) {
  return function desc(section, key) {
    const o = loadOverridesFor(root);
    return o[section]?.[key] ?? "—";
  };
}

// ---------------------------------------------------------------------------
// ファクトリ
// ---------------------------------------------------------------------------

/**
 * type に基づいてリゾルバを生成する。
 * parent チェーンを root → leaf の順で歩いて DataSource をロードし、子が親を override する。
 * lang 層が宣言されている場合は parent チェーンの後に追加ロードする。
 *
 * @param {string} type - 解決済み type パス（例: "webapp/cakephp2", "node", "cli/node-cli"）
 * @param {string} root - プロジェクトルート（overrides.json のパス解決用）
 * @param {Object} [opts] - 追加オプション
 * @param {string} [opts.docsDir] - docs ディレクトリの絶対パス（非デフォルト言語用）
 * @returns {Promise<{ resolve: (source: string, method: string, analysis: Object, labels: string[]) => string|null }>}
 */
export async function createResolver(type, root, opts) {
  const desc = descFactory(root);
  const loadOverrides = () => loadOverridesFor(root);
  const ctx = { desc, loadOverrides, root, docsDir: opts?.docsDir, type, configChapters: opts?.configChapters };

  // 共通 DataSource（project, docs など全 type で利用可能）
  const commonDataDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../data",
  );
  let dataSources = await loadDataSources(commonDataDir, ctx);

  // parent チェーンに沿って DataSource をロード（root → leaf、子が親を override）
  const leaf = type.split("/").pop();
  const chain = resolveChainSafe(type);

  for (const preset of chain) {
    const dataDir = path.join(preset.dir, "data");
    dataSources = await loadDataSources(dataDir, ctx, dataSources);
  }

  // lang 層の追加ロード（parent チェーン外の言語層 DataSource）
  const langPreset = resolveLangPreset(leaf);
  if (langPreset) {
    const langDataDir = path.join(langPreset.dir, "data");
    dataSources = await loadDataSources(langDataDir, ctx, dataSources);
  }

  // プロジェクト固有 DataSource（最高優先）
  const projectDataDir = sddDataDir(root);
  dataSources = await loadDataSources(projectDataDir, ctx, dataSources);

  return {
    /**
     * source.method でデータを解決し、レンダリング済み Markdown を返す。
     */
    resolve(source, method, analysis, labels) {
      const ds = dataSources.get(source);
      if (ds && typeof ds[method] === "function") {
        try {
          return ds[method](analysis, labels);
        } catch (err) {
          logger.log(`error in ${source}.${method}: ${err.message}`);
          return null;
        }
      }

      logger.verbose(`unknown: ${source}.${method}`);
      return null;
    },
  };
}
