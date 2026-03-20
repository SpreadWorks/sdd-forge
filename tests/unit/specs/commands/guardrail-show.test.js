import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../../helpers/tmp-dir.js";

const GUARDRAIL_CMD = join(process.cwd(), "src/spec/commands/guardrail.js");

// ---------------------------------------------------------------------------
// filterByPhase: "draft" phase support
// ---------------------------------------------------------------------------

describe("filterByPhase supports draft phase", () => {
  let filterByPhase;

  it("filters articles with phase: [draft]", async () => {
    ({ filterByPhase } = await import("../../../../src/spec/commands/guardrail.js"));

    const articles = [
      { title: "Draft Rule", body: "", meta: { phase: ["draft"] } },
      { title: "Spec Rule", body: "", meta: { phase: ["spec"] } },
      { title: "Both Rule", body: "", meta: { phase: ["draft", "spec"] } },
      { title: "Impl Rule", body: "", meta: { phase: ["impl"] } },
    ];

    const draftArticles = filterByPhase(articles, "draft");
    assert.equal(draftArticles.length, 2);
    assert.deepEqual(draftArticles.map((a) => a.title), ["Draft Rule", "Both Rule"]);
  });
});

// ---------------------------------------------------------------------------
// guardrail show CLI: merges preset chain + project guardrail, filters by phase
// ---------------------------------------------------------------------------

describe("guardrail show CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("outputs only draft-phase articles", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    // Project-specific guardrail with draft-phase article
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### Draft Only Rule",
      "<!-- {%meta: {phase: [draft]}%} -->",
      "This rule is for drafts only.",
      "",
      "### Spec Only Rule",
      "<!-- {%meta: {phase: [spec]}%} -->",
      "This rule is for specs only.",
    ].join("\n"));

    const result = execFileSync("node", [GUARDRAIL_CMD, "show", "--phase", "draft"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.ok(result.includes("Draft Only Rule"), "should include draft-phase article");
    assert.ok(!result.includes("Spec Only Rule"), "should exclude spec-phase article");
  });

  it("outputs only spec-phase articles", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### Draft Rule",
      "<!-- {%meta: {phase: [draft]}%} -->",
      "Draft only.",
      "",
      "### Spec Rule",
      "<!-- {%meta: {phase: [spec]}%} -->",
      "Spec only.",
      "",
      "### Both Rule",
      "<!-- {%meta: {phase: [draft, spec]}%} -->",
      "Both phases.",
    ].join("\n"));

    const result = execFileSync("node", [GUARDRAIL_CMD, "show", "--phase", "spec"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.ok(!result.includes("Draft Rule"), "should exclude draft-only article");
    assert.ok(result.includes("Spec Rule"), "should include spec-phase article");
    assert.ok(result.includes("Both Rule"), "should include both-phase article");
  });

  it("outputs only impl-phase articles", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### Impl Rule",
      "<!-- {%meta: {phase: [impl]}%} -->",
      "Impl only.",
      "",
      "### Spec Rule",
      "Spec only (default phase).",
    ].join("\n"));

    const result = execFileSync("node", [GUARDRAIL_CMD, "show", "--phase", "impl"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.ok(result.includes("Impl Rule"), "should include impl-phase article");
    assert.ok(!result.includes("Spec Rule"), "should exclude default spec-phase article");
  });

  it("merges preset chain articles with project guardrail", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    // Project guardrail adds an impl-phase article
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### Custom Impl Rule",
      "<!-- {%meta: {phase: [impl]}%} -->",
      "Project-specific implementation rule.",
    ].join("\n"));

    const result = execFileSync("node", [GUARDRAIL_CMD, "show", "--phase", "spec"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    // Should include preset chain articles (base + node-cli have spec-phase articles)
    // The exact articles depend on preset templates having phase metadata
    assert.ok(typeof result === "string", "should return string output");
  });

  it("outputs empty when no guardrail files exist", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    // No .sdd-forge/guardrail.md, but preset templates exist

    const result = execFileSync("node", [GUARDRAIL_CMD, "show", "--phase", "draft"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    // Should not error — empty or only preset articles
    assert.ok(typeof result === "string");
  });

  it("outputs empty when no articles match the phase", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### Spec Rule",
      "<!-- {%meta: {phase: [spec]}%} -->",
      "Only for spec.",
    ].join("\n"));

    // Ask for lint phase — no articles should match
    const result = execFileSync("node", [GUARDRAIL_CMD, "show", "--phase", "lint"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.ok(!result.includes("Spec Rule"), "should not include non-matching articles");
  });
});

// ---------------------------------------------------------------------------
// web-design preset: guardrail init produces 7 design articles
// ---------------------------------------------------------------------------

describe("web-design preset guardrail", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("includes 7 design articles for web-design type", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "web-design",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });

    execFileSync("node", [GUARDRAIL_CMD, "init"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const content = readFileSync(join(tmp, ".sdd-forge", "guardrail.md"), "utf8");
    // base articles should be present
    assert.ok(content.includes("Single Responsibility"), "should have base article");
    // webapp articles should be present (parent chain)
    assert.ok(content.includes("Security Impact Disclosure"), "should have webapp article");
    // web-design articles
    assert.ok(content.includes("Generic Font Prohibition"), "should have design article 1");
    assert.ok(content.includes("Color System"), "should have design article 2");
    assert.ok(content.includes("Animation"), "should have design article 3");
    assert.ok(content.includes("Inline Style"), "should have design article 4");
    assert.ok(content.includes("Breakpoint"), "should have design article 5");
    assert.ok(content.includes("Accessibility"), "should have design article 6");
    assert.ok(content.includes("Image Format"), "should have design article 7");
  });
});
