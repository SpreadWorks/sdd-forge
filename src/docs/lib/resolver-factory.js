/**
 * sdd-forge/engine/resolvers/index.js
 *
 * リゾルバファクトリ。
 * type に応じて base + FW 固有カテゴリをマージしたリゾルバを返す。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createBaseCategories } from "./resolver-base.js";
import { presetByLeaf } from "../../lib/presets.js";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("resolver");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
 * @returns {Promise<{ resolve: (category: string, analysis: Object) => Object[]|Object|null }>}
 */
export async function createResolver(type, root) {
  const desc = descFactory(root);
  const loadOverrides = () => loadOverridesFor(root);

  // ベースカテゴリ
  const categories = createBaseCategories(desc);

  // FW 固有カテゴリの追加
  const leaf = type.split("/").pop();
  const preset = presetByLeaf(leaf);

  if (preset?.dir) {
    const resolvePath = path.join(preset.dir, "resolve.js");
    if (fs.existsSync(resolvePath)) {
      try {
        const fwModule = await import(resolvePath);
        const factoryName = `create${leaf.charAt(0).toUpperCase()}${leaf.slice(1)}Categories`;
        const factory = fwModule[factoryName];
        if (factory) {
          const fwCategories = factory(desc, loadOverrides);
          Object.assign(categories, fwCategories);
        }
      } catch (_) {
        logger.verbose(`no FW resolver for ${leaf}, using base categories`);
      }
    }
  }

  return {
    /**
     * カテゴリ名からデータを解決する。
     *
     * @param {string} category
     * @param {Object} analysis - analysis.json の全体オブジェクト
     * @returns {Object[]|Object|null}
     */
    resolve(category, analysis) {
      const fn = categories[category];
      if (!fn) {
        logger.verbose(`unknown category: ${category}`);
        return null;
      }
      try {
        return fn(analysis);
      } catch (err) {
        logger.log(`error resolving "${category}": ${err.message}`);
        return null;
      }
    },
  };
}
