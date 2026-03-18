import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseDirectives,
  replaceBlockDirective,
  resolveDataDirectives,
  parseBlocks,
} from "../../../../src/docs/lib/directive-parser.js";

// ---------------------------------------------------------------------------
// parseDirectives
// ---------------------------------------------------------------------------

describe("parseDirectives", () => {
  it("returns empty array for empty text", () => {
    assert.deepEqual(parseDirectives(""), []);
  });

  it("returns empty array for text without directives", () => {
    assert.deepEqual(parseDirectives("# Hello\nSome text\n"), []);
  });

  it("parses block {{data}} directive with closing tag", () => {
    const text = [
      "# Title",
      '<!-- {{data: cakephp2.controllers.list("Name|File")}} -->',
      "old content",
      "<!-- {{/data}} -->",
      "footer",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "data");
    assert.equal(d.preset, "cakephp2");
    assert.equal(d.source, "controllers");
    assert.equal(d.method, "list");
    assert.deepEqual(d.labels, ["Name", "File"]);
    assert.equal(d.line, 1);
    assert.equal(d.endLine, 3);
    assert.equal(d.inline, false);
  });

  it("parses block {{data}} without closing tag (endLine = -1)", () => {
    const text = '<!-- {{data: base.project.summary("")}} -->\nsome text';
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].endLine, -1);
  });

  it("parses inline {{data}} directive", () => {
    const text =
      '# <!-- {{data: base.project.name("")}} -->sdd-forge<!-- {{/data}} -->';
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "data");
    assert.equal(d.preset, "base");
    assert.equal(d.source, "project");
    assert.equal(d.method, "name");
    assert.equal(d.inline, true);
    assert.equal(d.line, 0);
    assert.equal(d.endLine, 0);
  });

  it("parses multiple inline {{data}} on one line", () => {
    const text =
      '<!-- {{data: p.a.b("")}} -->X<!-- {{/data}} --> and <!-- {{data: q.c.d("")}} -->Y<!-- {{/data}} -->';
    const result = parseDirectives(text);
    assert.equal(result.length, 2);
    assert.equal(result[0].preset, "p");
    assert.equal(result[0].source, "a");
    assert.equal(result[0].method, "b");
    assert.equal(result[1].preset, "q");
    assert.equal(result[1].source, "c");
    assert.equal(result[1].method, "d");
  });

  it("parses dotted source names (e.g. config.constants)", () => {
    const text = [
      '<!-- {{data: preset.config.constants.list("Key|Value")}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].preset, "preset");
    assert.equal(result[0].source, "config.constants");
    assert.equal(result[0].method, "list");
  });

  it("parses {{text}} directive without params (with end tag)", () => {
    const text = [
      "<!-- {{text: Explain the architecture.}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "text");
    assert.equal(d.prompt, "Explain the architecture.");
    assert.deepEqual(d.params, {});
    assert.equal(d.line, 0);
    assert.equal(d.endLine, 1);
  });

  it("parses {{text}} directive without end tag (endLine = -1)", () => {
    const text = "<!-- {{text: Explain the architecture.}} -->";
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].endLine, -1);
  });

  it("parses {{text}} directive with content between tags", () => {
    const text = [
      "<!-- {{text: Explain the architecture.}} -->",
      "Some generated content here.",
      "More content.",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].line, 0);
    assert.equal(result[0].endLine, 3);
  });

  it("parses {{text}} directive with params", () => {
    const text = [
      "<!-- {{text[id=auth, maxLines=5]: Describe authentication.}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "text");
    assert.equal(d.prompt, "Describe authentication.");
    assert.deepEqual(d.params, { id: "auth", maxLines: 5 });
    assert.equal(d.endLine, 1);
  });

  it("parses mixed data and text directives", () => {
    const text = [
      "# Title",
      "<!-- {{text: Write overview.}} -->",
      "<!-- {{/text}} -->",
      "",
      '<!-- {{data: base.docs.chapters("Chapter|Desc")}} -->',
      "| a | b |",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 2);
    assert.equal(result[0].type, "text");
    assert.equal(result[0].endLine, 2);
    assert.equal(result[1].type, "data");
  });

  it("handles empty labels", () => {
    const text = [
      '<!-- {{data: base.project.name("")}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    // Empty string split by "|" produces [""], but the parser may return []
    assert.ok(Array.isArray(result[0].labels));
  });
});

// ---------------------------------------------------------------------------
// replaceBlockDirective
// ---------------------------------------------------------------------------

describe("replaceBlockDirective", () => {
  it("replaces content between open and close tags", () => {
    const lines = [
      '<!-- {{data: p.x.y("A")}} -->',
      "old row 1",
      "old row 2",
      "<!-- {{/data}} -->",
    ];
    const d = {
      raw: '<!-- {{data: p.x.y("A")}} -->',
      line: 0,
      endLine: 3,
    };
    replaceBlockDirective(lines, d, "new content");
    assert.deepEqual(lines, [
      '<!-- {{data: p.x.y("A")}} -->',
      "new content",
      "<!-- {{/data}} -->",
    ]);
  });

  it("handles single line between open and close", () => {
    const lines = [
      "before",
      '<!-- {{data: p.a.b("")}} -->',
      "old",
      "<!-- {{/data}} -->",
      "after",
    ];
    const d = {
      raw: '<!-- {{data: p.a.b("")}} -->',
      line: 1,
      endLine: 3,
    };
    replaceBlockDirective(lines, d, "replaced");
    // splice replaces lines[1..3] (3 lines) with [raw, content, endTag] (3 lines)
    // total stays 5
    assert.equal(lines.length, 5);
    assert.equal(lines[0], "before");
    assert.equal(lines[1], '<!-- {{data: p.a.b("")}} -->');
    assert.equal(lines[2], "replaced");
    assert.equal(lines[3], "<!-- {{/data}} -->");
    assert.equal(lines[4], "after");
  });
});

// ---------------------------------------------------------------------------
// parseBlocks
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// resolveDataDirectives
// ---------------------------------------------------------------------------

describe("resolveDataDirectives", () => {
  it("returns unchanged text when no directives", () => {
    const result = resolveDataDirectives("# Hello\n", () => "x");
    assert.equal(result.text, "# Hello\n");
    assert.equal(result.replaced, 0);
  });

  it("resolves block data directive", () => {
    const text = [
      '<!-- {{data: p.x.list("A|B")}} -->',
      "old content",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => "new content");
    assert.equal(result.replaced, 1);
    assert.ok(result.text.includes("new content"));
    assert.ok(!result.text.includes("old content"));
  });

  it("resolves inline data directive", () => {
    const text = '<!-- {{data: base.p.name("")}} -->old<!-- {{/data}} -->';
    const result = resolveDataDirectives(text, () => "NEW");
    assert.equal(result.replaced, 1);
    assert.ok(result.text.includes("NEW"));
  });

  it("skips when resolveFn returns null", () => {
    const text = [
      '<!-- {{data: p.x.y("A")}} -->',
      "old",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => null);
    assert.equal(result.replaced, 0);
    assert.ok(result.text.includes("old"));
  });

  it("calls onSkip for non-data directives", () => {
    const text = "<!-- {{text: Explain.}} -->";
    const skipped = [];
    resolveDataDirectives(text, () => "x", {
      onSkip(d) { skipped.push(d.type); },
    });
    assert.deepEqual(skipped, ["text"]);
  });

  it("calls onResolve for each resolved directive", () => {
    const text = [
      '<!-- {{data: p.a.b("")}} -->',
      "old",
      "<!-- {{/data}} -->",
    ].join("\n");
    const resolved = [];
    resolveDataDirectives(text, () => "val", {
      onResolve(d, rendered) { resolved.push({ preset: d.preset, source: d.source, rendered }); },
    });
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].preset, "p");
    assert.equal(resolved[0].source, "a");
    assert.equal(resolved[0].rendered, "val");
  });
});

// ---------------------------------------------------------------------------
// parseBlocks
// ---------------------------------------------------------------------------

describe("parseBlocks", () => {
  it("returns empty blocks for text without directives", () => {
    const result = parseBlocks("# Title\nSome content\n");
    assert.equal(result.extends, false);
    assert.equal(result.blocks.size, 0);
    assert.deepEqual(result.preamble, ["# Title", "Some content", ""]);
    assert.deepEqual(result.postamble, []);
  });

  it("detects @extends", () => {
    const text = "<!-- @extends -->\n<!-- @block: main -->\ncontent\n<!-- @endblock -->";
    const result = parseBlocks(text);
    assert.equal(result.extends, true);
  });

  it("parses single block", () => {
    const text = [
      "# Title",
      "<!-- @block: intro -->",
      "Hello world",
      "<!-- @endblock -->",
      "Footer",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.blocks.size, 1);
    assert.ok(result.blocks.has("intro"));
    assert.deepEqual(result.blocks.get("intro").content, ["Hello world"]);
    assert.deepEqual(result.preamble, ["# Title"]);
    assert.deepEqual(result.postamble, ["Footer"]);
  });

  it("parses multiple blocks", () => {
    const text = [
      "<!-- @block: a -->",
      "content a",
      "<!-- @endblock -->",
      "<!-- @block: b -->",
      "content b",
      "<!-- @endblock -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.blocks.size, 2);
    assert.deepEqual(result.blocks.get("a").content, ["content a"]);
    assert.deepEqual(result.blocks.get("b").content, ["content b"]);
  });

  it("block with multiple content lines", () => {
    const text = [
      "<!-- @block: main -->",
      "line 1",
      "line 2",
      "line 3",
      "<!-- @endblock -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.deepEqual(result.blocks.get("main").content, [
      "line 1",
      "line 2",
      "line 3",
    ]);
  });

  it("@extends with block overrides", () => {
    const text = [
      "<!-- @extends -->",
      "<!-- @block: intro -->",
      "overridden content",
      "<!-- @endblock -->",
    ].join("\n");
    const result = parseBlocks(text);
    assert.equal(result.extends, true);
    assert.equal(result.blocks.size, 1);
    assert.deepEqual(result.blocks.get("intro").content, [
      "overridden content",
    ]);
  });
});
