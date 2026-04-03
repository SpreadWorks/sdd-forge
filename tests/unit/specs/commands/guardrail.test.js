import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../../helpers/tmp-dir.js";
import { execFileSync } from "child_process";
import { setupFlow } from "../../../helpers/flow-setup.js";

const SDD_FORGE = join(process.cwd(), "src/sdd-forge.js");

// Dynamically import gate functions for unit tests
const { buildGuardrailPrompt, parseGuardrailResponse } = await import(
  "../../../../src/flow/lib/run-gate.js"
);

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

  it("warns when guardrail.json is absent", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { stdio: "ignore" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { stdio: "ignore" });
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en", type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, "spec.md", validSpec);

    const result = execFileSync("node", [
      SDD_FORGE, "flow", "run", "gate",
      "--spec", join(tmp, "spec.md"),
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    // Gate should still pass — JSON envelope with ok: true
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
  });

  it("passes with guardrail.json present (no agent = skip AI check with warn)", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { stdio: "ignore" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { stdio: "ignore" });
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    writeFile(tmp, "spec.md", validSpec);
    writeJson(tmp, ".sdd-forge/guardrail.json", {
      guardrails: [
        {
          id: "no-external-deps",
          title: "No External Dependencies",
          body: "Use only Node.js built-in modules.",
          meta: { phase: ["spec"] },
        },
      ],
    });

    const result = execFileSync("node", [
      SDD_FORGE, "flow", "run", "gate",
      "--spec", join(tmp, "spec.md"),
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
  });

  it("skips AI check with --skip-guardrail", () => {
    tmp = createTmpDir();
    execFileSync("git", ["init", tmp], { stdio: "ignore" });
    execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { stdio: "ignore" });
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type: "node-cli",
      docs: { languages: ["en"], defaultLanguage: "en" },
      agent: { default: "claude", providers: { claude: { command: "echo", args: ["FAIL"] } } },
    });
    writeFile(tmp, "spec.md", validSpec);
    writeJson(tmp, ".sdd-forge/guardrail.json", {
      guardrails: [
        {
          id: "rule",
          title: "Rule",
          body: "Some rule.",
          meta: { phase: ["spec"] },
        },
      ],
    });

    // With --skip-guardrail, gate should pass even though agent would return FAIL
    const result = execFileSync("node", [
      SDD_FORGE, "flow", "run", "gate",
      "--spec", join(tmp, "spec.md"),
      "--skip-guardrail",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });

    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
  });
});

// ---------------------------------------------------------------------------
// buildGuardrailPrompt / parseGuardrailResponse unit tests
// ---------------------------------------------------------------------------

describe("buildGuardrailPrompt", () => {
  it("includes all guardrails and spec text", () => {
    const guardrails = [
      { title: "Rule A", body: "Description A", meta: { phase: ["spec"] } },
      { title: "Rule B", body: "Description B", meta: { phase: ["spec"] } },
    ];
    const prompt = buildGuardrailPrompt("spec content here", guardrails);
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
    const r1 = parseGuardrailResponse("PASS: Rule \u2013 reason with en-dash");
    assert.equal(r1.length, 1);
    const r2 = parseGuardrailResponse("FAIL: Rule - reason with hyphen");
    assert.equal(r2.length, 1);
    assert.equal(r2[0].passed, false);
  });
});

// ---------------------------------------------------------------------------
// buildGuardrailPrompt includes all guardrails (no exemption filtering)
// ---------------------------------------------------------------------------

describe("buildGuardrailPrompt ignores exemption sections", () => {
  const guardrails = [
    { title: "Rule A", body: "Description A", meta: { phase: ["spec"] } },
    { title: "Rule B", body: "Description B", meta: { phase: ["spec"] } },
    { title: "Rule C", body: "Description C", meta: { phase: ["spec"] } },
  ];

  it("includes all spec-phase guardrails even with exemptions section in spec", () => {
    const spec = "## Guardrail Exemptions\n- Rule B \u2014 reason\n\n## Requirements\n- R1\n";
    const prompt = buildGuardrailPrompt(spec, guardrails);
    assert.ok(prompt.includes("Rule A"));
    assert.ok(prompt.includes("Rule B"), "Rule B should NOT be filtered out");
    assert.ok(prompt.includes("Rule C"));
    assert.ok(!prompt.includes("Exempted Articles"), "should not have Exempted Articles section");
  });

  it("includes inapplicable-PASS instruction", () => {
    const prompt = buildGuardrailPrompt("## Requirements\n- R1\n", guardrails);
    assert.ok(prompt.includes("inapplicable"), "should include inapplicable instruction");
  });
});
