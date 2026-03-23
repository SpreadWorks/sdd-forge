# Code Review Results

### [x] 1. Restore a Single Test Runner
**File:** `package.json`
**Issue:** `test`, `test:unit`, and `test:e2e` now duplicate shell-based discovery logic with three separate `find | xargs node --test` pipelines. This regresses the previous single entry point, makes option handling inconsistent, and spreads test-selection behavior across multiple scripts.
**Suggestion:** Reintroduce a shared Node runner (for example `tests/run.js`) and make all three scripts thin wrappers around it. That removes duplication, keeps preset/scope filtering in one place, and avoids shell-specific behavior.

**Verdict:** APPROVED
**Reason:** The diff confirms `tests/run.js` was deleted and replaced with three `find | xargs node --test` pipelines in `package.json`. The deleted `run.js` had proper `--preset` filtering, `--scope` support, preset name validation, and cross-platform directory walking. The replacement shell pipelines lose all of this: no `--preset` support, no `src/presets/*/tests/` discovery, and `xargs` with zero matches can invoke `node --test` with no files on some platforms, causing spurious errors. This is a genuine regression in functionality, not cosmetic.

### [x] 2. Keep Scan Logic Out of the DataSource
**File:** `src/presets/hono/data/middleware.js`
**Issue:** Middleware parsing was moved from `scan/middleware.js` into the data source class. That breaks the established preset pattern of `scan/` producing analysis data and `data/` consuming it, and it also duplicates result-object construction across two regex loops inside the same method.
**Suggestion:** Move the parsing back into a dedicated `scan/middleware.js` module and keep `HonoMiddlewareSource` as a thin adapter. If the inline approach is kept, at least extract a small helper for deduped `middleware.push(...)` creation.

**Verdict:** APPROVED
**Reason:** The diff shows `src/presets/hono/scan/middleware.js` was deleted and its parsing logic was inlined into `HonoMiddlewareSource.scan()` in `data/middleware.js`. The class also changed from extending `WebappDataSource` to `Scannable(DataSource)`, losing the `deriveSourceRoot` pattern. This breaks the established preset convention visible across laravel, symfony, and cakephp2 presets where `scan/` modules contain parsing logic and `data/` modules consume analysis results. Additionally, the inlined version dropped `createMiddleware()` detection (Pattern 3 from the original), which is a behavioral regression — custom middleware definitions will no longer be found.

### [ ] 3. Replace Repeated Binding Extraction With a Table-Driven Parser
**File:** `src/presets/workers/data/bindings.js`
**Issue:** The method repeats the same “read list from config -> map fields -> push normalized binding” pattern for KV, R2, D1, services, and durable objects. That makes the parser longer than necessary and harder to extend consistently.
**Suggestion:** Define a small descriptor table such as `{ key, type, nameField, idField }[]` and iterate over it to build `bindings`. This keeps the method focused on orchestration and makes new binding types a one-line addition.

**Verdict:** REJECTED
**Reason:** While the repetition in `bindings.js` is real, the binding types have genuinely different field mappings (`binding` vs `name` for Durable Objects, `id` vs `bucket_name` vs `database_id` vs `service` vs `class_name`). A table-driven approach would need enough special-case handling (especially for `durable_objects.bindings` nested path) that the abstraction wouldn't meaningfully reduce complexity. The current explicit loops are readable and each binding type is only ~3 lines. This is a premature abstraction with only 5 cases and divergent field semantics.

### [x] 4. Extract Shared Flow Test Setup Helpers
**File:** `tests/e2e/flow/commands/cleanup.test.js`
**Issue:** `makeState`/`setupFlow` helpers are now repeated across multiple flow command test files (`cleanup`, `merge`, `merge-pr`, `status-check`, etc.). This is duplicate setup code with the same conventions for `saveFlowState` and `addActiveFlow`.
**Suggestion:** Move these helpers into a shared test utility such as `tests/helpers/flow-state.js` and reuse them across the flow command suites. That will reduce maintenance cost when flow-state setup changes again.

**Verdict:** APPROVED
**Reason:** The diff shows identical `makeState`/`setupFlow` helper patterns duplicated across `cleanup.test.js`, `merge.test.js`, `merge-pr.test.js`, `status-check.test.js`, and `resume.test.js`. Each has the same `makeState(overrides)` returning `{ spec, baseBranch, featureBranch, steps, ...overrides }` and `setupFlow(tmp, overrides)` calling `saveFlowState` + `addActiveFlow`. When the flow state format changes again (as it just did in this diff — migrating from `.sdd-forge/flow.json` to `specs/NNN/flow.json` with `.active-flow` pointers), every test file must be updated in lockstep. Extracting to a shared helper reduces this maintenance burden with zero behavioral risk.
