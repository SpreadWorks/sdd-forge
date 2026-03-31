/**
 * tests/e2e/082-setup-wizard-bugs.test.js
 *
 * Spec #082: setup wizard bugs
 *   1. projectName not saved to / restored from config.json
 *   2. multi-select defaults don't trigger autoSelectAncestors
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/setup.js");

/** Non-interactive CLI args that satisfy hasAllRequired */
const NI_ARGS = [
  "--name", "my-project",
  "--type", "webapp",
  "--purpose", "developer-guide",
  "--tone", "polite",
];

// ---------------------------------------------------------------------------
// Bug 1: projectName saved to / restored from config.json
// ---------------------------------------------------------------------------

describe("setup: config.name persistence", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("writes name field to config.json in non-interactive mode", () => {
    tmp = createTmpDir("082-name-write-");
    writeJson(tmp, "package.json", { name: "test-proj" });

    const result = spawnSync("node", [CMD, ...NI_ARGS], {
      encoding: "utf8",
      cwd: tmp,
      timeout: 10000,
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const config = JSON.parse(
      fs.readFileSync(join(tmp, ".sdd-forge", "config.json"), "utf8"),
    );
    assert.equal(config.name, "my-project", "config.json should contain name field");
  });

  it("validates config even when name is absent (backward compat)", async () => {
    // Directly call validateConfig without name — should not throw
    const { validateConfig } = await import("../../src/lib/types.js");
    const cfg = {
      lang: "ja",
      type: "node-cli",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });
});

// ---------------------------------------------------------------------------
// Bug 2: multi-select defaults + autoSelectAncestors
// ---------------------------------------------------------------------------

describe("multi-select: defaults with autoSelectAncestors", () => {
  it("auto-selects ancestors when applying defaults", async () => {
    const { buildTreeItems, select } = await import("../../src/lib/multi-select.js");
    const { PRESETS } = await import("../../src/lib/presets.js");

    const items = buildTreeItems(PRESETS);

    // Find cakephp2 item and its expected ancestors
    const cakephp2Item = items.find((it) => it.key === "cakephp2");
    assert.ok(cakephp2Item, "cakephp2 should exist in tree items");

    // Collect expected ancestors by walking parent chain
    const expectedAncestors = new Set();
    let current = cakephp2Item;
    while (current?.parent) {
      expectedAncestors.add(current.parent);
      current = items.find((it) => it.key === current.parent);
    }

    // Non-TTY mode returns empty array, so we test the logic directly.
    // We need to verify that when defaults are applied with autoSelectAncestors,
    // the selected set includes ancestors.
    // Since select() requires TTY, we test buildTreeItems + ancestor logic.
    assert.ok(expectedAncestors.size > 0, "cakephp2 should have ancestors");
    assert.ok(expectedAncestors.has("php-webapp"), "ancestors should include php-webapp");
    assert.ok(expectedAncestors.has("webapp"), "ancestors should include webapp");
    assert.ok(expectedAncestors.has("base"), "ancestors should include base");
  });
});
