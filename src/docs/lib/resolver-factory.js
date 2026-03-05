/**
 * sdd-forge/engine/resolvers/index.js
 *
 * リゾルバファクトリ。
 * type に応じて DataSource モジュールをロードし、リゾルバを返す。
 */

import fs from "fs";
import path from "path";
import { presetByLeaf } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("resolver");

// ---------------------------------------------------------------------------
// DataSource ローダ
// ---------------------------------------------------------------------------

/**
 * preset の data/ ディレクトリから DataSource モジュールを動的にロードする。
 * @param {string} dataDir - data/ ディレクトリの絶対パス
 * @param {{ desc: function, loadOverrides: function }} ctx
 * @returns {Promise<Map<string, DataSource>>} name → DataSource instance
 */
async function loadDataSources(dataDir, ctx) {
  const sources = new Map();
  if (!fs.existsSync(dataDir)) return sources;

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const name = path.basename(file, ".js");
    try {
      const mod = await import(path.join(dataDir, file));
      const source = mod.default;
      if (source && typeof source.scan === "function") {
        source.init(ctx);
        sources.set(name, source);
      }
    } catch (err) {
      logger.verbose(`failed to load DataSource ${name}: ${err.message}`);
    }
  }
  return sources;
}

// ---------------------------------------------------------------------------
// overrides.json 読み込み（キャッシュ付き）
// ---------------------------------------------------------------------------

let _overridesCache = null;
let _overridesRoot = null;

function loadOverridesFor(root) {
  if (_overridesCache && _overridesRoot === root) return _overridesCache;
  const overridesPath = path.join(root, ".sdd-forge", "overrides.json");
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
 *
 * @param {string} type - 解決済み type パス（例: "webapp/cakephp2"）
 * @param {string} root - プロジェクトルート（overrides.json のパス解決用）
 * @returns {Promise<{ resolve: (source: string, method: string, analysis: Object, labels: string[]) => string|null }>}
 */
export async function createResolver(type, root) {
  const desc = descFactory(root);
  const loadOverrides = () => loadOverridesFor(root);
  const ctx = { desc, loadOverrides };

  const leaf = type.split("/").pop();
  const preset = presetByLeaf(leaf);

  // DataSource モジュールのロード
  let dataSources = new Map();

  if (preset?.dir) {
    dataSources = await loadDataSources(path.join(preset.dir, "data"), ctx);
  }

  return {
    /**
     * source.method でデータを解決し、レンダリング済み Markdown を返す。
     *
     * @param {string} source - DataSource 名 (e.g. "controllers")
     * @param {string} method - メソッド名 (e.g. "list")
     * @param {Object} analysis - analysis.json の全体オブジェクト
     * @param {string[]} labels - テーブルヘッダー
     * @returns {string|null}
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
