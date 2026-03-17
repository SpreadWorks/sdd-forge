import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripFillContent, countFilledInBatch, allTextDirectivesFilled, validateBatchResult } from "../../../../src/docs/commands/text.js";

describe("stripFillContent", () => {
  it("removes content between {{text}} and {{/text}} tags", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe this}} -->",
      "Some generated content",
      "More content",
      "<!-- {{/text}} -->",
      "",
      "## Next Section",
    ].join("\n");

    const result = stripFillContent(input);
    assert.ok(!result.includes("Some generated content"));
    assert.ok(!result.includes("More content"));
    assert.ok(result.includes("# Title"));
    assert.ok(result.includes("<!-- {{text: describe this}} -->"));
    assert.ok(result.includes("<!-- {{/text}} -->"));
    assert.ok(result.includes("## Next Section"));
  });

  it("preserves text without {{text}} directives", () => {
    const input = [
      "# Title",
      "Regular content",
      "More regular content",
    ].join("\n");

    const result = stripFillContent(input);
    assert.strictEqual(result, input);
  });

  it("handles multiple {{text}} directives", () => {
    const input = [
      "# Title",
      "<!-- {{text: first}} -->",
      "First content",
      "<!-- {{/text}} -->",
      "",
      "## Section 2",
      "<!-- {{text: second}} -->",
      "Second content",
      "<!-- {{/text}} -->",
      "",
      "## Section 3",
    ].join("\n");

    const result = stripFillContent(input);
    assert.ok(!result.includes("First content"));
    assert.ok(!result.includes("Second content"));
    assert.ok(result.includes("## Section 2"));
    assert.ok(result.includes("## Section 3"));
  });

  it("handles {{text}} with parameters", () => {
    const input = [
      "<!-- {{text[maxLines=5]: describe this}} -->",
      "Generated text here",
      "<!-- {{/text}} -->",
      "",
      "## Next",
    ].join("\n");

    const result = stripFillContent(input);
    assert.ok(!result.includes("Generated text here"));
    assert.ok(result.includes("<!-- {{text[maxLines=5]: describe this}} -->"));
    assert.ok(result.includes("<!-- {{/text}} -->"));
  });

  it("preserves empty block (no content between tags)", () => {
    const input = [
      "<!-- {{text: describe this}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");

    const result = stripFillContent(input);
    assert.ok(result.includes("<!-- {{text: describe this}} -->"));
    assert.ok(result.includes("<!-- {{/text}} -->"));
  });
});

describe("countFilledInBatch", () => {
  it("returns 0 when no directives are filled", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe this}} -->",
      "<!-- {{/text}} -->",
      "",
      "## Next Section",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 0);
  });

  it("counts filled directives", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe this}} -->",
      "This section describes the feature.",
      "<!-- {{/text}} -->",
      "",
      "## Next Section",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 1);
  });

  it("counts multiple filled directives", () => {
    const input = [
      "# Title",
      "<!-- {{text: first}} -->",
      "First content here.",
      "<!-- {{/text}} -->",
      "",
      "## Section 2",
      "<!-- {{text: second}} -->",
      "Second content here.",
      "<!-- {{/text}} -->",
      "",
      "## Section 3",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 2);
  });

  it("does not count empty block", () => {
    const input = [
      "<!-- {{text: first}} -->",
      "<!-- {{/text}} -->",
      "<!-- {{text: second}} -->",
      "Content",
      "<!-- {{/text}} -->",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 1);
  });

  it("does not count block with only blank lines", () => {
    const input = [
      "<!-- {{text: first}} -->",
      "",
      "",
      "<!-- {{/text}} -->",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 0);
  });
});

describe("allTextDirectivesFilled", () => {
  it("returns true when no text directives exist", () => {
    const input = "# Title\n\nSome content\n";
    assert.strictEqual(allTextDirectivesFilled(input), true);
  });

  it("returns true when all directives are filled", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe overview}} -->",
      "This is the overview.",
      "<!-- {{/text}} -->",
      "",
      "<!-- {{text: describe details}} -->",
      "These are the details.",
      "<!-- {{/text}} -->",
    ].join("\n");
    assert.strictEqual(allTextDirectivesFilled(input), true);
  });

  it("returns false when any directive is empty", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe overview}} -->",
      "This is the overview.",
      "<!-- {{/text}} -->",
      "",
      "<!-- {{text: describe details}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");
    assert.strictEqual(allTextDirectivesFilled(input), false);
  });

  it("returns false when all directives are empty", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe overview}} -->",
      "<!-- {{/text}} -->",
    ].join("\n");
    assert.strictEqual(allTextDirectivesFilled(input), false);
  });

  it("treats blank-only lines as empty", () => {
    const input = [
      "<!-- {{text: describe}} -->",
      "   ",
      "",
      "<!-- {{/text}} -->",
    ].join("\n");
    assert.strictEqual(allTextDirectivesFilled(input), false);
  });

  it("handles directives with params", () => {
    const input = [
      "<!-- {{text[id=auth, maxLines=5]: auth system}} -->",
      "Authentication details here.",
      "<!-- {{/text}} -->",
    ].join("\n");
    assert.strictEqual(allTextDirectivesFilled(input), true);
  });

  it("returns false when endLine is missing", () => {
    const input = [
      "<!-- {{text: describe}} -->",
      "Some content",
    ].join("\n");
    assert.strictEqual(allTextDirectivesFilled(input), false);
  });
});

describe("validateBatchResult", () => {
  function makeOriginal(lineCount) {
    return Array.from({ length: lineCount }, (_, i) => `line ${i + 1}`).join("\n") + "\n";
  }

  it("accepts result with similar line count", () => {
    const original = makeOriginal(100);
    const result = { text: makeOriginal(90), filled: 3, skipped: 0 };
    const v = validateBatchResult(original, result, 3, "test.md");
    assert.strictEqual(v.ok, true);
  });

  it("rejects result with severe shrinkage", () => {
    const original = makeOriginal(200);
    const result = { text: makeOriginal(10), filled: 1, skipped: 2 };
    const v = validateBatchResult(original, result, 3, "test.md");
    assert.strictEqual(v.ok, false);
    assert.ok(v.reason.includes("shrinkage"));
  });

  it("skips shrinkage check for short files", () => {
    const original = makeOriginal(10);
    const result = { text: makeOriginal(3), filled: 1, skipped: 0 };
    const v = validateBatchResult(original, result, 1, "test.md");
    assert.strictEqual(v.ok, true);
  });

  it("rejects when 0 directives filled", () => {
    const original = makeOriginal(50);
    const result = { text: makeOriginal(50), filled: 0, skipped: 3 };
    const v = validateBatchResult(original, result, 3, "test.md");
    assert.strictEqual(v.ok, false);
    assert.ok(v.reason.includes("0/3"));
  });

  it("accepts when all directives filled", () => {
    const original = makeOriginal(50);
    const result = { text: makeOriginal(60), filled: 3, skipped: 0 };
    const v = validateBatchResult(original, result, 3, "test.md");
    assert.strictEqual(v.ok, true);
  });

  it("accepts when no directives exist", () => {
    const original = makeOriginal(50);
    const result = { text: makeOriginal(50), filled: 0, skipped: 0 };
    const v = validateBatchResult(original, result, 0, "test.md");
    assert.strictEqual(v.ok, true);
  });
});
