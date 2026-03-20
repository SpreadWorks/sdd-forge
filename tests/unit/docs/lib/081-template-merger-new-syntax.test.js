import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBlocks } from "../../../../src/docs/lib/directive-parser.js";

// ---------------------------------------------------------------------------
// New syntax: {%extends%} / {%block "name"%} / {%/block%}
// ---------------------------------------------------------------------------

describe("parseBlocks — new control directive syntax", () => {
  it("detects {%extends%}", () => {
    const text = [
      '<!-- {%extends%} -->',
      '<!-- {%block "main"%} -->',
      "content",
      "<!-- {%/block%} -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.extends, true);
  });

  it("detects {%extends \"layout\"%}", () => {
    const text = [
      '<!-- {%extends "layout"%} -->',
      '<!-- {%block "main"%} -->',
      "content",
      "<!-- {%/block%} -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.extends, true);
  });

  it("parses single block with new syntax", () => {
    const text = [
      "# Title",
      '<!-- {%block "intro"%} -->',
      "Hello world",
      "<!-- {%/block%} -->",
      "Footer",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.blocks.size, 1);
    assert.ok(result.blocks.has("intro"));
    assert.deepEqual(result.blocks.get("intro").content, ["Hello world"]);
    assert.deepEqual(result.preamble, ["# Title"]);
    assert.deepEqual(result.postamble, ["Footer"]);
  });

  it("parses multiple blocks with new syntax", () => {
    const text = [
      '<!-- {%block "a"%} -->',
      "content a",
      "<!-- {%/block%} -->",
      '<!-- {%block "b"%} -->',
      "content b",
      "<!-- {%/block%} -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.blocks.size, 2);
    assert.deepEqual(result.blocks.get("a").content, ["content a"]);
    assert.deepEqual(result.blocks.get("b").content, ["content b"]);
  });

  it("{%extends%} with block overrides", () => {
    const text = [
      '<!-- {%extends%} -->',
      '<!-- {%block "intro"%} -->',
      "overridden content",
      "<!-- {%/block%} -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.extends, true);
    assert.equal(result.blocks.size, 1);
    assert.deepEqual(result.blocks.get("intro").content, [
      "overridden content",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Legacy syntax rejection
// ---------------------------------------------------------------------------

describe("parseBlocks — legacy syntax not recognized", () => {
  it("does not detect @extends", () => {
    const text = "<!-- @extends -->\n<!-- @block: main -->\ncontent\n<!-- @endblock -->";
    const result = parseBlocks(text);
    assert.equal(result.extends, false);
    assert.equal(result.blocks.size, 0);
  });

  it("does not parse @block / @endblock", () => {
    const text = [
      "# Title",
      "<!-- @block: intro -->",
      "Hello world",
      "<!-- @endblock -->",
      "Footer",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.blocks.size, 0);
  });
});
