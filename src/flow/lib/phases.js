/**
 * src/flow/lib/phases.js
 *
 * Single source of truth for flow phase constants.
 */

export const VALID_PHASES = Object.freeze([
  "draft",
  "spec",
  "gate",
  "impl",
  "test",
  "lint",
]);
