import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimateRelevantFiles } from "../../../../src/docs/commands/forge.js";

describe("estimateRelevantFiles", () => {
  const allFiles = [
    "docs/overview.md",
    "docs/cli_commands.md",
    "docs/configuration.md",
    "docs/internal_design.md",
  ];

  it("returns matching files when spec mentions chapter keywords", () => {
    const specText = "## Scope\n- Update CLI commands to add new flag\n- Fix configuration validation";
    const result = estimateRelevantFiles(specText, allFiles);
    assert.ok(result.includes("docs/cli_commands.md"));
    assert.ok(result.includes("docs/configuration.md"));
    assert.ok(!result.includes("docs/internal_design.md"));
  });

  it("returns empty array when no keywords match", () => {
    const specText = "## Scope\n- Fix a very specific bug in parser";
    const result = estimateRelevantFiles(specText, allFiles);
    // "overview" matches because "overview" is a common word that might appear,
    // but the spec text here doesn't contain any chapter keywords
    assert.equal(result.length, 0);
  });

  it("returns empty array for empty spec text", () => {
    assert.deepEqual(estimateRelevantFiles("", allFiles), []);
    assert.deepEqual(estimateRelevantFiles(null, allFiles), []);
  });

  it("is case-insensitive", () => {
    const specText = "Update the OVERVIEW section and CLI COMMANDS";
    const result = estimateRelevantFiles(specText, allFiles);
    assert.ok(result.includes("docs/overview.md"));
    assert.ok(result.includes("docs/cli_commands.md"));
  });

  it("returns all files if all match (no filtering benefit)", () => {
    const specText = "overview cli commands configuration internal design";
    const result = estimateRelevantFiles(specText, allFiles);
    assert.equal(result.length, allFiles.length);
  });
});
