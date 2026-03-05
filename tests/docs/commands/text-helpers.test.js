import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripFillContent, countFilledInBatch } from "../../../src/docs/commands/text.js";

describe("stripFillContent", () => {
  it("removes content after {{text}} directives", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe this}} -->",
      "Some generated content",
      "More content",
      "",
      "## Next Section",
    ].join("\n");

    const result = stripFillContent(input);
    assert.ok(!result.includes("Some generated content"));
    assert.ok(!result.includes("More content"));
    assert.ok(result.includes("# Title"));
    assert.ok(result.includes("<!-- {{text: describe this}} -->"));
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
      "",
      "## Section 2",
      "<!-- {{text: second}} -->",
      "Second content",
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
      "",
      "## Next",
    ].join("\n");

    const result = stripFillContent(input);
    assert.ok(!result.includes("Generated text here"));
    assert.ok(result.includes("<!-- {{text[maxLines=5]: describe this}} -->"));
  });
});

describe("countFilledInBatch", () => {
  it("returns 0 when no directives are filled", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe this}} -->",
      "",
      "## Next Section",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 0);
  });

  it("counts filled directives", () => {
    const input = [
      "# Title",
      "<!-- {{text: describe this}} -->",
      "",
      "This section describes the feature.",
      "",
      "## Next Section",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 1);
  });

  it("counts multiple filled directives", () => {
    const input = [
      "# Title",
      "<!-- {{text: first}} -->",
      "",
      "First content here.",
      "",
      "## Section 2",
      "<!-- {{text: second}} -->",
      "",
      "Second content here.",
      "",
      "## Section 3",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 2);
  });

  it("does not count directive followed by another directive", () => {
    const input = [
      "<!-- {{text: first}} -->",
      "<!-- {{text: second}} -->",
      "",
      "Content",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 1);
  });

  it("does not count directive followed by heading", () => {
    const input = [
      "<!-- {{text: first}} -->",
      "## Heading",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(input), 0);
  });
});
