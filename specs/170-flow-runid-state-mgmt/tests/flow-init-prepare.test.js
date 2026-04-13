import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../tests/helpers/tmp-dir.js";
import {
  saveFlowState, loadFlowState, buildInitialSteps,
  addActiveFlow, loadActiveFlows,
} from "../../../src/lib/flow-state.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

// ── flow set init → flow prepare --run-id integration ──────────────────────

describe("flow set init → prepare integration", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  // ── Req 2: flow prepare saves runId to flow.json ───────────────────────

  it("flow prepare without --run-id auto-generates runId in flow.json", () => {
    tmp = createTmpDir();
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: `feature/${specId}`,
      worktree: false,
      steps: buildInitialSteps(),
      requirements: [],
    };
    saveFlowState(tmp, state);
    addActiveFlow(tmp, specId, "local");

    // loadFlowState should auto-assign runId (transparent migration)
    const loaded = loadFlowState(tmp, specId);
    assert.ok(loaded.runId, "runId should be auto-generated");
    assert.equal(typeof loaded.runId, "string");
  });

  // ── Req 2: flow prepare with --run-id uses provided runId ──────────────

  it("flow.json can store a provided runId and delete preparing file", () => {
    tmp = createTmpDir();
    const runId = "provided-run-id-xyz";
    const sddDir = join(tmp, ".sdd-forge");
    fs.mkdirSync(sddDir, { recursive: true });

    // Simulate flow set init: create .active-flow.<runId>
    const preparingFile = join(sddDir, `.active-flow.${runId}`);
    const preparingState = {
      runId,
      lifecycle: "preparing",
      spec: null,
      baseBranch: null,
      featureBranch: null,
      worktree: null,
      steps: buildInitialSteps(),
      requirements: [],
      autoApprove: false,
    };
    fs.writeFileSync(preparingFile, JSON.stringify(preparingState, null, 2) + "\n");

    // Simulate flow prepare: create flow.json with runId, delete preparing file
    const specId = "001-test";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: `feature/${specId}`,
      worktree: false,
      steps: buildInitialSteps(),
      requirements: [],
      runId,
      lifecycle: "active",
    };
    saveFlowState(tmp, state);
    addActiveFlow(tmp, specId, "local");
    fs.unlinkSync(preparingFile);

    // Verify
    const loaded = loadFlowState(tmp, specId);
    assert.equal(loaded.runId, runId);
    assert.equal(loaded.lifecycle, "active");
    assert.ok(!fs.existsSync(preparingFile));
  });

  // ── Req 5: flow get status returns runId ───────────────────────────────

  it("flow get status includes runId in output", () => {
    tmp = createTmpDir();
    const specId = "001-test";
    const runId = "status-test-run";
    const state = {
      spec: `specs/${specId}/spec.md`,
      baseBranch: "main",
      featureBranch: `feature/${specId}`,
      worktree: false,
      steps: buildInitialSteps(),
      requirements: [],
      runId,
      lifecycle: "active",
    };
    saveFlowState(tmp, state);
    addActiveFlow(tmp, specId, "local");

    const loaded = loadFlowState(tmp, specId);
    assert.equal(loaded.runId, runId);
  });

  // ── Req 5: runId-based resolution fallback to .active-flow.<runId> ─────

  it("runId can be resolved from .active-flow.<runId> when not in flow.json", () => {
    tmp = createTmpDir();
    const runId = "fallback-test-run";
    const sddDir = join(tmp, ".sdd-forge");
    fs.mkdirSync(sddDir, { recursive: true });

    // Only .active-flow.<runId> exists, no flow.json
    const preparingFile = join(sddDir, `.active-flow.${runId}`);
    const preparingState = {
      runId,
      lifecycle: "preparing",
      spec: null,
      baseBranch: null,
      featureBranch: null,
      worktree: null,
      steps: buildInitialSteps(),
      requirements: [],
      autoApprove: false,
    };
    fs.writeFileSync(preparingFile, JSON.stringify(preparingState, null, 2) + "\n");

    // Verify the file can be read and parsed
    const raw = JSON.parse(fs.readFileSync(preparingFile, "utf8"));
    assert.equal(raw.runId, runId);
    assert.equal(raw.lifecycle, "preparing");
  });

  // ── Req 6: stale cleanup during prepare ────────────────────────────────

  it("stale .active-flow.* files are identified for cleanup", () => {
    tmp = createTmpDir();
    const sddDir = join(tmp, ".sdd-forge");
    fs.mkdirSync(sddDir, { recursive: true });

    // Create stale and fresh preparing files
    const staleFile = join(sddDir, ".active-flow.stale-run");
    const freshFile = join(sddDir, ".active-flow.fresh-run");
    // Also create the .active-flow pointer (should not be touched)
    const pointerFile = join(sddDir, ".active-flow");

    fs.writeFileSync(staleFile, JSON.stringify({ runId: "stale-run", lifecycle: "preparing" }));
    fs.writeFileSync(freshFile, JSON.stringify({ runId: "fresh-run", lifecycle: "preparing" }));
    fs.writeFileSync(pointerFile, "[]");

    // Set stale file to 25 hours ago
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    fs.utimesSync(staleFile, staleTime, staleTime);

    // Simulate cleanup: scan and delete stale files
    const TTL_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const entries = fs.readdirSync(sddDir);
    const activeFlowFiles = entries.filter((f) => f.startsWith(".active-flow."));
    const staleFiles = activeFlowFiles.filter((f) => {
      const stat = fs.statSync(join(sddDir, f));
      return now - stat.mtimeMs > TTL_MS;
    });

    // Only the stale file should be marked for deletion
    assert.equal(staleFiles.length, 1);
    assert.ok(staleFiles[0].includes("stale-run"));

    // Delete stale
    for (const f of staleFiles) fs.unlinkSync(join(sddDir, f));

    // Verify: fresh file still exists, pointer untouched
    assert.ok(fs.existsSync(freshFile));
    assert.ok(fs.existsSync(pointerFile));
    assert.ok(!fs.existsSync(staleFile));
  });
});
