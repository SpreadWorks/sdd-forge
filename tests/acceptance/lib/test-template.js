/**
 * tests/acceptance/lib/test-template.js
 *
 * Shared test factory for acceptance tests.
 * Creates a standard test suite for a given preset.
 * Collects pipeline, directive, and quality data into a report JSON.
 */

import { describe, it } from "node:test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { copyFixture, runPipeline, removeTmpDir } from "./pipeline.js";
import {
  assertStructure,
  detectUnfilledDirectives,
  detectExposedDirectives,
} from "./assertions.js";
import { verifyWithAI } from "./ai-verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "..", "fixtures");

/**
 * Write a report JSON file.
 *
 * @param {string} reportPath - Absolute path to report file
 * @param {Object} report - Report data
 */
export function writeReport(reportPath, report) {
  const dir = path.dirname(reportPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

/**
 * Create and run an acceptance test for a preset.
 *
 * @param {string} presetName - Preset name (e.g. "laravel", "webapp")
 * @param {Object} [opts]
 * @param {string} [opts.fixtureFrom] - Use a different fixture as source (for derived presets)
 * @param {Object} [opts.configOverrides] - Config.json overrides (for derived presets)
 */
export function acceptanceTest(presetName, opts) {
  const { fixtureFrom, configOverrides } = opts || {};
  const fixtureDir = path.join(FIXTURES_DIR, fixtureFrom || presetName);

  describe(`acceptance: ${presetName}`, { timeout: 600000 }, () => {
    let tmp;

    it("pipeline completes and passes all checks", async () => {
      // 1. Copy fixture to tmp
      tmp = copyFixture(fixtureDir, configOverrides);

      // 2. Run pipeline
      const { ctx, steps } = await runPipeline(tmp);

      // 3. Structural assertions (also collects directive data)
      const { files } = assertStructure(ctx.docsDir);
      const unfilled = detectUnfilledDirectives(ctx.docsDir, files);
      const exposed = detectExposedDirectives(ctx.docsDir, files);

      if (unfilled.length > 0) {
        console.log(`  [directives] ${unfilled.length} unfilled directive(s):`);
        for (const d of unfilled) {
          console.log(`    ${d.file}:${d.line}`);
        }
      }
      if (exposed.length > 0) {
        console.log(`  [directives] ${exposed.length} exposed directive(s):`);
        for (const d of exposed) {
          console.log(`    ${d.file}:${d.line}`);
        }
      }

      // 4. AI quality verification
      const aiResult = await verifyWithAI(tmp, ctx.config, presetName);

      // 5. Write report
      const report = {
        preset: presetName,
        timestamp: new Date().toISOString(),
        pipeline: { steps },
        directives: { unfilled, exposed },
        quality: aiResult.quality,
      };

      const reportPath = path.join(
        tmp,
        ".sdd-forge",
        "output",
        "acceptance-report.json",
      );
      writeReport(reportPath, report);
      console.log(`  [report] written to ${reportPath}`);
    });

    // Cleanup is done in a separate block to ensure it runs
    it("cleanup", () => {
      if (tmp) {
        removeTmpDir(tmp);
        tmp = null;
      }
    });
  });
}
