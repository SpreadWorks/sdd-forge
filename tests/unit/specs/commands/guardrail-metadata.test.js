import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { parseGuardrailArticles } = await import(
  "../../../../src/lib/guardrail.js"
);
const { buildGuardrailPrompt } = await import(
  "../../../../src/flow/run/gate.js"
);

// ---------------------------------------------------------------------------
// parseGuardrailArticles: metadata parsing
// ---------------------------------------------------------------------------

describe("parseGuardrailArticles metadata parsing", () => {
  it("parses {%guardrail%} directive with all fields", () => {
    const text = [
      "# Project Guardrail",
      "",
      '<!-- {%guardrail {phase: [impl, lint], scope: [*.css, *.tsx], lint: /style\\s*=/}%} -->',
      "### No Inline Styles",
      "Do not use inline style attributes.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, "No Inline Styles");
    assert.ok(articles[0].body.includes("Do not use inline style"));
    // meta should be parsed
    assert.ok(articles[0].meta, "meta field should exist");
    assert.deepEqual(articles[0].meta.phase, ["impl", "lint"]);
    assert.deepEqual(articles[0].meta.scope, ["*.css", "*.tsx"]);
    assert.ok(articles[0].meta.lint instanceof RegExp, "lint should be a RegExp");
    assert.ok(articles[0].meta.lint.test("style ="), "lint pattern should match");
  });

  it("parses phase-only metadata", () => {
    const text = [
      "<!-- {%guardrail {phase: [spec, impl]}%} -->",
      "### Rule A",
      "Body text.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 1);
    assert.deepEqual(articles[0].meta.phase, ["spec", "impl"]);
    assert.equal(articles[0].meta.scope, undefined);
    assert.equal(articles[0].meta.lint, undefined);
  });

  it("returns empty array when no {%guardrail%} blocks", () => {
    const text = [
      "### Plain Rule",
      "No guardrail block here.",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 0);
  });

  it("excludes {%guardrail%} line from body", () => {
    const text = [
      "<!-- {%guardrail {phase: [lint], lint: /TODO/}%} -->",
      "### Rule",
      "Body content here.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.ok(!articles[0].body.includes("{%guardrail"), "body should not contain guardrail directive");
    assert.ok(articles[0].body.includes("Body content here"));
  });

  it("parses lint pattern with flags", () => {
    const text = [
      "<!-- {%guardrail {phase: [lint], lint: /console\\.log/gi}%} -->",
      "### Case Insensitive Rule",
      "No console.log.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.ok(articles[0].meta.lint instanceof RegExp);
    assert.equal(articles[0].meta.lint.flags, "gi");
    assert.ok(articles[0].meta.lint.test("Console.Log"));
  });

  it("handles multiple articles with mixed metadata", () => {
    const text = [
      "# Guardrail",
      "",
      "<!-- {%guardrail {phase: [spec]}%} -->",
      "### Spec Only Rule",
      "Check this in spec phase.",
      "<!-- {%/guardrail%} -->",
      "",
      "<!-- {%guardrail {phase: [lint], scope: [*.js], lint: /eval\\(/}%} -->",
      "### Lint Rule",
      "No eval().",
      "<!-- {%/guardrail%} -->",
      "",
      "<!-- {%guardrail {phase: [impl]}%} -->",
      "### Impl Rule",
      "Follow this during implementation.",
      "<!-- {%/guardrail%} -->",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 3);

    // Spec Only Rule
    assert.deepEqual(articles[0].meta.phase, ["spec"]);

    // Lint Rule: explicit meta
    assert.deepEqual(articles[1].meta.phase, ["lint"]);
    assert.deepEqual(articles[1].meta.scope, ["*.js"]);
    assert.ok(articles[1].meta.lint.test("eval("));

    // Impl Rule: explicit meta
    assert.deepEqual(articles[2].meta.phase, ["impl"]);
  });
});

// ---------------------------------------------------------------------------
// filterByPhase
// ---------------------------------------------------------------------------

describe("filterByPhase", () => {
  // Import will be available after implementation
  let filterByPhase;

  it("filters articles by phase", async () => {
    ({ filterByPhase } = await import("../../../../src/lib/guardrail.js"));

    const articles = [
      { title: "A", body: "", meta: { phase: ["spec"] } },
      { title: "B", body: "", meta: { phase: ["impl", "lint"] } },
      { title: "C", body: "", meta: { phase: ["spec", "impl"] } },
      { title: "D", body: "", meta: { phase: ["lint"] } },
    ];

    const specArticles = filterByPhase(articles, "spec");
    assert.equal(specArticles.length, 2);
    assert.deepEqual(specArticles.map((a) => a.title), ["A", "C"]);

    const implArticles = filterByPhase(articles, "impl");
    assert.equal(implArticles.length, 2);
    assert.deepEqual(implArticles.map((a) => a.title), ["B", "C"]);

    const lintArticles = filterByPhase(articles, "lint");
    assert.equal(lintArticles.length, 2);
    assert.deepEqual(lintArticles.map((a) => a.title), ["B", "D"]);
  });
});

// ---------------------------------------------------------------------------
// scope matching
// ---------------------------------------------------------------------------

describe("matchScope", () => {
  let matchScope;

  it("matches glob patterns against file paths", async () => {
    ({ matchScope } = await import("../../../../src/lib/guardrail.js"));

    // *.css matches .css files
    assert.ok(matchScope("src/styles/main.css", ["*.css"]));
    assert.ok(!matchScope("src/app.js", ["*.css"]));

    // *Controller.php matches controller files
    assert.ok(matchScope("app/Controller/UsersController.php", ["*Controller.php"]));
    assert.ok(!matchScope("app/Model/User.php", ["*Controller.php"]));

    // Multiple patterns (OR logic)
    assert.ok(matchScope("src/app.tsx", ["*.css", "*.tsx"]));
    assert.ok(matchScope("src/style.css", ["*.css", "*.tsx"]));
    assert.ok(!matchScope("src/app.js", ["*.css", "*.tsx"]));
  });

  it("returns true when scope is undefined (all files match)", async () => {
    ({ matchScope } = await import("../../../../src/lib/guardrail.js"));
    assert.ok(matchScope("any/file.js", undefined));
    assert.ok(matchScope("any/file.js", []));
  });
});

// ---------------------------------------------------------------------------
// buildGuardrailPrompt: phase filtering
// ---------------------------------------------------------------------------

describe("buildGuardrailPrompt with phase filtering", () => {
  it("excludes non-spec articles from prompt", () => {
    const articles = [
      { title: "Spec Rule", body: "Check in spec.", meta: { phase: ["spec"] } },
      { title: "Lint Rule", body: "Check in lint.", meta: { phase: ["lint"] } },
      { title: "Both Rule", body: "Check in both.", meta: { phase: ["spec", "lint"] } },
    ];
    const prompt = buildGuardrailPrompt("spec content", articles);
    assert.ok(prompt.includes("Spec Rule"));
    assert.ok(!prompt.includes("Lint Rule"));
    assert.ok(prompt.includes("Both Rule"));
  });

  it("returns null when no spec-phase articles remain after filtering", () => {
    const articles = [
      { title: "Lint Only", body: "Lint check.", meta: { phase: ["lint"] } },
      { title: "Impl Only", body: "Impl check.", meta: { phase: ["impl"] } },
    ];
    const prompt = buildGuardrailPrompt("spec content", articles);
    assert.equal(prompt, null);
  });
});

// ---------------------------------------------------------------------------
// lint command: warnings for misconfigured articles
// ---------------------------------------------------------------------------

describe("lint article validation", () => {
  let validateLintArticles;

  it("warns when lint pattern exists but phase does not include lint", async () => {
    ({ validateLintArticles } = await import("../../../../src/lib/lint.js"));

    const articles = [
      { title: "Good", body: "", meta: { phase: ["lint"], lint: /TODO/ } },
      { title: "Bad", body: "", meta: { phase: ["spec"], lint: /FIXME/ } },
      { title: "No Lint", body: "", meta: { phase: ["spec"] } },
    ];

    const warnings = validateLintArticles(articles);
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes("Bad"));
  });
});
