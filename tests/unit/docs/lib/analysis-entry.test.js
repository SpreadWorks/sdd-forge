import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AnalysisEntry, buildSummary, isEmptyEntry } from "../../../../src/docs/lib/analysis-entry.js";

// ---------------------------------------------------------------------------
// Test subclass
// ---------------------------------------------------------------------------

class ControllerEntry extends AnalysisEntry {
  className = null;
  parentClass = null;
  actions = null;
  components = null;

  static summary = {
    totalActions: { field: "actions", aggregate: "count" },
    totalComponents: { field: "components", aggregate: "count" },
  };
}

class MetricEntry extends AnalysisEntry {
  name = null;
  value = null;

  static summary = {
    totalValue: { field: "value", aggregate: "sum" },
  };
}

// ---------------------------------------------------------------------------
// AnalysisEntry
// ---------------------------------------------------------------------------

describe("AnalysisEntry", () => {
  it("initializes common fields to null", () => {
    const entry = new AnalysisEntry();
    assert.equal(entry.file, null);
    assert.equal(entry.hash, null);
    assert.equal(entry.lines, null);
    assert.equal(entry.mtime, null);
  });

  it("restore() returns instance of the called subclass", () => {
    const plain = {
      file: "app/Controller/FooController.php",
      hash: "abc123",
      lines: 50,
      mtime: "2026-01-01T00:00:00.000Z",
      className: "FooController",
      parentClass: "AppController",
      actions: ["index", "view"],
      components: ["Auth"],
    };
    const restored = ControllerEntry.restore(plain);

    assert.ok(restored instanceof ControllerEntry);
    assert.ok(restored instanceof AnalysisEntry);
    assert.equal(restored.file, "app/Controller/FooController.php");
    assert.equal(restored.className, "FooController");
    assert.deepEqual(restored.actions, ["index", "view"]);
  });

  it("restore() works on base class", () => {
    const plain = { file: "src/a.js", hash: "xyz", lines: 10, mtime: "2026-01-01" };
    const restored = AnalysisEntry.restore(plain);
    assert.ok(restored instanceof AnalysisEntry);
    assert.equal(restored.file, "src/a.js");
  });

  it("restore() copies all properties including unknown ones", () => {
    const plain = { file: "a.js", hash: "h", lines: 1, mtime: "m", summary: "enriched", chapter: "overview" };
    const restored = AnalysisEntry.restore(plain);
    assert.equal(restored.summary, "enriched");
    assert.equal(restored.chapter, "overview");
  });
});

// ---------------------------------------------------------------------------
// isEmptyEntry
// ---------------------------------------------------------------------------

describe("isEmptyEntry", () => {
  it("returns true when all non-common fields are null", () => {
    const entry = new ControllerEntry();
    entry.file = "a.php";
    entry.hash = "abc";
    entry.lines = 10;
    entry.mtime = "2026-01-01";
    assert.equal(isEmptyEntry(entry), true);
  });

  it("returns false when at least one non-common field is set", () => {
    const entry = new ControllerEntry();
    entry.file = "a.php";
    entry.hash = "abc";
    entry.lines = 10;
    entry.mtime = "2026-01-01";
    entry.className = "FooController";
    assert.equal(isEmptyEntry(entry), false);
  });

  it("returns false for non-null array field", () => {
    const entry = new ControllerEntry();
    entry.file = "a.php";
    entry.hash = "abc";
    entry.lines = 10;
    entry.mtime = "2026-01-01";
    entry.actions = ["index"];
    assert.equal(isEmptyEntry(entry), false);
  });

  it("treats 0 and empty string as non-null (not empty)", () => {
    const entry = new MetricEntry();
    entry.file = "a.js";
    entry.hash = "h";
    entry.lines = 1;
    entry.mtime = "m";
    entry.value = 0;
    assert.equal(isEmptyEntry(entry), false);
  });
});

// ---------------------------------------------------------------------------
// buildSummary
// ---------------------------------------------------------------------------

describe("buildSummary", () => {
  it("returns total count for entries", () => {
    const entries = [new ControllerEntry(), new ControllerEntry()];
    const summary = buildSummary(ControllerEntry, entries);
    assert.equal(summary.total, 2);
  });

  it("aggregates array fields with count", () => {
    const e1 = new ControllerEntry();
    e1.actions = ["index", "view", "edit"];
    e1.components = ["Auth"];

    const e2 = new ControllerEntry();
    e2.actions = ["list"];
    e2.components = ["Paginator", "Session"];

    const summary = buildSummary(ControllerEntry, [e1, e2]);
    assert.equal(summary.totalActions, 4);
    assert.equal(summary.totalComponents, 3);
  });

  it("aggregates numeric fields with sum", () => {
    const e1 = new MetricEntry();
    e1.value = 10;
    const e2 = new MetricEntry();
    e2.value = 25;

    const summary = buildSummary(MetricEntry, [e1, e2]);
    assert.equal(summary.totalValue, 35);
  });

  it("handles null fields gracefully in count aggregation", () => {
    const e1 = new ControllerEntry();
    e1.actions = ["index"];
    e1.components = null;

    const e2 = new ControllerEntry();
    e2.actions = null;
    e2.components = ["Auth"];

    const summary = buildSummary(ControllerEntry, [e1, e2]);
    assert.equal(summary.totalActions, 1);
    assert.equal(summary.totalComponents, 1);
  });

  it("handles null fields gracefully in sum aggregation", () => {
    const e1 = new MetricEntry();
    e1.value = 10;
    const e2 = new MetricEntry();
    e2.value = null;

    const summary = buildSummary(MetricEntry, [e1, e2]);
    assert.equal(summary.totalValue, 10);
  });

  it("returns only total when no static summary defined", () => {
    const entries = [new AnalysisEntry(), new AnalysisEntry()];
    const summary = buildSummary(AnalysisEntry, entries);
    assert.equal(summary.total, 2);
    assert.deepEqual(Object.keys(summary), ["total"]);
  });

  it("returns total 0 for empty entries array", () => {
    const summary = buildSummary(ControllerEntry, []);
    assert.equal(summary.total, 0);
    assert.equal(summary.totalActions, 0);
    assert.equal(summary.totalComponents, 0);
  });
});
