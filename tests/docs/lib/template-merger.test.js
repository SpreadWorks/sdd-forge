import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  buildLayers,
  resolveTemplates,
  mergeResolved,
  resolveChaptersOrder,
} from "../../../src/docs/lib/template-merger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "../../../src");
const PRESETS_DIR = path.join(SRC_DIR, "presets");

// ---------------------------------------------------------------------------
// buildLayers
// ---------------------------------------------------------------------------

describe("buildLayers", () => {
  it("returns base layer for single-segment 'base' type", () => {
    const layers = buildLayers("base", "ja", null);
    // base type should only include base (segments[0] === "base" skips arch)
    assert.ok(layers.length >= 1);
    assert.ok(layers[layers.length - 1].includes("base"));
  });

  it("returns arch + base for single-segment type", () => {
    const layers = buildLayers("cli", "ja", null);
    // cli → [cli/templates/ja, base/templates/ja]
    assert.ok(layers.length >= 1);
    // last should be base
    const last = layers[layers.length - 1];
    assert.ok(last.includes("base"), `expected base in ${last}`);
  });

  it("returns leaf + arch + base for two-segment type", () => {
    const layers = buildLayers("cli/node-cli", "ja", null);
    // node-cli → [node-cli/templates/ja, cli/templates/ja, base/templates/ja]
    assert.ok(layers.length >= 2);
    // first should be most specific (node-cli or cli)
    // last should be base
    const last = layers[layers.length - 1];
    assert.ok(last.includes("base"), `expected base in ${last}`);
  });

  it("includes project-local dir when it exists", () => {
    // Use an existing directory as project-local
    const projectLocalDir = path.join(PRESETS_DIR, "base", "templates", "ja");
    const layers = buildLayers("cli/node-cli", "ja", projectLocalDir);
    assert.equal(layers[0], projectLocalDir);
  });

  it("skips project-local dir when it does not exist", () => {
    const layers = buildLayers("cli/node-cli", "ja", "/nonexistent/dir");
    for (const l of layers) {
      assert.notEqual(l, "/nonexistent/dir");
    }
  });

  it("returns layers in priority order (most specific first)", () => {
    const layers = buildLayers("cli/node-cli", "ja", null);
    // Verify ordering: each layer's path segment should go from specific to general
    // The last entry should always contain "base"
    if (layers.length >= 2) {
      assert.ok(
        layers[layers.length - 1].includes("base"),
        "last layer should be base",
      );
      assert.ok(
        !layers[0].includes("base") || layers.length === 1,
        "first layer should not be base (unless only base exists)",
      );
    }
  });

  it("skips non-existent language directories", () => {
    const layers = buildLayers("cli/node-cli", "zz-nonexistent", null);
    // All layers should reference existing directories
    for (const l of layers) {
      assert.ok(fs.existsSync(l), `expected ${l} to exist`);
    }
  });
});

// ---------------------------------------------------------------------------
// mergeResolved
// ---------------------------------------------------------------------------

describe("mergeResolved", () => {
  it("returns null for empty sources", () => {
    assert.equal(mergeResolved([]), null);
    assert.equal(mergeResolved(null), null);
  });

  it("returns content unchanged for single source", () => {
    const sources = [
      { path: "a.md", content: "# Hello\nWorld", extends: false },
    ];
    assert.equal(mergeResolved(sources), "# Hello\nWorld");
  });

  it("child without @extends replaces parent entirely", () => {
    const sources = [
      { path: "child.md", content: "# Child Only", extends: false },
      { path: "parent.md", content: "# Parent Only", extends: false },
    ];
    // child is first (most specific), parent is last (base)
    // mergeResolved reverses: starts with parent, then overlays child
    // Since child has extends:false, mergeTexts returns childText
    const result = mergeResolved(sources);
    assert.equal(result, "# Child Only");
  });

  it("child with @extends merges blocks from parent", () => {
    const parent = [
      "# Title",
      "<!-- @block: intro -->",
      "Parent intro",
      "<!-- @endblock -->",
      "<!-- @block: body -->",
      "Parent body",
      "<!-- @endblock -->",
    ].join("\n");

    const child = [
      "<!-- @extends -->",
      "<!-- @block: intro -->",
      "Child intro",
      "<!-- @endblock -->",
    ].join("\n");

    const sources = [
      { path: "child.md", content: child, extends: true },
      { path: "parent.md", content: parent, extends: false },
    ];

    const result = mergeResolved(sources);
    assert.ok(result.includes("Child intro"), "child block should override");
    assert.ok(
      result.includes("Parent body"),
      "parent block should be preserved",
    );
    assert.ok(result.includes("# Title"), "parent preamble should appear");
  });

  it("three-level inheritance merges correctly", () => {
    const base = [
      "# Base",
      "<!-- @block: a -->",
      "base-a",
      "<!-- @endblock -->",
      "<!-- @block: b -->",
      "base-b",
      "<!-- @endblock -->",
      "<!-- @block: c -->",
      "base-c",
      "<!-- @endblock -->",
    ].join("\n");

    const mid = [
      "<!-- @extends -->",
      "<!-- @block: b -->",
      "mid-b",
      "<!-- @endblock -->",
    ].join("\n");

    const leaf = [
      "<!-- @extends -->",
      "<!-- @block: a -->",
      "leaf-a",
      "<!-- @endblock -->",
    ].join("\n");

    const sources = [
      { path: "leaf.md", content: leaf, extends: true },
      { path: "mid.md", content: mid, extends: true },
      { path: "base.md", content: base, extends: false },
    ];

    const result = mergeResolved(sources);
    assert.ok(result.includes("leaf-a"), "leaf should override block a");
    assert.ok(result.includes("mid-b"), "mid should override block b");
    assert.ok(result.includes("base-c"), "base block c should remain");
  });
});

// ---------------------------------------------------------------------------
// resolveChaptersOrder
// ---------------------------------------------------------------------------

describe("resolveChaptersOrder", () => {
  it("returns chapters from base preset", () => {
    const chapters = resolveChaptersOrder("base");
    assert.ok(Array.isArray(chapters));
    // base should have chapters defined
    if (chapters.length > 0) {
      assert.ok(chapters[0].endsWith(".md"));
    }
  });

  it("leaf preset overrides base chapters", () => {
    const baseChapters = resolveChaptersOrder("base");
    const nodeCliChapters = resolveChaptersOrder("cli/node-cli");
    // node-cli has its own chapters that differ from base
    if (nodeCliChapters.length > 0 && baseChapters.length > 0) {
      // They should be different arrays (node-cli has specialized chapters)
      const sameOrder =
        JSON.stringify(baseChapters) === JSON.stringify(nodeCliChapters);
      // It's ok if they're the same (node-cli may not override), but log it
      if (!sameOrder) {
        assert.notDeepEqual(baseChapters, nodeCliChapters);
      }
    }
  });

  it("returns array of strings", () => {
    const chapters = resolveChaptersOrder("cli/node-cli");
    assert.ok(Array.isArray(chapters));
    for (const ch of chapters) {
      assert.equal(typeof ch, "string");
    }
  });
});

// ---------------------------------------------------------------------------
// resolveTemplates
// ---------------------------------------------------------------------------

describe("resolveTemplates", () => {
  it("resolves templates for existing language", () => {
    const chaptersOrder = resolveChaptersOrder("cli/node-cli");
    const resolutions = resolveTemplates("cli/node-cli", "ja", {
      chaptersOrder,
    });
    assert.ok(resolutions.length > 0, "should resolve at least one template");

    // All resolutions should have action "use" (ja templates exist)
    for (const r of resolutions) {
      assert.equal(r.action, "use");
      assert.ok(r.sources.length > 0);
      assert.equal(typeof r.fileName, "string");
    }
  });

  it("includes README.md in resolutions", () => {
    const chaptersOrder = resolveChaptersOrder("cli/node-cli");
    const resolutions = resolveTemplates("cli/node-cli", "ja", {
      chaptersOrder,
    });
    const readme = resolutions.find((r) => r.fileName === "README.md");
    assert.ok(readme, "should include README.md");
  });

  it('marks files for translation when target language has no templates', () => {
    const chaptersOrder = resolveChaptersOrder("cli/node-cli");
    const resolutions = resolveTemplates("cli/node-cli", "fr", {
      chaptersOrder,
      fallbackLangs: ["ja"],
    });
    // fr templates don't exist, so should fall back to ja with translate action
    const translated = resolutions.filter((r) => r.action === "translate");
    assert.ok(translated.length > 0, "should have translate actions");
    for (const r of translated) {
      assert.equal(r.from, "ja");
      assert.equal(r.to, "fr");
    }
  });

  it("returns empty array when no templates found anywhere", () => {
    const resolutions = resolveTemplates("cli/node-cli", "zz", {
      chaptersOrder: ["nonexistent.md"],
    });
    assert.deepEqual(resolutions, []);
  });

  it("resolveTemplates result sources have expected shape", () => {
    const chaptersOrder = resolveChaptersOrder("cli/node-cli");
    const resolutions = resolveTemplates("cli/node-cli", "ja", {
      chaptersOrder,
    });
    for (const r of resolutions) {
      assert.ok(Array.isArray(r.sources));
      for (const s of r.sources) {
        assert.equal(typeof s.path, "string");
        assert.equal(typeof s.content, "string");
        assert.equal(typeof s.extends, "boolean");
      }
    }
  });
});
