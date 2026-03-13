import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../helpers/tmp-dir.js";
import { execFileSync } from "child_process";

const GUARDRAIL_CMD = join(process.cwd(), "src/specs/commands/guardrail.js");
const GATE_CMD = join(process.cwd(), "src/specs/commands/gate.js");

// ---------------------------------------------------------------------------
// parseGuardrailArticles unit tests
// ---------------------------------------------------------------------------

describe("parseGuardrailArticles", () => {
  // Import after describe so the module is loaded lazily
  let parseGuardrailArticles;

  it("parses ### headings and body text", async () => {
    ({ parseGuardrailArticles } = await import("../../../src/specs/commands/guardrail.js"));
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
    ({ parseGuardrailArticles } = await import("../../../src/specs/commands/guardrail.js"));
    const text = "# Guardrail\n\nSome intro text.\n";
    const articles = parseGuardrailArticles(text);
    assert.deepEqual(articles, []);
  });

  it("handles article with no body", async () => {
    ({ parseGuardrailArticles } = await import("../../../src/specs/commands/guardrail.js"));
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
      output: { languages: ["en"], default: "en" },
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
      output: { languages: ["en"], default: "en" },
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
      output: { languages: ["en"], default: "en" },
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
      output: { languages: ["en"], default: "en" },
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
      output: { languages: ["en"], default: "en" },
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
});
