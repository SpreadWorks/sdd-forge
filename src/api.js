/**
 * src/api.js — sdd-forge public API entry point
 *
 * Re-exports the base classes needed by external presets and
 * .sdd-forge/data/ DataSource overrides.
 *
 * Usage (from external preset files):
 *   import { DataSource, Scannable, AnalysisEntry } from 'sdd-forge/api';
 */
export { DataSource } from "./docs/lib/data-source.js";
export { Scannable } from "./docs/lib/scan-source.js";
export { AnalysisEntry } from "./docs/lib/analysis-entry.js";
