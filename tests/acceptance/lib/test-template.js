/**
 * tests/acceptance/lib/test-template.js
 *
 * Shared test factory for acceptance tests.
 * Creates a standard test suite for a given preset.
 */

import { describe, it } from "node:test";
import path from "path";
import { fileURLToPath } from "url";
import { copyFixture, runPipeline, removeTmpDir } from "./pipeline.js";
import { assertStructure } from "./assertions.js";
import { verifyWithAI } from "./ai-verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "..", "fixtures");

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
      const { ctx } = await runPipeline(tmp);

      // 3. Structural assertions
      assertStructure(ctx.docsDir);

      // 4. AI quality verification
      await verifyWithAI(tmp, ctx.config, presetName);
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
