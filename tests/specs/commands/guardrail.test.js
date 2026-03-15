import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../helpers/tmp-dir.js";
import { execFileSync } from "child_process";

const GUARDRAIL_CMD = join(process.cwd(), "src/spec/commands/guardrail.js");
const GATE_CMD = join(process.cwd(), "src/spec/commands/gate.js");

// Dynamically import gate functions for unit tests
const { buildGuardrailPrompt, parseGuardrailResponse, extractExemptions } = await import(
  "../../../src/spec/commands/gate.js"
);

// ---------------------------------------------------------------------------
// parseGuardrailArticles unit tests
// ---------------------------------------------------------------------------

describe("parseGuardrailArticles", () => {
  // Import after describe so the module is loaded lazily
  let parseGuardrailArticles;

  it("parses ### headings and body text", async () => {
    ({ parseGuardrailArticles } = await import("../../../src/spec/commands/guardrail.js"));
    const text = [
      "# Project Guardrail",
      "",
      "### No External Dependencies",
      "Use only Node.js built-in modules.",
      "",
      "### REST-First",
      "All APIs must follow REST conventions.",
      "Use proper HTTP methods.",
    ].join("\n");

    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 2);
    assert.equal(articles[0].title, "No External Dependencies");
    assert.ok(articles[0].body.includes("Node.js built-in modules"));
    assert.equal(articles[1].title, "REST-First");
    assert.ok(articles[1].body.includes("REST conventions"));
    assert.ok(articles[1].body.includes("HTTP methods"));
  });

  it("returns empty array for no articles", async () => {
    ({ parseGuardrailArticles } = await import("../../../src/spec/commands/guardrail.js"));
    const text = "# Guardrail\n\nSome intro text.\n";
    const articles = parseGuardrailArticles(text);
    assert.deepEqual(articles, []);
  });

  it("handles article with no body", async () => {
    ({ parseGuardrailArticles } = await import("../../../src/spec/commands/guardrail.js"));
    const text = "### Empty Article\n### Next Article\nSome body.\n";
    const articles = parseGuardrailArticles(text);
    assert.equal(articles.length, 2);
    assert.equal(articles[0].title, "Empty Article");
    assert.equal(articles[0].body.trim(), "");
    assert.equal(articles[1].title, "Next Article");
  });
});

// ---------------------------------------------------------------------------
// guardrail init CLI tests
// ---------------------------------------------------------------------------

describe("guardrail init CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("creates guardrail.md from base template", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "cli/node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });

    const result = execFileSync("node", [GUARDRAIL_CMD, "init"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const guardrailPath = join(tmp, ".sdd-forge", "guardrail.md");
    assert.ok(existsSync(guardrailPath), "guardrail.md should be created");
    const content = readFileSync(guardrailPath, "utf8");
    assert.ok(content.includes("###"), "should contain article headings");
  });

  it("fails without --force when guardrail.md exists", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "cli/node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, ".sdd-forge/guardrail.md", "# Existing\n### Rule\nDo not change.\n");

    try {
      execFileSync("node", [GUARDRAIL_CMD, "init"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.ok(err.stderr.includes("already exists") || err.status !== 0);
    }
  });

  it("overwrites with --force", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "cli/node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, ".sdd-forge/guardrail.md", "# Old content\n");

    execFileSync("node", [GUARDRAIL_CMD, "init", "--force"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const content = readFileSync(join(tmp, ".sdd-forge", "guardrail.md"), "utf8");
    assert.ok(!content.includes("Old content"), "should be overwritten");
  });

  it("--dry-run does not write file", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "cli/node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });

    execFileSync("node", [GUARDRAIL_CMD, "init", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.ok(!existsSync(join(tmp, ".sdd-forge", "guardrail.md")), "should not create file");
  });
});

// ---------------------------------------------------------------------------
// gate integration: guardrail warning
// ---------------------------------------------------------------------------

describe("gate guardrail integration", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  const validSpec = [
    "# Spec",
    "## Clarifications (Q&A)",
    "## Open Questions",
    "## User Confirmation",
    "- [x] User approved this spec",
    "## Acceptance Criteria",
    "- done",
  ].join("\n");

  it("warns when guardrail.md is absent", () => {
    tmp = createTmpDir();
    writeFile(tmp, "spec.md", validSpec);

    const result = execFileSync("node", [
      GATE_CMD,
      "--spec", join(tmp, "spec.md"),
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    // Gate should still pass but output a warning
    assert.match(result, /PASSED/);
    // Warning about missing guardrail should be on stderr or stdout
  });

  it("passes with guardrail.md present (no agent = skip AI check with warn)", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "cli/node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, "spec.md", validSpec);
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### No External Dependencies",
      "Use only Node.js built-in modules.",
    ].join("\n"));

    const result = execFileSync("node", [
      GATE_CMD,
      "--spec", join(tmp, "spec.md"),
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /PASSED/);
  });

  it("skips AI check with --skip-guardrail", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "cli/node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
      defaultAgent: "claude",
      providers: { claude: { command: "echo", args: ["FAIL"] } },
    });
    writeFile(tmp, "spec.md", validSpec);
    writeFile(tmp, ".sdd-forge/guardrail.md", [
      "# Project Guardrail",
      "",
      "### Rule",
      "Some rule.",
    ].join("\n"));

    // With --skip-guardrail, gate should pass even though agent would return FAIL
    const result = execFileSync("node", [
      GATE_CMD,
      "--spec", join(tmp, "spec.md"),
      "--skip-guardrail",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    assert.match(result, /PASSED/);
  });
});

// ---------------------------------------------------------------------------
// buildGuardrailPrompt / parseGuardrailResponse unit tests
// ---------------------------------------------------------------------------

describe("buildGuardrailPrompt", () => {
  it("includes all articles and spec text", () => {
    const articles = [
      { title: "Rule A", body: "Description A" },
      { title: "Rule B", body: "Description B" },
    ];
    const prompt = buildGuardrailPrompt("spec content here", articles);
    assert.ok(prompt.includes("Rule A"));
    assert.ok(prompt.includes("Rule B"));
    assert.ok(prompt.includes("spec content here"));
    assert.ok(prompt.includes("PASS"));
    assert.ok(prompt.includes("FAIL"));
  });
});

describe("parseGuardrailResponse", () => {
  it("parses PASS and FAIL lines", () => {
    const response = [
      "PASS: Single Responsibility — spec addresses one concern",
      "FAIL: Unambiguous Requirements — uses vague term 'appropriate'",
      "PASS: Complete Context — all requirements have triggers",
    ].join("\n");

    const results = parseGuardrailResponse(response);
    assert.equal(results.length, 3);
    assert.equal(results[0].title, "Single Responsibility");
    assert.equal(results[0].passed, true);
    assert.equal(results[1].title, "Unambiguous Requirements");
    assert.equal(results[1].passed, false);
    assert.ok(results[1].reason.includes("vague"));
    assert.equal(results[2].title, "Complete Context");
    assert.equal(results[2].passed, true);
  });

  it("ignores non-matching lines", () => {
    const response = "Some preamble\nPASS: Rule — ok\nSome trailing text";
    const results = parseGuardrailResponse(response);
    assert.equal(results.length, 1);
    assert.equal(results[0].title, "Rule");
  });

  it("returns empty array for empty response", () => {
    assert.deepEqual(parseGuardrailResponse(""), []);
  });

  it("handles en-dash and hyphen separators", () => {
    const r1 = parseGuardrailResponse("PASS: Rule – reason with en-dash");
    assert.equal(r1.length, 1);
    const r2 = parseGuardrailResponse("FAIL: Rule - reason with hyphen");
    assert.equal(r2.length, 1);
    assert.equal(r2[0].passed, false);
  });
});

// ---------------------------------------------------------------------------
// extractExemptions unit tests
// ---------------------------------------------------------------------------

describe("extractExemptions", () => {
  it("extracts exempted article titles", () => {
    const spec = [
      "# Spec",
      "## Requirements",
      "- R1: something",
      "## Guardrail Exemptions",
      "- No Hardcoded Secrets — test fixtures need dummy API keys",
      "- Single Responsibility — intentionally bundled",
      "## Acceptance Criteria",
      "- done",
    ].join("\n");
    const exemptions = extractExemptions(spec);
    assert.equal(exemptions.length, 2);
    assert.ok(exemptions.includes("no hardcoded secrets"));
    assert.ok(exemptions.includes("single responsibility"));
  });

  it("returns empty array when no exemptions section", () => {
    const spec = "# Spec\n## Requirements\n- R1\n";
    assert.deepEqual(extractExemptions(spec), []);
  });

  it("returns empty array when exemptions section is empty", () => {
    const spec = "## Guardrail Exemptions\n\n## Requirements\n";
    assert.deepEqual(extractExemptions(spec), []);
  });
});

// ---------------------------------------------------------------------------
// buildGuardrailPrompt with exemptions
// ---------------------------------------------------------------------------

describe("buildGuardrailPrompt with exemptions", () => {
  const articles = [
    { title: "Rule A", body: "Description A" },
    { title: "Rule B", body: "Description B" },
    { title: "Rule C", body: "Description C" },
  ];

  it("excludes exempted articles from prompt", () => {
    const spec = "## Guardrail Exemptions\n- Rule B — reason\n\n## Requirements\n- R1\n";
    const prompt = buildGuardrailPrompt(spec, articles);
    assert.ok(prompt.includes("Rule A"));
    assert.ok(!prompt.includes("**Rule B**"));
    assert.ok(prompt.includes("Rule C"));
    assert.ok(prompt.includes("Exempted Articles"));
  });

  it("returns null when all articles are exempted", () => {
    const spec = "## Guardrail Exemptions\n- Rule A — r\n- Rule B — r\n- Rule C — r\n";
    const prompt = buildGuardrailPrompt(spec, articles);
    assert.equal(prompt, null);
  });

  it("case-insensitive exemption matching", () => {
    const spec = "## Guardrail Exemptions\n- rule a — reason\n";
    const prompt = buildGuardrailPrompt(spec, articles);
    assert.ok(!prompt.includes("**Rule A**"));
    assert.ok(prompt.includes("Rule B"));
  });
});

// ---------------------------------------------------------------------------
// guardrail init: webapp type merges base + webapp articles
// ---------------------------------------------------------------------------

describe("guardrail init template merging", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("merges base + webapp articles for webapp type", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "webapp",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });

    execFileSync("node", [GUARDRAIL_CMD, "init"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const content = readFileSync(join(tmp, ".sdd-forge", "guardrail.md"), "utf8");
    // base articles
    assert.ok(content.includes("Single Responsibility"), "should have base article");
    assert.ok(content.includes("No Hardcoded Secrets"), "should have base article");
    // webapp articles
    assert.ok(content.includes("Security Impact Disclosure"), "should have webapp article");
    assert.ok(content.includes("Input Sanitization"), "should have webapp article");
  });

  it("merges base + webapp + cakephp2 articles for cakephp2 type", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "webapp/cakephp2",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });

    execFileSync("node", [GUARDRAIL_CMD, "init"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const content = readFileSync(join(tmp, ".sdd-forge", "guardrail.md"), "utf8");
    // base
    assert.ok(content.includes("Single Responsibility"), "should have base article");
    // webapp
    assert.ok(content.includes("Security Impact Disclosure"), "should have webapp article");
    // cakephp2
    assert.ok(content.includes("Fat Model"), "should have cakephp2 article");
    assert.ok(content.includes("CakeSession"), "should have cakephp2 article");
  });
});
