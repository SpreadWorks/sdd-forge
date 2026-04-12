import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../helpers/tmp-dir.js";

const SDD_FORGE = join(process.cwd(), "src/sdd-forge.js");

describe("metrics token command", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupProject() {
    tmp = createTmpDir("sdd-metrics-token-");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "base",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeJson(tmp, "specs/001-alpha/flow.json", {
      metrics: {
        draft: {
          tokens: { input: 100, output: 50, cacheRead: 20, cacheCreation: 10 },
          cost: 0.01,
          callCount: 2,
        },
      },
    });
  }

  function setupProjectWithDifficultyData() {
    tmp = createTmpDir("sdd-metrics-token-diff-");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "base",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeFile(tmp, "specs/001-alpha/spec.md", "# Spec\n\nA".repeat(200));
    writeFile(tmp, "specs/001-alpha/review.md", [
      "# Code Review Results",
      "",
      "### [x] 1. first",
      "### [ ] 2. second",
    ].join("\n"));
    writeFile(tmp, "specs/001-alpha/tests/a.test.js", "export {};\n");
    writeJson(tmp, "specs/001-alpha/issue-log.json", {
      entries: [{ step: "draft", reason: "r1" }],
    });
    writeJson(tmp, "specs/001-alpha/flow.json", {
      request: "metrics difficulty test request",
      summary: [{ desc: "r1" }, { desc: "r2" }],
      reviewCount: { spec: 2, test: 0, impl: 0 },
      redoCount: 1,
      metrics: {
        draft: {
          question: 1,
          tokens: { input: 100, output: 50, cacheRead: 20, cacheCreation: 10 },
          cost: 0.01,
          callCount: 2,
        },
      },
    });
  }

  it("supports json format and returns aggregated rows", () => {
    setupProject();
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token", "--format", "json"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    const parsed = JSON.parse(out);
    assert.ok(Array.isArray(parsed.rows), "json output should include rows array");
    assert.ok(parsed.rows.length >= 1, "rows should not be empty");
  });

  it("uses text format by default and prints phase sections", () => {
    setupProject();
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    assert.match(out, /PHASE\s+draft/i);
    assert.match(out, /difficulty/i);
    assert.match(out, /call count/i);
  });

  it("supports csv format with expected headers", () => {
    setupProject();
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token", "--format", "csv"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    assert.match(
      out,
      /date,phase,difficulty,tokenInput,tokenOutput,cacheRead,cacheCreate,callCount,cost/i
    );
  });

  it("computes numeric difficulty when required fields exist", () => {
    setupProjectWithDifficultyData();
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token", "--format", "json"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    const parsed = JSON.parse(out);
    const row = parsed.rows.find((r) => r.phase === "draft");
    assert.ok(row, "draft row should exist");
    assert.equal(typeof row.difficulty, "number");
    assert.ok(row.difficulty > 0, "difficulty should be positive");
  });

  it("returns N/A difficulty when reviewCount/redoCount are missing", () => {
    setupProject();
    writeFile(tmp, "specs/001-alpha/spec.md", "# Spec");
    writeFile(tmp, "specs/001-alpha/review.md", "### [x] 1. one");
    writeJson(tmp, "specs/001-alpha/issue-log.json", { entries: [] });
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token", "--format", "csv"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    const lines = out.trim().split("\n");
    assert.ok(lines.length >= 2, "csv must include at least one data row");
    const cols = lines[1].split(",");
    assert.equal(cols[2], "N/A");
  });

  it("treats missing qaCount/testCount/issueLogEntries as zero for calculation", () => {
    tmp = createTmpDir("sdd-metrics-token-zeroable-");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "base",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeFile(tmp, "specs/001-alpha/spec.md", "# Spec\n\nB".repeat(150));
    writeJson(tmp, "specs/001-alpha/flow.json", {
      request: "request for zero-fill fields",
      summary: [{ desc: "r1" }],
      reviewCount: { spec: 1, test: 0, impl: 0 },
      redoCount: 1,
      metrics: {
        draft: {
          tokens: { input: 10, output: 5, cacheRead: 2, cacheCreation: 1 },
          cost: 0.001,
          callCount: 1,
        },
      },
    });
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token", "--format", "json"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    const parsed = JSON.parse(out);
    const row = parsed.rows.find((r) => r.phase === "draft");
    assert.ok(row);
    assert.equal(typeof row.difficulty, "number");
    assert.ok(row.difficulty > 0);
  });

  it("returns N/A when requestChars resolves to zero", () => {
    tmp = createTmpDir("sdd-metrics-token-reqzero-");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "base",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeFile(tmp, "specs/001-alpha/spec.md", "# Spec");
    writeJson(tmp, "specs/001-alpha/flow.json", {
      request: "",
      summary: [{ desc: "r1" }],
      reviewCount: { spec: 1, test: 0, impl: 0 },
      redoCount: 1,
      metrics: {
        draft: {
          question: 1,
          tokens: { input: 10, output: 5, cacheRead: 2, cacheCreation: 1 },
          cost: 0.001,
          callCount: 1,
        },
      },
    });
    const out = execFileSync("node", [SDD_FORGE, "metrics", "token", "--format", "csv"], {
      encoding: "utf8",
      env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      cwd: tmp,
    });
    const lines = out.trim().split("\n");
    const cols = lines[1].split(",");
    assert.equal(cols[2], "N/A");
  });
});
