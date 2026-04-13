/**
 * src/lib/constants.js
 *
 * Single source of truth for all enum constants used across the codebase.
 */

// ---------------------------------------------------------------------------
// Flow phases (used by metrics, guardrails, review routing)
// ---------------------------------------------------------------------------

export const VALID_PHASES = Object.freeze([
  "draft",
  "spec",
  "gate",
  "impl",
  "test",
  "lint",
  "review",
]);

// ---------------------------------------------------------------------------
// Flow step statuses
// ---------------------------------------------------------------------------

export const VALID_STEP_STATUSES = Object.freeze([
  "pending",
  "in_progress",
  "done",
  "skipped",
]);

// ---------------------------------------------------------------------------
// Gate phases (subset used by run-gate)
// ---------------------------------------------------------------------------

export const VALID_GATE_PHASES = Object.freeze([
  "draft",
  "pre",
  "post",
  "impl",
]);

// ---------------------------------------------------------------------------
// Metric counters
// ---------------------------------------------------------------------------

export const VALID_METRIC_COUNTERS = Object.freeze([
  "question",
  "docsRead",
  "srcRead",
]);

// ---------------------------------------------------------------------------
// Check targets
// ---------------------------------------------------------------------------

export const VALID_CHECK_TARGETS = Object.freeze([
  "impl",
  "finalize",
  "dirty",
  "gh",
]);

// ---------------------------------------------------------------------------
// Review phases
// ---------------------------------------------------------------------------

export const VALID_REVIEW_PHASES = Object.freeze([
  "test",
  "spec",
]);

// ---------------------------------------------------------------------------
// Impl-confirm modes
// ---------------------------------------------------------------------------

export const VALID_IMPL_CONFIRM_MODES = Object.freeze([
  "overview",
  "detail",
]);

// ---------------------------------------------------------------------------
// Merge strategies (finalize)
// ---------------------------------------------------------------------------

export const VALID_MERGE_STRATEGIES = Object.freeze([
  "squash",
  "pr",
]);

// ---------------------------------------------------------------------------
// Auto-approve values
// ---------------------------------------------------------------------------

export const VALID_AUTO_VALUES = Object.freeze([
  "on",
  "off",
]);

// ---------------------------------------------------------------------------
// Requirement statuses
// ---------------------------------------------------------------------------

export const VALID_REQ_STATUSES = Object.freeze([
  "pending",
  "in_progress",
  "done",
  "skipped",
]);
