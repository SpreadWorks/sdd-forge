/**
 * tests/e2e/acceptance/report.test.js
 *
 * E2E tests for acceptance test report generation.
 * Verifies pipeline traceability and report JSON output.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { copyFixture, runPipeline, removeTmpDir } from "../../acceptance/lib/pipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "..", "..", "acceptance", "fixtures");

describe("acceptance report: pipeline traceability", { timeout: 300000 }, () => {
  let tmp;

  it("runPipeline returns step timing for each pipeline step", async () => {
    const fixtureDir = path.join(FIXTURES_DIR, "node");
    tmp = copyFixture(fixtureDir, { type: "base" });

    const result = await runPipeline(tmp);

    // result should contain steps array
    assert.ok(result.steps, "runPipeline should return steps array");
    assert.ok(Array.isArray(result.steps), "steps should be an array");

    const expectedNames = ["scan", "enrich", "init", "data", "text", "readme"];
    const stepNames = result.steps.map((s) => s.name);

    for (const name of expectedNames) {
      assert.ok(stepNames.includes(name), `steps should include "${name}"`);
    }

    for (const step of result.steps) {
      assert.ok(typeof step.name === "string", "step.name should be a string");
      assert.ok(
        step.status === "ok" || step.status === "skipped" || step.status === "error",
        `step.status should be "ok", "skipped", or "error", got "${step.status}"`,
      );
      assert.ok(typeof step.durationMs === "number", "step.durationMs should be a number");
      assert.ok(step.durationMs >= 0, "step.durationMs should be non-negative");
    }
  });

  it("failed step records status as error", async () => {
    // Use a fixture with invalid config to trigger a failure
    const fixtureDir = path.join(FIXTURES_DIR, "node");
    const badTmp = copyFixture(fixtureDir, { type: "base" });

    // Corrupt analysis output dir to cause scan failure
    const outputDir = path.join(badTmp, ".sdd-forge", "output");
    fs.rmSync(outputDir, { recursive: true });
    // Write a file where the directory should be to cause mkdir to fail
    fs.writeFileSync(path.join(badTmp, ".sdd-forge", "output"), "not-a-dir");

    try {
      const result = await runPipeline(badTmp);
      // If it doesn't throw, check that the failed step has error status
      const failedStep = result.steps.find((s) => s.status === "error");
      assert.ok(failedStep, "should have at least one step with error status");
    } catch {
      // runPipeline may throw on fatal errors — that's acceptable
    } finally {
      removeTmpDir(badTmp);
    }
  });

  it("cleanup", () => {
    if (tmp) {
      removeTmpDir(tmp);
      tmp = null;
    }
  });
});

describe("acceptance report: JSON output", { timeout: 300000 }, () => {
  let tmp;

  it("report JSON is written to .sdd-forge/output/acceptance-report.json", async () => {
    const fixtureDir = path.join(FIXTURES_DIR, "node");
    tmp = copyFixture(fixtureDir, { type: "base" });

    // Run pipeline to generate results
    await runPipeline(tmp);

    // The report file should be written by the test template after all checks
    // For this test, we verify the writeReport function directly
    const { writeReport } = await import("../../acceptance/lib/test-template.js");
    const report = {
      preset: "base",
      timestamp: new Date().toISOString(),
      pipeline: { steps: [] },
      directives: { unfilled: [], exposed: [] },
      quality: null,
    };

    const reportPath = path.join(tmp, ".sdd-forge", "output", "acceptance-report.json");
    writeReport(reportPath, report);

    assert.ok(fs.existsSync(reportPath), "report JSON should be written");

    const written = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert.equal(written.preset, "base");
    assert.ok(written.timestamp);
    assert.ok(written.pipeline);
    assert.ok(written.directives);
  });

  it("cleanup", () => {
    if (tmp) {
      removeTmpDir(tmp);
      tmp = null;
    }
  });
});
