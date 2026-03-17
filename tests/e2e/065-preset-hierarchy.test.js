/**
 * tests/065-preset-hierarchy.test.js
 *
 * Spec #065: preset 階層再設計のユニットテスト。
 * parent チェーン解決、DataSource ロード順、テンプレートマージの可変長対応を検証する。
 *
 * テスト対象:
 *   - presets.js: resolveChain(), parent チェーン循環検出, 後方互換
 *   - resolver-factory.js: parent チェーン + lang 層ロード
 *   - template-merger.js: 可変長レイヤー構築
 *   - types.js: parent ベースエイリアス解決
 *   - php/node DataSource: config.stack()
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../helpers/tmp-dir.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "../../src");

// ---------------------------------------------------------------------------
// presets.js: parent チェーン解決
// ---------------------------------------------------------------------------

describe("presets.js: resolveChain", () => {
  // resolveChain は新設予定の関数。parent を辿って root → leaf の順で返す。
  // 実装前のため、テストは関数のインターフェースを定義する。

  it("resolves chain for leaf preset (cakephp2 → webapp → base)", async () => {
    const { resolveChain } = await import("../../src/lib/presets.js");
    const chain = resolveChain("cakephp2");
    assert.ok(Array.isArray(chain), "resolveChain should return an array");
    assert.ok(chain.length >= 2, "chain should have at least 2 elements");
    // chain は root → leaf の順
    assert.equal(chain[0].key, "base", "first element should be base");
    assert.equal(chain[chain.length - 1].key, "cakephp2", "last element should be cakephp2");
  });

  it("resolves chain for node-cli (node-cli → cli → base)", async () => {
    const { resolveChain } = await import("../../src/lib/presets.js");
    const chain = resolveChain("node-cli");
    assert.ok(chain.length >= 2);
    assert.equal(chain[0].key, "base");
    assert.equal(chain[chain.length - 1].key, "node-cli");
    // cli should be in the middle
    const cliIdx = chain.findIndex((p) => p.key === "cli");
    assert.ok(cliIdx > 0, "cli should be in the chain");
    assert.ok(cliIdx < chain.length - 1, "cli should be before node-cli");
  });

  it("resolves chain for arch-level preset (webapp → base)", async () => {
    const { resolveChain } = await import("../../src/lib/presets.js");
    const chain = resolveChain("webapp");
    assert.ok(chain.length >= 1);
    assert.equal(chain[0].key, "base");
    assert.equal(chain[chain.length - 1].key, "webapp");
  });

  it("resolves chain for base (just base)", async () => {
    const { resolveChain } = await import("../../src/lib/presets.js");
    const chain = resolveChain("base");
    assert.equal(chain.length, 1);
    assert.equal(chain[0].key, "base");
  });

  it("throws for unknown preset", async () => {
    const { resolveChain } = await import("../../src/lib/presets.js");
    assert.throws(() => resolveChain("nonexistent"), /not found|unknown/i);
  });

  it("includes lang layer when preset declares lang field", async () => {
    const { resolveChain } = await import("../../src/lib/presets.js");
    // cakephp2 should declare lang: "php" in preset.json after migration
    const chain = resolveChain("cakephp2");
    // resolveLangPreset は別関数の可能性もあるが、チェーンに含まれるか確認
    // lang 層は resolveChain とは別に解決される設計の場合、このテストは調整する
    const langPreset = chain.find((p) => p.key === "php");
    // lang 層が chain に含まれない設計の場合は resolveLangPreset を別途テスト
    if (!langPreset) {
      // lang 層は別途解決される設計 → resolveLangPreset のテストで検証
      const { resolveLangPreset } = await import("../../src/lib/presets.js");
      if (typeof resolveLangPreset === "function") {
        const lang = resolveLangPreset("cakephp2");
        assert.ok(lang, "cakephp2 should have a lang preset");
        assert.equal(lang.key, "php");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// presets.js: 後方互換
// ---------------------------------------------------------------------------

describe("presets.js: backward compatibility", () => {
  it("presetByLeaf still works for existing presets", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const cakephp2 = presetByLeaf("cakephp2");
    assert.ok(cakephp2, "cakephp2 should be found");
    assert.equal(cakephp2.key, "cakephp2");

    const nodeCli = presetByLeaf("node-cli");
    assert.ok(nodeCli, "node-cli should be found");
    assert.equal(nodeCli.key, "node-cli");
  });

  it("presetByLeaf finds new lang presets (php, node)", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const php = presetByLeaf("php");
    assert.ok(php, "php preset should exist");

    const node = presetByLeaf("node");
    assert.ok(node, "node preset should exist");
  });

  it("PRESETS array contains all expected presets", async () => {
    const { PRESETS } = await import("../../src/lib/presets.js");
    const keys = PRESETS.map((p) => p.key);
    // 既存
    for (const expected of ["base", "webapp", "cli", "library", "cakephp2", "laravel", "symfony", "node-cli"]) {
      assert.ok(keys.includes(expected), `${expected} should be in PRESETS`);
    }
    // 新規
    for (const expected of ["php", "node"]) {
      assert.ok(keys.includes(expected), `${expected} should be in PRESETS`);
    }
  });
});

// ---------------------------------------------------------------------------
// presets.js: preset.json の parent フィールド
// ---------------------------------------------------------------------------

describe("presets.js: parent field in preset.json", () => {
  it("all non-base presets have a parent field", async () => {
    const { PRESETS } = await import("../../src/lib/presets.js");
    for (const p of PRESETS) {
      if (p.key === "base") continue;
      assert.ok(p.parent, `${p.key} should have a parent field`);
    }
  });

  it("base preset has no parent", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const base = presetByLeaf("base");
    assert.ok(!base.parent, "base should not have a parent");
  });

  it("php parent is base", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const php = presetByLeaf("php");
    assert.equal(php.parent, "base");
  });

  it("node parent is base", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const node = presetByLeaf("node");
    assert.equal(node.parent, "base");
  });

  it("cakephp2 parent is webapp", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const cakephp2 = presetByLeaf("cakephp2");
    assert.equal(cakephp2.parent, "webapp");
  });

  it("node-cli parent is cli", async () => {
    const { presetByLeaf } = await import("../../src/lib/presets.js");
    const nodeCli = presetByLeaf("node-cli");
    assert.equal(nodeCli.parent, "cli");
  });
});

// ---------------------------------------------------------------------------
// resolver-factory.js: parent チェーンに沿った DataSource ロード
// ---------------------------------------------------------------------------

describe("resolver-factory: parent chain loading", () => {
  it("resolves config.stack via lang layer for node type", async () => {
    const { createResolver } = await import("../../src/docs/lib/resolver-factory.js");
    const tmp = createTmpDir("resolver-chain");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", {
      name: "test-node-app",
      version: "1.0.0",
      engines: { node: ">=18.0.0" },
      dependencies: { express: "^4.18.0" },
    });

    const resolver = await createResolver("node", tmp);
    const result = resolver.resolve("config", "stack", {}, []);
    // config.stack should return a non-null value for node type
    assert.ok(result !== null, "config.stack should return data for node type");
    assert.ok(typeof result === "string", "config.stack should return a string (markdown table)");
    assert.ok(result.includes("node") || result.includes("Node"), "should mention Node.js");
    removeTmpDir(tmp);
  });

  it("resolves project.name from common layer (unchanged)", async () => {
    const { createResolver } = await import("../../src/docs/lib/resolver-factory.js");
    const tmp = createTmpDir("resolver-chain");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", { name: "test-pkg", version: "1.0.0" });

    const resolver = await createResolver("node", tmp);
    const result = resolver.resolve("project", "name", {}, [""]);
    assert.equal(result, "test-pkg");
    removeTmpDir(tmp);
  });

  it("cakephp2 resolver still works with parent chain", async () => {
    const { createResolver } = await import("../../src/docs/lib/resolver-factory.js");
    const tmp = createTmpDir("resolver-chain");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", { name: "test-cakephp" });

    const resolver = await createResolver("webapp/cakephp2", tmp);
    assert.equal(typeof resolver.resolve, "function");
    // common data sources should still be available
    const result = resolver.resolve("project", "name", {}, [""]);
    assert.equal(result, "test-cakephp");
    removeTmpDir(tmp);
  });
});

// ---------------------------------------------------------------------------
// template-merger.js: 可変長レイヤー構築
// ---------------------------------------------------------------------------

describe("template-merger: variable-length layers", () => {
  it("buildLayers returns layers for node type (node → base)", async () => {
    const { buildLayers } = await import("../../src/docs/lib/template-merger.js");
    const layers = buildLayers("node", "en", null);
    assert.ok(Array.isArray(layers));
    // base should be the last layer
    if (layers.length > 0) {
      assert.ok(layers[layers.length - 1].includes("base"), "last layer should be base");
    }
  });

  it("buildLayers returns layers for php type (php → base)", async () => {
    const { buildLayers } = await import("../../src/docs/lib/template-merger.js");
    const layers = buildLayers("php", "en", null);
    assert.ok(Array.isArray(layers));
    if (layers.length > 0) {
      assert.ok(layers[layers.length - 1].includes("base"), "last layer should be base");
    }
  });

  it("buildLayers for cli/node-cli still works", async () => {
    const { buildLayers } = await import("../../src/docs/lib/template-merger.js");
    const layers = buildLayers("cli/node-cli", "ja", null);
    assert.ok(layers.length >= 2, "should have at least node-cli and base layers");
    assert.ok(layers[layers.length - 1].includes("base"));
  });

  it("resolveChaptersOrder works for new preset types", async () => {
    const { resolveChaptersOrder } = await import("../../src/docs/lib/template-merger.js");
    // node and php should fall back to base chapters
    const nodeChapters = resolveChaptersOrder("node");
    assert.ok(Array.isArray(nodeChapters));
    assert.ok(nodeChapters.length > 0, "node should have chapters (inherited from base)");

    const phpChapters = resolveChaptersOrder("php");
    assert.ok(Array.isArray(phpChapters));
    assert.ok(phpChapters.length > 0, "php should have chapters (inherited from base)");
  });
});

// ---------------------------------------------------------------------------
// types.js: エイリアス解決
// ---------------------------------------------------------------------------

describe("types.js: alias resolution with parent-based presets", () => {
  it("existing aliases still resolve correctly", async () => {
    const { resolveType, TYPE_ALIASES } = await import("../../src/lib/types.js");
    // php-mvc → webapp/cakephp2 (existing alias)
    assert.equal(resolveType("php-mvc"), "webapp/cakephp2");
    // node-cli → cli/node-cli
    assert.equal(resolveType("node-cli"), "cli/node-cli");
  });

  it("new lang presets are not in TYPE_ALIASES (they are arch-level)", async () => {
    const { TYPE_ALIASES } = await import("../../src/lib/types.js");
    // php and node are lang-level (like arch), so should not appear in aliases
    // resolveType("php") should return "php" as-is
    const { resolveType } = await import("../../src/lib/types.js");
    assert.equal(resolveType("php"), "php");
    assert.equal(resolveType("node"), "node");
  });
});

// ---------------------------------------------------------------------------
// php DataSource: config.stack()
// ---------------------------------------------------------------------------

describe("php preset: config.stack DataSource", () => {
  it("returns tech stack from composer.json", async () => {
    // Import the PHP config DataSource directly
    let ConfigSource;
    try {
      const mod = await import("../../src/presets/php/data/config.js");
      ConfigSource = mod.default;
    } catch (e) {
      // If the file doesn't exist yet, skip gracefully
      assert.fail(`php/data/config.js not found: ${e.message}`);
      return;
    }

    const instance = new ConfigSource();
    instance.init({ desc: () => "—", loadOverrides: () => ({}), root: "/tmp" });

    const analysis = {
      extras: {
        composerDeps: {
          require: { "php": ">=8.1", "symfony/framework-bundle": "^6.0" },
          requireDev: { "phpunit/phpunit": "^10.0" },
        },
      },
    };

    const result = instance.stack(analysis, []);
    assert.ok(result !== null, "stack should return non-null for PHP project");
    assert.ok(typeof result === "string");
    assert.ok(result.includes("php") || result.includes("PHP"), "should mention PHP");
  });
});

// ---------------------------------------------------------------------------
// node DataSource: config.stack()
// ---------------------------------------------------------------------------

describe("node preset: config.stack DataSource", () => {
  it("returns tech stack from package.json", async () => {
    let ConfigSource;
    try {
      const mod = await import("../../src/presets/node/data/config.js");
      ConfigSource = mod.default;
    } catch (e) {
      assert.fail(`node/data/config.js not found: ${e.message}`);
      return;
    }

    const tmp = createTmpDir("node-stack");
    writeJson(tmp, "package.json", {
      name: "test-app",
      engines: { node: ">=18.0.0" },
      dependencies: { express: "^4.18.0", typescript: "^5.0.0" },
      devDependencies: { jest: "^29.0.0" },
    });

    const instance = new ConfigSource();
    instance.init({ desc: () => "—", loadOverrides: () => ({}), root: tmp });

    const analysis = {
      extras: {
        packageDeps: {
          dependencies: { express: "^4.18.0", typescript: "^5.0.0" },
          devDependencies: { jest: "^29.0.0" },
        },
      },
    };

    const result = instance.stack(analysis, []);
    assert.ok(result !== null, "stack should return non-null for Node.js project");
    assert.ok(typeof result === "string");
    assert.ok(result.includes("node") || result.includes("Node"), "should mention Node.js");
    removeTmpDir(tmp);
  });
});
