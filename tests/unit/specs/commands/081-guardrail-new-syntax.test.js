import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { parseGuardrailArticles } = await import(
  "../../../../src/lib/guardrail.js"
);

// ---------------------------------------------------------------------------
// New syntax: {%guardrail%} / {%/guardrail%} (block form)
// ---------------------------------------------------------------------------

describe("parseGuardrailArticles — new {%guardrail%} syntax", () => {
  it("parses {%guardrail%} block with phase", () => {
    const text = [
      "# Project Guardrail",
      "",
      '<!-- {%guardrail {phase: [draft, spec]}%} -->',
      "### Single Responsibility",
      "Each spec shall address one concern.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, "Single Responsibility");
    assert.ok(articles[0].body.includes("Each spec shall address one concern"));
    assert.deepEqual(articles[0].meta.phase, ["draft", "spec"]);
  });

  it("parses {%guardrail%} block with all fields", () => {
    const text = [
      '<!-- {%guardrail {phase: [impl, lint], scope: [*.css, *.tsx], lint: /style\\s*=/}%} -->',
      "### No Inline Styles",
      "Do not use inline style attributes.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, "No Inline Styles");
    assert.deepEqual(articles[0].meta.phase, ["impl", "lint"]);
    assert.deepEqual(articles[0].meta.scope, ["*.css", "*.tsx"]);
    assert.ok(articles[0].meta.lint instanceof RegExp);
    assert.ok(articles[0].meta.lint.test("style ="));
  });

  it("parses multiple {%guardrail%} blocks", () => {
    const text = [
      "# Guardrail",
      "",
      '<!-- {%guardrail {phase: [spec]}%} -->',
      "### Rule A",
      "Spec rule.",
      "<!-- {%/guardrail%} -->",
      "",
      '<!-- {%guardrail {phase: [impl]}%} -->',
      "### Rule B",
      "Impl rule.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 2);
    assert.deepEqual(articles[0].meta.phase, ["spec"]);
    assert.deepEqual(articles[1].meta.phase, ["impl"]);
  });

  it("excludes {%guardrail%} and {%/guardrail%} tags from body", () => {
    const text = [
      '<!-- {%guardrail {phase: [spec]}%} -->',
      "### Rule",
      "Body content here.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.ok(!articles[0].body.includes("{%guardrail"), "body should not contain guardrail tags");
    assert.ok(!articles[0].body.includes("{%/guardrail"), "body should not contain closing guardrail tags");
    assert.ok(articles[0].body.includes("Body content here"));
  });
});

// ---------------------------------------------------------------------------
// Legacy syntax rejection
// ---------------------------------------------------------------------------

describe("parseGuardrailArticles — legacy {%meta%} not recognized", () => {
  it("does not parse old {%meta: ...%} as metadata", () => {
    const text = [
      "### Rule A",
      "<!-- {%meta: {phase: [spec, impl]}%} -->",
      "Body text.",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    // Without {%guardrail%} block, articles outside blocks are not parsed
    assert.equal(articles.length, 0);
  });
});
