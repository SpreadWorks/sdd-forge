import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseDirectives,
  resolveDataDirectives,
} from "../../../../src/docs/lib/directive-parser.js";

// ---------------------------------------------------------------------------
// New syntax: {{data("preset.source.method", {options})}}
// ---------------------------------------------------------------------------

describe("parseDirectives — new data syntax", () => {
  it("parses {{data(...)}} with path and labels option", () => {
    const text = [
      "# Title",
      '<!-- {{data("cakephp2.controllers.list", {labels: "Name|File"})}} -->',
      "old content",
      "<!-- {{/data}} -->",
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

  it("parses {{data(...)}} with path only (no options)", () => {
    const text = [
      '<!-- {{data("base.project.summary")}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "data");
    assert.equal(d.preset, "base");
    assert.equal(d.source, "project");
    assert.equal(d.method, "summary");
    assert.deepEqual(d.params, {});
  });

  it("parses {{data(...)}} with ignoreError option", () => {
    const text = [
      '<!-- {{data("base.monorepo.apps", {ignoreError: true})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].params, { ignoreError: true });
  });

  it("parses {{data(...)}} with multiple options", () => {
    const text = [
      '<!-- {{data("base.monorepo.apps", {labels: "Name|Desc", ignoreError: true})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].params, { ignoreError: true });
    assert.deepEqual(result[0].labels, ["Name", "Desc"]);
  });

  it("parses inline {{data(...)}} directive", () => {
    const text =
      '# <!-- {{data("base.project.name")}} -->sdd-forge<!-- {{/data}} -->';
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "data");
    assert.equal(d.inline, true);
    assert.equal(d.preset, "base");
    assert.equal(d.source, "project");
    assert.equal(d.method, "name");
  });

  it("parses dotted source names", () => {
    const text = [
      '<!-- {{data("preset.config.constants.list", {labels: "Key|Value"})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].source, "config.constants");
    assert.equal(result[0].method, "list");
  });
});

// ---------------------------------------------------------------------------
// New syntax: {{text({prompt: "...", mode: "deep"})}}
// ---------------------------------------------------------------------------

describe("parseDirectives — new text syntax", () => {
  it("parses {{text(...)}} with prompt only", () => {
    const text = [
      '<!-- {{text({prompt: "Write an overview."})}} -->',
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "text");
    assert.equal(d.prompt, "Write an overview.");
    assert.deepEqual(d.params, {});
  });

  it("parses {{text(...)}} with all options", () => {
    const text = [
      '<!-- {{text({prompt: "Describe components.", mode: "deep", id: "components", maxLines: 10})}} -->',
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "text");
    assert.equal(d.prompt, "Describe components.");
    assert.deepEqual(d.params, { mode: "deep", id: "components", maxLines: 10 });
  });

  it("parses {{text(...)}} with content between tags", () => {
    const text = [
      '<!-- {{text({prompt: "Write overview."})}} -->',
      "Some generated content here.",
      "More content.",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].line, 0);
    assert.equal(result[0].endLine, 3);
  });
});

// ---------------------------------------------------------------------------
// Multiline directives
// ---------------------------------------------------------------------------

describe("parseDirectives — multiline", () => {
  it("parses multiline {{data(...)}} directive", () => {
    const text = [
      "# Title",
      "<!--",
      '{{data("webapp.controllers.list", {',
      '  labels: "Name|Path|Methods",',
      "  ignoreError: true",
      "})}}",
      "-->",
      "old content",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "data");
    assert.equal(d.preset, "webapp");
    assert.equal(d.source, "controllers");
    assert.equal(d.method, "list");
    assert.deepEqual(d.labels, ["Name", "Path", "Methods"]);
    assert.deepEqual(d.params, { ignoreError: true });
    assert.equal(d.line, 1); // start of <!-- block
    assert.equal(d.endLine, 8); // {{/data}} line
  });

  it("parses multiline {{text(...)}} directive", () => {
    const text = [
      "<!--",
      "{{text({",
      '  prompt: "Write a detailed description of the architecture.",',
      '  mode: "deep"',
      "})}}",
      "-->",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "text");
    assert.equal(d.prompt, "Write a detailed description of the architecture.");
    assert.deepEqual(d.params, { mode: "deep" });
  });
});

// ---------------------------------------------------------------------------
// Unclosed directive error
// ---------------------------------------------------------------------------

describe("parseDirectives — unclosed directive error", () => {
  it("throws error for unclosed {{data(...)}} directive", () => {
    const text = '<!-- {{data("base.project.summary")}} -->\nsome text';
    assert.throws(() => parseDirectives(text), /unclosed/i);
  });

  it("throws error for unclosed {{text(...)}} directive", () => {
    const text = '<!-- {{text({prompt: "Write overview."})}} -->';
    assert.throws(() => parseDirectives(text), /unclosed/i);
  });
});

// ---------------------------------------------------------------------------
// Legacy syntax rejection
// ---------------------------------------------------------------------------

describe("parseDirectives — legacy syntax not recognized", () => {
  it("does not parse old {{data: ...}} syntax", () => {
    const text = [
      '<!-- {{data: cakephp2.controllers.list("Name|File")}} -->',
      "content",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 0);
  });

  it("does not parse old {{text[...]: ...}} syntax", () => {
    const text = [
      "<!-- {{text[mode=deep]: Describe architecture.}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 0);
  });

  it("does not parse old {{text: ...}} syntax", () => {
    const text = [
      "<!-- {{text: Explain the architecture.}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 0);
  });
});

// ---------------------------------------------------------------------------
// resolveDataDirectives — new syntax
// ---------------------------------------------------------------------------

describe("resolveDataDirectives — new syntax", () => {
  it("resolves block data directive with new syntax", () => {
    const text = [
      '<!-- {{data("p.x.list", {labels: "A|B"})}} -->',
      "old content",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => "new content");
    assert.equal(result.replaced, 1);
    assert.ok(result.text.includes("new content"));
    assert.ok(!result.text.includes("old content"));
  });

  it("handles ignoreError with new syntax", () => {
    const text = [
      '<!-- {{data("base.monorepo.apps", {ignoreError: true})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => null);
    assert.ok(!result.text.includes("monorepo.apps"));
    assert.equal(result.replaced, 1);
  });
});
