/**
 * tests/unit/lib/082-multi-select-defaults.test.js
 *
 * Spec #082: multi-select defaults should trigger autoSelectAncestors.
 *
 * select() requires TTY, so we test the ancestor selection logic by
 * verifying that buildTreeItems produces correct parent references
 * and simulating the default + selectAncestors path.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTreeItems } from "../../../src/lib/multi-select.js";

// Minimal preset tree for testing
const TEST_PRESETS = [
  { key: "base", parent: null, label: "Base" },
  { key: "webapp", parent: "base", label: "Web Application" },
  { key: "php-webapp", parent: "webapp", label: "PHP Web App" },
  { key: "cakephp2", parent: "php-webapp", label: "CakePHP 2" },
  { key: "laravel", parent: "php-webapp", label: "Laravel" },
  { key: "cli", parent: "base", label: "CLI" },
];

/**
 * Replicate the selectAncestors logic from multi-select.js
 */
function selectAncestors(items, selected, key) {
  const item = items.find((it) => it.key === key);
  if (item?.parent) {
    selected.add(item.parent);
    selectAncestors(items, selected, item.parent);
  }
}

describe("multi-select: default + autoSelectAncestors logic", () => {
  it("selectAncestors adds all ancestors for a leaf preset", () => {
    const items = buildTreeItems(TEST_PRESETS);
    const selected = new Set(["cakephp2"]);

    selectAncestors(items, selected, "cakephp2");

    assert.ok(selected.has("cakephp2"), "leaf should remain selected");
    assert.ok(selected.has("php-webapp"), "parent should be selected");
    assert.ok(selected.has("webapp"), "grandparent should be selected");
    assert.ok(selected.has("base"), "root should be selected");
  });

  it("applying defaults without selectAncestors leaves ancestors unselected (current bug)", () => {
    const items = buildTreeItems(TEST_PRESETS);
    // Simulate current buggy behavior: just add defaults to selected set
    const selected = new Set();
    const defaults = ["cakephp2"];
    for (const d of defaults) {
      if (items.some((it) => it.key === d)) selected.add(d);
    }
    // Bug: ancestors are NOT selected
    assert.ok(!selected.has("php-webapp"), "without fix, parent is not auto-selected");
    assert.ok(!selected.has("webapp"), "without fix, grandparent is not auto-selected");
  });

  it("applying defaults WITH selectAncestors selects full ancestor chain (expected fix)", () => {
    const items = buildTreeItems(TEST_PRESETS);
    const selected = new Set();
    const defaults = ["cakephp2"];
    for (const d of defaults) {
      if (items.some((it) => it.key === d)) {
        selected.add(d);
        selectAncestors(items, selected, d);
      }
    }
    assert.ok(selected.has("cakephp2"), "leaf should be selected");
    assert.ok(selected.has("php-webapp"), "parent should be selected");
    assert.ok(selected.has("webapp"), "grandparent should be selected");
    assert.ok(selected.has("base"), "root should be selected");
  });

  it("multiple defaults each get their ancestors selected", () => {
    const items = buildTreeItems(TEST_PRESETS);
    const selected = new Set();
    const defaults = ["cakephp2", "cli"];
    for (const d of defaults) {
      if (items.some((it) => it.key === d)) {
        selected.add(d);
        selectAncestors(items, selected, d);
      }
    }
    // cakephp2 chain
    assert.ok(selected.has("cakephp2"));
    assert.ok(selected.has("php-webapp"));
    assert.ok(selected.has("webapp"));
    // cli chain
    assert.ok(selected.has("cli"));
    // shared ancestor
    assert.ok(selected.has("base"));
  });

  it("buildTreeItems preserves parent references correctly", () => {
    const items = buildTreeItems(TEST_PRESETS);
    const cakephp2 = items.find((it) => it.key === "cakephp2");
    assert.equal(cakephp2.parent, "php-webapp");
    const phpWebapp = items.find((it) => it.key === "php-webapp");
    assert.equal(phpWebapp.parent, "webapp");
    const webapp = items.find((it) => it.key === "webapp");
    assert.equal(webapp.parent, "base");
    const base = items.find((it) => it.key === "base");
    assert.equal(base.parent, null);
  });
});
