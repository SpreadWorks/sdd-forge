import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../../helpers/tmp-dir.js";

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
});
