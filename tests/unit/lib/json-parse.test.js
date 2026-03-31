import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fixUnescapedQuotes, extractBalancedJson } from "../../../src/lib/json-parse.js";

describe("fixUnescapedQuotes", () => {
  it("returns valid JSON unchanged", () => {
    const json = '{"key": "value", "num": 42}';
    assert.equal(fixUnescapedQuotes(json), json);
  });

  it("fixes unescaped double quotes mid-value when followed by structural char", () => {
    // "key": "value "x": next" → the quote before x is followed by x (not structural),
    // so it gets escaped. The quote after next is followed by } (structural), so it ends the string.
    const broken = '{"a": "hello "world"}';
    const fixed = fixUnescapedQuotes(broken);
    // The quote before world is escaped, making it valid
    assert.doesNotThrow(() => JSON.parse(fixed));
  });

  it("removes invalid escape sequences", () => {
    // AI outputs \` which is not valid JSON escape
    const broken = '{"code": "value with \\` backtick"}';
    const fixed = fixUnescapedQuotes(broken);
    assert.doesNotThrow(() => JSON.parse(fixed));
  });

  it("returns empty string for empty input", () => {
    assert.equal(fixUnescapedQuotes(""), "");
  });

  it("handles value ending with structural char after unescaped quote", () => {
    // Quote before ] is structural end → string terminates correctly
    const broken = '{"items": ["a "b"]}';
    const fixed = fixUnescapedQuotes(broken);
    assert.ok(fixed.includes('\\"'));
  });

  it("preserves valid escape sequences", () => {
    const json = '{"path": "C:\\\\Users\\\\test", "newline": "a\\nb"}';
    const fixed = fixUnescapedQuotes(json);
    assert.equal(fixed, json);
  });
});

describe("extractBalancedJson", () => {
  it("returns null when no { is found", () => {
    assert.equal(extractBalancedJson("no json here"), null);
  });

  it("extracts JSON from surrounding text", () => {
    const text = 'Here is the result: {"key": "value"} and some more text';
    const result = extractBalancedJson(text);
    assert.equal(result, '{"key": "value"}');
  });

  it("extracts nested JSON correctly", () => {
    const json = '{"a": {"b": {"c": 1}}, "d": 2}';
    const text = `prefix ${json} suffix`;
    assert.equal(extractBalancedJson(text), json);
  });

  it("ignores braces inside strings", () => {
    const json = '{"msg": "use {braces} here"}';
    assert.equal(extractBalancedJson(json), json);
  });

  it("returns null when closing brace is missing", () => {
    assert.equal(extractBalancedJson('{"key": "value"'), null);
  });

  it("extracts minified JSON", () => {
    const json = '{"a":1,"b":"x","c":[1,2],"d":{"e":true}}';
    assert.equal(extractBalancedJson(json), json);
  });

  it("handles escaped quotes inside strings", () => {
    const json = '{"msg": "say \\"hello\\""}';
    assert.equal(extractBalancedJson(json), json);
  });

  it("extracts first complete object when multiple exist", () => {
    const text = '{"first": 1} {"second": 2}';
    assert.equal(extractBalancedJson(text), '{"first": 1}');
  });
});
