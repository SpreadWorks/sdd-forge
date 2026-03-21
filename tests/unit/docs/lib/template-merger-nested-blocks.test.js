/**
 * Template merger nested block tests.
 *
 * Verifies that when a child template extends a layout and defines
 * nested blocks inside a parent block (e.g. "description", "stack"
 * inside "content"), the nested blocks are NOT duplicated in output.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeResolved } from "../../../../src/docs/lib/template-merger.js";
import { stripBlockDirectives } from "../../../../src/docs/lib/directive-parser.js";

describe("nested block deduplication", () => {
  it("nested blocks inside parent block are not duplicated", () => {
    const layout = [
      "# Layout",
      '<!-- {%block "content"%} -->',
      "<!-- {%/block%} -->",
      "---",
      "nav footer",
    ].join("\n");

    const child = [
      '<!-- {%extends "layout"%} -->',
      '<!-- {%block "content"%} -->',
      "## Overview",
      '<!-- {%block "description"%} -->',
      "Description text",
      "<!-- {%/block%} -->",
      '<!-- {%block "details"%} -->',
      "Details text",
      "<!-- {%/block%} -->",
      "<!-- {%/block%} -->",
    ].join("\n");

    const sources = [
      { path: "child.md", content: child, extends: true },
      { path: "layout.md", content: layout, extends: false },
    ];

    const merged = mergeResolved(sources);
    const result = stripBlockDirectives(merged);

    // Count occurrences of each section
    const descCount = (result.match(/Description text/g) || []).length;
    const detailsCount = (result.match(/Details text/g) || []).length;

    assert.equal(descCount, 1, `"Description text" should appear exactly once, got ${descCount}`);
    assert.equal(detailsCount, 1, `"Details text" should appear exactly once, got ${detailsCount}`);
  });

  it("deeply nested blocks (3 levels) are not duplicated", () => {
    const layout = [
      '<!-- {%block "content"%} -->',
      "<!-- {%/block%} -->",
    ].join("\n");

    const child = [
      '<!-- {%extends%} -->',
      '<!-- {%block "content"%} -->',
      '<!-- {%block "section"%} -->',
      '<!-- {%block "subsection"%} -->',
      "Deep content",
      "<!-- {%/block%} -->",
      "<!-- {%/block%} -->",
      "<!-- {%/block%} -->",
    ].join("\n");

    const sources = [
      { path: "child.md", content: child, extends: true },
      { path: "layout.md", content: layout, extends: false },
    ];

    const merged = mergeResolved(sources);
    const result = stripBlockDirectives(merged);

    const count = (result.match(/Deep content/g) || []).length;
    assert.equal(count, 1, `"Deep content" should appear exactly once, got ${count}`);
  });

  it("child overriding a nested block replaces only that block", () => {
    const layout = [
      '<!-- {%block "content"%} -->',
      "<!-- {%/block%} -->",
    ].join("\n");

    const parent = [
      '<!-- {%extends%} -->',
      '<!-- {%block "content"%} -->',
      '<!-- {%block "alpha"%} -->',
      "Alpha original",
      "<!-- {%/block%} -->",
      '<!-- {%block "beta"%} -->',
      "Beta original",
      "<!-- {%/block%} -->",
      "<!-- {%/block%} -->",
    ].join("\n");

    const child = [
      '<!-- {%extends%} -->',
      '<!-- {%block "alpha"%} -->',
      "Alpha overridden",
      "<!-- {%/block%} -->",
    ].join("\n");

    // 3-level: layout → parent → child
    const sources = [
      { path: "child.md", content: child, extends: true },
      { path: "parent.md", content: parent, extends: true },
      { path: "layout.md", content: layout, extends: false },
    ];

    const merged = mergeResolved(sources);
    const result = stripBlockDirectives(merged);

    assert.ok(result.includes("Alpha overridden"), "child should override alpha block");
    assert.ok(!result.includes("Alpha original"), "original alpha should be replaced");
    assert.ok(result.includes("Beta original"), "beta should remain from parent");

    const alphaCount = (result.match(/Alpha overridden/g) || []).length;
    const betaCount = (result.match(/Beta original/g) || []).length;
    assert.equal(alphaCount, 1, "overridden alpha should appear exactly once");
    assert.equal(betaCount, 1, "beta should appear exactly once");
  });

  it("real-world pattern: layout + stack_and_ops with nested blocks", () => {
    // Simulates the actual layout.md + stack_and_ops.md pattern
    const layout = [
      '<!-- {{data("base.docs.langSwitcher")}} -->',
      "<!-- {{/data}} -->",
      "",
      '<!-- {%block "content"%} -->',
      "<!-- {%/block%} -->",
      "",
      "---",
      '<!-- {{data("base.docs.nav")}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");

    const stackAndOps = [
      '<!-- {%extends "layout"%} -->',
      '<!-- {%block "content"%} -->',
      "# 技術スタックと運用",
      "",
      '<!-- {%block "description"%} -->',
      "## 説明",
      '<!-- {{text({prompt: "概要を記述"})}} -->',
      "<!-- {{/text}} -->",
      "## 内容",
      "<!-- {%/block%} -->",
      "",
      '<!-- {%block "stack"%} -->',
      "### 技術スタック",
      '<!-- {{data("base.config.stack")}} -->',
      "<!-- {{/data}} -->",
      "<!-- {%/block%} -->",
      "",
      '<!-- {%block "deploy"%} -->',
      "### デプロイフロー",
      '<!-- {{text({prompt: "デプロイ手順"})}} -->',
      "<!-- {{/text}} -->",
      "<!-- {%/block%} -->",
      "<!-- {%/block%} -->",
    ].join("\n");

    const sources = [
      { path: "stack_and_ops.md", content: stackAndOps, extends: true },
      { path: "layout.md", content: layout, extends: false },
    ];

    const merged = mergeResolved(sources);
    const result = stripBlockDirectives(merged);

    // Verify no duplication
    const descCount = (result.match(/## 説明/g) || []).length;
    const contentCount = (result.match(/## 内容/g) || []).length;
    const stackCount = (result.match(/### 技術スタック/g) || []).length;
    const deployCount = (result.match(/### デプロイフロー/g) || []).length;

    assert.equal(descCount, 1, `"## 説明" should appear once, got ${descCount}`);
    assert.equal(contentCount, 1, `"## 内容" should appear once, got ${contentCount}`);
    assert.equal(stackCount, 1, `"### 技術スタック" should appear once, got ${stackCount}`);
    assert.equal(deployCount, 1, `"### デプロイフロー" should appear once, got ${deployCount}`);

    // Verify layout elements are preserved
    assert.ok(result.includes("base.docs.langSwitcher"), "langSwitcher should be present");
    assert.ok(result.includes("base.docs.nav"), "nav should be present");
    assert.ok(result.includes("---"), "separator should be present");
  });
});
