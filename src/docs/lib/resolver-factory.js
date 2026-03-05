/**
 * sdd-forge/engine/resolvers/index.js
 *
 * リゾルバファクトリ。
 * type に応じて DataSource モジュールをロードし、リゾルバを返す。
 * 親 preset (webapp/cli) → 子 preset (cakephp2/laravel/...) の順でロードし、
 * 子が親を override する。
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
 * data/ ディレクトリから DataSource クラスをロードし、インスタンス化する。
 * @param {string} dataDir - data/ ディレクトリの絶対パス
 * @param {{ desc: function, loadOverrides: function }} ctx
 * @param {Map<string, DataSource>} existing - 既存の DataSource マップ（親から継承）
 * @returns {Promise<Map<string, DataSource>>} name → DataSource instance
 */
async function loadDataSources(dataDir, ctx, existing) {
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
        instance.init(ctx);
        sources.set(name, instance);
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

const PRESETS_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../presets",
);

/**
 * type に基づいてリゾルバを生成する。
 * 親 preset → 子 preset の順で DataSource をロードし、子が親を override する。
 *
 * @param {string} type - 解決済み type パス（例: "webapp/cakephp2"）
 * @param {string} root - プロジェクトルート（overrides.json のパス解決用）
 * @returns {Promise<{ resolve: (source: string, method: string, analysis: Object, labels: string[]) => string|null }>}
 */
export async function createResolver(type, root) {
  const desc = descFactory(root);
  const loadOverrides = () => loadOverridesFor(root);
  const ctx = { desc, loadOverrides, root };

  // 共通 DataSource（project, docs など全 type で利用可能）
  const commonDataDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../data",
  );
  let dataSources = await loadDataSources(commonDataDir, ctx);

  // 親 preset (webapp, cli) のロード
  const arch = type.split("/")[0];
  const parentDataDir = path.join(PRESETS_DIR, arch, "data");
  dataSources = await loadDataSources(parentDataDir, ctx, dataSources);

  // 子 preset のロード（親を override）
  const leaf = type.split("/").pop();
  const preset = presetByLeaf(leaf);
  if (preset?.dir) {
    dataSources = await loadDataSources(path.join(preset.dir, "data"), ctx, dataSources);
  }

  // プロジェクトローカルの DataSource（.sdd-forge/data/）
  const projectDataDir = path.join(root, ".sdd-forge", "data");
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
