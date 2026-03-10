import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  summaryToText,
  buildForgeSystemPrompt,
  buildForgeFilePrompt,
  buildForgePrompt,
} from "../../../src/docs/lib/forge-prompts.js";

describe("summaryToText", () => {
  it("returns empty string for null summary", () => {
    assert.equal(summaryToText(null), "");
  });

  it("includes controller summary (legacy mode)", () => {
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

  it("includes routes summary (legacy mode)", () => {
    const summary = {
      routes: { total: 5 },
    };
    const result = summaryToText(summary);
    assert.ok(result.includes("Routes: 5 explicit routes"));
  });

  it("uses enriched summaries when enrichedAt is present", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      modules: {
        summary: { total: 2 },
        modules: [
          { file: "src/a.js", summary: "Module A handles auth", chapter: "overview" },
          { file: "src/b.js", summary: "Module B handles config", chapter: "configuration" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("modules (2 entries):"));
    assert.ok(result.includes("src/a.js: Module A handles auth"));
    assert.ok(result.includes("src/b.js: Module B handles config"));
  });

  it("skips entries without summary in enriched mode", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      modules: {
        summary: { total: 2 },
        modules: [
          { file: "src/a.js", summary: "Has summary" },
          { file: "src/b.js" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("modules (1 entries):"));
    assert.ok(result.includes("src/a.js: Has summary"));
    assert.ok(!result.includes("src/b.js"));
  });

  it("handles multiple categories in enriched mode", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      controllers: {
        summary: { total: 1 },
        controllers: [
          { file: "UsersController.php", summary: "Handles users" },
        ],
      },
      models: {
        summary: { total: 1 },
        models: [
          { file: "User.php", summary: "User data" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("controllers (1 entries):"));
    assert.ok(result.includes("models (1 entries):"));
  });

  it("skips meta keys in enriched mode", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      analyzedAt: "2026-01-01T00:00:00Z",
      extras: { foo: "bar" },
      modules: {
        summary: { total: 1 },
        modules: [
          { file: "src/a.js", summary: "A" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("modules"));
    assert.ok(!result.includes("extras"));
    assert.ok(!result.includes("analyzedAt"));
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
