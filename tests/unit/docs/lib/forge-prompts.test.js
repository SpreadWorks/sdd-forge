import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  summaryToText,
  buildForgeSystemPrompt,
  buildForgeFilePrompt,
  buildForgePrompt,
} from "../../../../src/docs/lib/forge-prompts.js";

// ---------------------------------------------------------------------------
// summaryToText
// ---------------------------------------------------------------------------

describe("summaryToText", () => {
  it("returns empty string for null summary", () => {
    assert.equal(summaryToText(null), "");
  });

  it("returns empty string for undefined", () => {
    assert.equal(summaryToText(undefined), "");
  });

  it("includes controller summary (fallback mode)", () => {
    const analysis = {
      controllers: {
        summary: { total: 3, totalActions: 10 },
        entries: [
          { file: "UsersController.php", className: "UsersController" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("Controllers: 3 files"));
    assert.ok(result.includes("10 actions"));
  });

  it("includes models summary (fallback mode)", () => {
    const analysis = {
      models: {
        summary: { total: 5 },
        entries: [],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("Models: 5 files"));
  });

  it("includes commands summary (fallback mode)", () => {
    const analysis = {
      commands: {
        summary: { total: 2 },
        entries: [
          { file: "ImportShell.php", className: "ImportShell" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("Commands: 2 files"));
  });

  it("includes routes summary (fallback mode)", () => {
    const analysis = {
      routes: {
        summary: { total: 5 },
        entries: [],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("Routes: 5 explicit routes"));
  });

  it("includes modules summary (fallback mode)", () => {
    const analysis = {
      modules: {
        summary: { total: 42 },
        entries: [],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("Modules: 42 files"));
  });

  it("handles empty analysis object", () => {
    const result = summaryToText({});
    assert.equal(result, "");
  });

  it("uses enriched summaries when enrichedAt is present", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      modules: {
        summary: { total: 2 },
        entries: [
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
        entries: [
          { file: "src/a.js", summary: "Has summary" },
          { file: "src/b.js" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("modules (1 entries):"));
    assert.ok(!result.includes("src/b.js"));
  });

  it("handles multiple categories in enriched mode", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      controllers: {
        summary: { total: 1 },
        entries: [
          { file: "UsersController.php", summary: "Handles users" },
        ],
      },
      models: {
        summary: { total: 1 },
        entries: [
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
      generatedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        entries: [
          { file: "src/a.js", summary: "A" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("modules"));
    assert.ok(!result.includes("analyzedAt"));
    assert.ok(!result.includes("generatedAt"));
  });

  it("uses name or className as fallback identifier in enriched mode", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      controllers: {
        summary: { total: 2 },
        entries: [
          { name: "UserCtrl", summary: "User controller" },
          { className: "PostCtrl", summary: "Post controller" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(result.includes("UserCtrl: User controller"));
    assert.ok(result.includes("PostCtrl: Post controller"));
  });

  it("skips categories where entries array is not present", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      extras: { foo: "bar" },
      modules: {
        summary: { total: 1 },
        entries: [{ file: "a.js", summary: "A" }],
      },
    };
    const result = summaryToText(analysis);
    assert.ok(!result.includes("extras"));
    assert.ok(result.includes("modules"));
  });

  it("skips categories where all items lack summary", () => {
    const analysis = {
      enrichedAt: "2026-01-01T00:00:00Z",
      modules: {
        summary: { total: 2 },
        entries: [
          { file: "a.js" },
          { file: "b.js" },
        ],
      },
    };
    const result = summaryToText(analysis);
    assert.equal(result, "");
  });
});

// ---------------------------------------------------------------------------
// buildForgeSystemPrompt
// ---------------------------------------------------------------------------

describe("buildForgeSystemPrompt", () => {
  it("loads role and rules from prompts.json (ja)", () => {
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

  it("includes user prompt", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "Please update the overview section",
      specPath: "",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(result.includes("[USER_PROMPT]"));
    assert.ok(result.includes("Please update the overview section"));
  });

  it("includes spec when specPath is provided", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "update",
      specPath: "specs/042/spec.md",
      specText: "# Goal\nUpdate all docs",
      analysisSummary: "",
    });
    assert.ok(result.includes("[SPEC_PATH]"));
    assert.ok(result.includes("specs/042/spec.md"));
    assert.ok(result.includes("[SPEC_CONTENT]"));
    assert.ok(result.includes("# Goal\nUpdate all docs"));
  });

  it("omits spec block when specPath is empty", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "update",
      specPath: "",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(!result.includes("[SPEC_PATH]"));
    assert.ok(!result.includes("[SPEC_CONTENT]"));
  });

  it("includes analysis summary when provided", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "update",
      specPath: "",
      specText: "",
      analysisSummary: "Controllers: 5 files\nModels: 3 files",
    });
    assert.ok(result.includes("[SOURCE_ANALYSIS]"));
    assert.ok(result.includes("Controllers: 5 files"));
  });

  it("omits analysis block when summary is empty", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "update",
      specPath: "",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(!result.includes("[SOURCE_ANALYSIS]"));
  });

  it("shows (empty) when specPath set but specText missing", () => {
    const result = buildForgeSystemPrompt({
      lang: "ja",
      userPrompt: "update",
      specPath: "specs/042/spec.md",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(result.includes("(empty)"));
  });
});

// ---------------------------------------------------------------------------
// buildForgeFilePrompt
// ---------------------------------------------------------------------------

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

  it("includes target file path", () => {
    const result = buildForgeFilePrompt({
      lang: "ja",
      targetFile: "docs/overview.md",
      round: 1,
      maxRuns: 3,
      reviewFeedback: "",
    });
    assert.ok(result.includes("[TARGET_FILE]"));
    assert.ok(result.includes("docs/overview.md"));
  });

  it("includes round/maxRuns info", () => {
    const result = buildForgeFilePrompt({
      lang: "ja",
      targetFile: "docs/01.md",
      round: 2,
      maxRuns: 5,
      reviewFeedback: "",
    });
    assert.ok(result.includes("round: 2/5"));
  });

  it("includes review feedback when provided", () => {
    const result = buildForgeFilePrompt({
      lang: "ja",
      targetFile: "docs/01.md",
      round: 2,
      maxRuns: 3,
      reviewFeedback: "Missing section on error handling",
    });
    assert.ok(result.includes("[PREVIOUS_REVIEW_FEEDBACK]"));
    assert.ok(result.includes("Missing section on error handling"));
  });
});

// ---------------------------------------------------------------------------
// buildForgePrompt (combined mode)
// ---------------------------------------------------------------------------

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

  it("includes role, rules, round, user prompt and review feedback", () => {
    const result = buildForgePrompt({
      lang: "ja",
      userPrompt: "my prompt",
      round: 3,
      maxRuns: 5,
      reviewFeedback: "fix section 2",
      specPath: "",
      specText: "",
      analysisSummary: "",
      targetFiles: ["docs/01.md"],
    });
    assert.ok(result.includes("docs-forge"));
    assert.ok(result.includes("[RULES]"));
    assert.ok(result.includes("round: 3/5"));
    assert.ok(result.includes("[USER_PROMPT]"));
    assert.ok(result.includes("my prompt"));
    assert.ok(result.includes("[PREVIOUS_REVIEW_FEEDBACK]"));
    assert.ok(result.includes("fix section 2"));
  });

  it("includes spec and analysis when provided", () => {
    const result = buildForgePrompt({
      lang: "ja",
      userPrompt: "update",
      round: 1,
      maxRuns: 1,
      reviewFeedback: "",
      specPath: "specs/001/spec.md",
      specText: "# Goal",
      analysisSummary: "5 controllers",
      targetFiles: ["docs/01.md"],
    });
    assert.ok(result.includes("[SPEC_PATH]"));
    assert.ok(result.includes("[SOURCE_ANALYSIS]"));
  });

  it("handles empty target files array", () => {
    const result = buildForgePrompt({
      lang: "ja",
      userPrompt: "test",
      round: 1,
      maxRuns: 1,
      reviewFeedback: "",
      specPath: "",
      specText: "",
      analysisSummary: "",
      targetFiles: [],
    });
    assert.ok(result.includes("[TARGET_FILES]"));
  });
});
