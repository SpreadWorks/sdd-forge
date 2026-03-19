import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveDataDirectives,
} from "../../../../src/docs/lib/directive-parser.js";

// ---------------------------------------------------------------------------
// I1: header/footer hide feature
// ---------------------------------------------------------------------------

describe("I1: data directive header/footer", () => {
  const tpl = (body) =>
    [
      "# Title",
      '<!-- {{data: base.project.name("")}} -->',
      "<!-- {{header}} -->",
      "### Section Heading",
      "| Col1 | Col2 |",
      "|---|---|",
      "<!-- {{/header}} -->",
      body,
      "<!-- {{footer}} -->",
      "_Footer note_",
      "<!-- {{/footer}} -->",
      "<!-- {{/data}} -->",
      "rest",
    ].join("\n");

  it("data=value: header → data → footer displayed", () => {
    const text = tpl("");
    const result = resolveDataDirectives(text, () => "| a | b |");
    // header content should be visible (separate open/close tags)
    assert.ok(result.text.includes("<!-- {{header}} -->"));
    assert.ok(result.text.includes("### Section Heading"));
    assert.ok(result.text.includes("<!-- {{/header}} -->"));
    // data should be present
    assert.ok(result.text.includes("| a | b |"));
    // footer should be visible
    assert.ok(result.text.includes("<!-- {{footer}} -->"));
    assert.ok(result.text.includes("_Footer note_"));
    assert.ok(result.text.includes("<!-- {{/footer}} -->"));
    // correct order: heading before data before footer
    const headingIdx = result.text.indexOf("### Section Heading");
    const dataIdx = result.text.indexOf("| a | b |");
    const footerIdx = result.text.indexOf("_Footer note_");
    assert.ok(headingIdx < dataIdx, "heading before data");
    assert.ok(dataIdx < footerIdx, "data before footer");
    assert.equal(result.replaced, 1);
  });

  it("data=null: header/footer content folded into HTML comments", () => {
    const text = tpl("");
    const result = resolveDataDirectives(text, () => null);
    // header should be folded: <!-- {{header}}\n...\n{{/header}} -->
    assert.ok(result.text.includes("<!-- {{header}}\n"), "header folded open");
    assert.ok(result.text.includes("{{/header}} -->"), "header folded close");
    // footer should be folded
    assert.ok(result.text.includes("<!-- {{footer}}\n"), "footer folded open");
    assert.ok(result.text.includes("{{/footer}} -->"), "footer folded close");
    // separate header/footer tags should NOT be present
    assert.ok(!result.text.includes("<!-- {{header}} -->"), "no standalone header open");
    assert.ok(!result.text.includes("<!-- {{/header}} -->"), "no standalone header close");
    // directives should still be present for next build
    assert.ok(result.text.includes("{{data:"));
    assert.ok(result.text.includes("{{/data}}"));
    assert.equal(result.replaced, 0);
  });

  it("header only (no footer): data=value shows header + data", () => {
    const text = [
      '<!-- {{data: base.project.name("")}} -->',
      "<!-- {{header}} -->",
      "### Heading",
      "<!-- {{/header}} -->",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => "content");
    assert.ok(result.text.includes("<!-- {{header}} -->"));
    assert.ok(result.text.includes("### Heading"));
    assert.ok(result.text.includes("content"));
    assert.equal(result.replaced, 1);
  });

  it("header only (no footer): data=null folds header", () => {
    const text = [
      '<!-- {{data: base.project.name("")}} -->',
      "<!-- {{header}} -->",
      "### Heading",
      "<!-- {{/header}} -->",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => null);
    assert.ok(result.text.includes("<!-- {{header}}\n"), "header folded");
    assert.ok(!result.text.includes("<!-- {{header}} -->"), "no standalone header");
  });

  it("no header/footer: backwards compatible (data=value)", () => {
    const text = [
      '<!-- {{data: base.project.name("")}} -->',
      "old content",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => "new content");
    assert.ok(result.text.includes("new content"));
    assert.ok(!result.text.includes("old content"));
    assert.equal(result.replaced, 1);
  });

  it("no header/footer: backwards compatible (data=null)", () => {
    const text = [
      '<!-- {{data: base.project.name("")}} -->',
      "old content",
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = resolveDataDirectives(text, () => null);
    // null means no replacement — original content preserved
    assert.ok(result.text.includes("old content"));
    assert.equal(result.replaced, 0);
  });
});
