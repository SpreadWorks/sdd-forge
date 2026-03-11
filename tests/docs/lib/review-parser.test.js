import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_PATCH_ORDER,
  extractNeedsInput,
  summarizeReview,
  parseReviewMisses,
  parseFileResults,
  ensureSection,
  summarizeNeedsInput,
} from "../../../src/docs/lib/review-parser.js";

describe("FALLBACK_PATCH_ORDER", () => {
  it("is a frozen array of expected keys", () => {
    assert.deepEqual(FALLBACK_PATCH_ORDER, ["controllers", "tables", "headings", "sections"]);
    assert.ok(Object.isFrozen(FALLBACK_PATCH_ORDER));
  });
});

describe("extractNeedsInput", () => {
  it("returns empty array when no NEEDS_INPUT marker", () => {
    assert.deepEqual(extractNeedsInput("all good"), []);
  });

  it("extracts question lines after NEEDS_INPUT", () => {
    const text = "NEEDS_INPUT\n- What is X?\n- How about Y?\n\nother text";
    const result = extractNeedsInput(text);
    assert.deepEqual(result, ["What is X?", "How about Y?"]);
  });
});

describe("summarizeReview", () => {
  it("extracts [FAIL] lines", () => {
    const text = "[PASS] ok\n[FAIL] missing section\n[FAIL] too short";
    const result = summarizeReview(text);
    assert.ok(result.includes("[FAIL] missing section"));
    assert.ok(result.includes("[FAIL] too short"));
  });

  it("extracts [WARN] lines", () => {
    const text = "[WARN] uncovered analysis category: modules (3 entries)\n[FAIL] too short\n";
    const result = summarizeReview(text);
    assert.ok(result.includes("[WARN] uncovered analysis category: modules"));
    assert.ok(result.includes("[FAIL] too short"));
  });

  it("returns fallback message for empty input", () => {
    assert.equal(summarizeReview(""), "(no parsed failures)");
  });
});

describe("parseReviewMisses", () => {
  it("parses [MISS] controller entries", () => {
    const text = "[MISS] UsersController\n[MISS] PostsController\n";
    // Note: parser expects class name without "Controller" suffix
    // Looking at the regex: /^\[MISS\]\s+([A-Za-z0-9_]+)$/
    const text2 = "[MISS] Users\n[MISS] Posts\n";
    const result = parseReviewMisses(text2);
    assert.deepEqual(result.controllers, ["Posts", "Users"]);
  });

  it("parses [MISS] table entries", () => {
    const text = "[MISS] table users\n[MISS] table posts\n";
    const result = parseReviewMisses(text);
    assert.deepEqual(result.tables, ["posts", "users"]);
  });

  it("parses [FAIL] missing heading entries", () => {
    const text = "[FAIL] missing heading: ## Architecture\n";
    const result = parseReviewMisses(text);
    assert.deepEqual(result.headings, ["## Architecture"]);
  });

  it("parses [FAIL] missing section entries", () => {
    const text = "[FAIL] missing section: DB Tables\n";
    const result = parseReviewMisses(text);
    assert.deepEqual(result.sections, ["DB Tables"]);
  });

  it("deduplicates and sorts results", () => {
    const text = "[MISS] Zebra\n[MISS] Alpha\n[MISS] Zebra\n";
    const result = parseReviewMisses(text);
    assert.deepEqual(result.controllers, ["Alpha", "Zebra"]);
  });
});

describe("parseFileResults", () => {
  const allFiles = [
    "docs/overview.md",
    "docs/cli_commands.md",
    "docs/configuration.md",
  ];

  it("extracts failed files from [FAIL] lines", () => {
    const output = [
      "3 件の章ファイルを検出",
      "[FAIL] 行数不足 (5 行): overview.md",
      "[FAIL] H1 見出しがありません: overview.md",
    ].join("\n");
    const result = parseFileResults(output, allFiles);
    assert.deepEqual(result.failedFiles, ["docs/overview.md"]);
    assert.deepEqual(result.passedFiles, ["docs/cli_commands.md", "docs/configuration.md"]);
  });

  it("matches full path file names", () => {
    const output = "[FAIL] 行数不足 (5 行): docs/cli_commands.md\n";
    const result = parseFileResults(output, allFiles);
    assert.deepEqual(result.failedFiles, ["docs/cli_commands.md"]);
  });

  it("returns all files as passed when no [FAIL] lines", () => {
    const output = "docs quality check: PASSED\n";
    const result = parseFileResults(output, allFiles);
    assert.deepEqual(result.passedFiles, allFiles);
    assert.deepEqual(result.failedFiles, []);
  });

  it("returns empty arrays for empty input", () => {
    const result = parseFileResults("", []);
    assert.deepEqual(result.passedFiles, []);
    assert.deepEqual(result.failedFiles, []);
  });

  it("handles multiple failed files", () => {
    const output = [
      "[FAIL] 行数不足 (3 行): overview.md",
      "[FAIL] HTML コメント外に露出したディレクティブ 1 件: cli_commands.md",
    ].join("\n");
    const result = parseFileResults(output, allFiles);
    assert.equal(result.failedFiles.length, 2);
    assert.equal(result.passedFiles.length, 1);
    assert.deepEqual(result.passedFiles, ["docs/configuration.md"]);
  });
});

describe("ensureSection", () => {
  it("returns text as-is when heading exists", () => {
    const text = "# Doc\n\n### My Section\n\ncontent\n";
    assert.equal(ensureSection(text, "### My Section"), text);
  });

  it("appends heading when not found", () => {
    const text = "# Doc\n\ncontent";
    const result = ensureSection(text, "### New Section");
    assert.ok(result.includes("### New Section"));
    assert.ok(result.endsWith("\n\n"));
  });
});

describe("summarizeNeedsInput", () => {
  it("extracts [FAIL] and [MISS] lines", () => {
    const text = "[PASS] ok\n[FAIL] bad\n[MISS] Users\n[INFO] note\n";
    const result = summarizeNeedsInput(text);
    assert.deepEqual(result, ["[FAIL] bad", "[MISS] Users"]);
  });

  it("limits to 8 entries", () => {
    const lines = Array.from({ length: 15 }, (_, i) => `[FAIL] item${i}`).join("\n");
    const result = summarizeNeedsInput(lines);
    assert.equal(result.length, 8);
  });
});
