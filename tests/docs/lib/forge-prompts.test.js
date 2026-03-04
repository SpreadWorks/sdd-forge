import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  summaryToText,
  buildForgeSystemPrompt,
  buildForgeFilePrompt,
  buildForgePrompt,
  buildContextUpdatePrompt,
} from "../../../src/docs/lib/forge-prompts.js";

describe("summaryToText", () => {
  it("returns empty string for null summary", () => {
    assert.equal(summaryToText(null), "");
  });

  it("includes controller summary", () => {
    const summary = {
      controllers: {
        total: 3,
        totalActions: 10,
        top: [
          { className: "UsersController", actions: ["index", "show"] },
        ],
      },
    };
    const result = summaryToText(summary);
    assert.ok(result.includes("Controllers: 3 files"));
    assert.ok(result.includes("UsersController"));
  });

  it("includes routes summary", () => {
    const summary = {
      routes: { total: 5 },
    };
    const result = summaryToText(summary);
    assert.ok(result.includes("Routes: 5 explicit routes"));
  });
});

describe("buildForgeSystemPrompt", () => {
  it("loads role and rules from prompts.json", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "improve docs",
      specPath: "",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(result.includes("docs-forge"));
    assert.ok(result.includes("[RULES]"));
    assert.ok(result.includes("推測は避け"));
  });

  it("works with en locale", () => {
    const result = buildForgeSystemPrompt({
      lang: "en",
      userPrompt: "improve docs",
      specPath: "",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(result.includes("docs-forge"));
    assert.ok(result.includes("Avoid speculation"));
  });
});

describe("buildForgeFilePrompt", () => {
  it("uses locale-specific no-feedback text", () => {
    const ja = buildForgeFilePrompt({
      lang: "ja",
      targetFile: "docs/01.md",
      round: 1,
      maxRuns: 3,
      reviewFeedback: "",
    });
    assert.ok(ja.includes("なし"));

    const en = buildForgeFilePrompt({
      lang: "en",
      targetFile: "docs/01.md",
      round: 1,
      maxRuns: 3,
      reviewFeedback: "",
    });
    assert.ok(en.includes("none"));
  });
});

describe("buildForgePrompt", () => {
  it("includes all target files", () => {
    const result = buildForgePrompt({
      lang: "ja",
      userPrompt: "test",
      round: 1,
      maxRuns: 2,
      reviewFeedback: "",
      specPath: "",
      specText: "",
      analysisSummary: "",
      targetFiles: ["docs/01.md", "docs/02.md"],
    });
    assert.ok(result.includes("docs/01.md"));
    assert.ok(result.includes("docs/02.md"));
    assert.ok(result.includes("[TARGET_FILES]"));
  });
});

describe("buildContextUpdatePrompt", () => {
  it("includes instruction and snippets", () => {
    const result = buildContextUpdatePrompt({
      lang: "ja",
      snippets: "### 01_overview.md\n# Overview",
    });
    assert.ok(result.includes("プロジェクト概要"));
    assert.ok(result.includes("01_overview.md"));
  });

  it("works with en locale", () => {
    const result = buildContextUpdatePrompt({
      lang: "en",
      snippets: "### 01_overview.md\n# Overview",
    });
    assert.ok(result.includes("project overview"));
    assert.ok(result.includes("01_overview.md"));
  });
});
