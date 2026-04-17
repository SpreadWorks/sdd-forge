import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { createTmpDir, removeTmpDir, writeJson } from "../../helpers/tmp-dir.js";
import { saveFinalizedAt } from "../../../src/lib/flow-state.js";

describe("flow finalize — state.finalizedAt write (R1)", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("R1: saveFinalizedAt writes state.finalizedAt in ISO 8601 UTC", () => {
    tmp = createTmpDir("sdd-finalize-write-");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "base",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeJson(tmp, "specs/001-alpha/flow.json", {
      spec: "specs/001-alpha/spec.md",
      runId: "test-run",
      metrics: {},
    });

    const iso = "2026-04-17T10:30:00.000Z";
    saveFinalizedAt(tmp, "001-alpha", iso);

    const saved = JSON.parse(
      readFileSync(join(tmp, "specs/001-alpha/flow.json"), "utf8"),
    );
    assert.ok(saved.state, "state object should be created");
    assert.equal(saved.state.finalizedAt, iso);
  });

  it("R1: ISO 8601 UTC format is enforced (Z suffix)", () => {
    tmp = createTmpDir("sdd-finalize-format-");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "base",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeJson(tmp, "specs/001-alpha/flow.json", {
      spec: "specs/001-alpha/spec.md",
      runId: "test-run",
    });

    assert.throws(
      () => saveFinalizedAt(tmp, "001-alpha", "2026-04-17 10:30:00"),
      /ISO 8601|UTC/i,
      "non-ISO 8601 format should be rejected",
    );
  });
});
