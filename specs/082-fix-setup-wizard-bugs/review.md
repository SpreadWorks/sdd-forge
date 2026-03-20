# Code Review Results

### [x] 1. Extract Selection Side Effects Into One Helper
**File:** `src/lib/multi-select.js`
**Issue:** The new default-selection path duplicates the same side effects already present in the interactive toggle path: add the key to `selected`, then optionally walk ancestors. That logic now exists in two places, which makes future changes easy to miss.
**Suggestion:** Introduce a helper such as `selectKey(key)` and call it both when applying defaults and when handling space-bar selection. While doing that, precompute an `itemByKey` map so existence checks and ancestor lookup do not repeatedly scan `items`.

**Verdict:** APPROVED
**Reason:** The duplication is real and meaningful. The default-application path (lines 135-139) and the space-bar toggle path (lines 240-242) both do `selected.add(key)` + conditional `selectAncestors(key)`. A `selectKey(key)` helper eliminates the risk of forgetting `selectAncestors` in one path when behavior changes. The `itemByKey` map precomputation is a minor but sensible optimization given that `selectAncestors` already does `items.find()` recursively up the parent chain. Both changes are behavior-preserving.

### [x] 2. Remove Repeated Config Parsing In Setup
**File:** `src/setup.js`
**Issue:** `config.json` is parsed in multiple places with nearly identical `fs.existsSync` / `JSON.parse` / silent-fallback logic. Adding `name` increases the risk that these paths drift further over time.
**Suggestion:** Extract a small helper like `readConfig(workRoot)` or `readConfigFile(configPath)` and reuse it from both `loadExistingDefaults()` and the write phase. That keeps fallback behavior, parsing, and future schema changes in one place.

**Verdict:** APPROVED
**Reason:** There are two independent config parse sites: `loadExistingDefaults()` (line 76-94) and the write phase (lines 482-484), each with its own `fs.existsSync` / `JSON.parse` / silent-catch pattern. They're close enough to drift apart silently. A `readConfig(workRoot)` helper consolidates fallback behavior and parsing in one place. Low risk, genuine DRY improvement.

### [ ] 3. Normalize “Project Name” Naming Across Layers
**File:** `src/setup.js`
**Issue:** The same concept is represented as `--name`, `cfg.name`, `config.name`, and `settings.projectName`. The extra translation layer adds noise without adding much value.
**Suggestion:** Standardize on one internal name, preferably `name`, and only use “Project name” in UI labels. If keeping `projectName` in wizard state is intentional, isolate the mapping in explicit conversion helpers such as `configToWizardSettings()` and `wizardSettingsToConfig()`.

**Verdict:** REJECTED
**Reason:** The current naming is intentional and appropriate for each layer: `--name` is the CLI flag, `cfg.name` is the config schema field, and `settings.projectName` is the wizard's internal state (which holds many fields — `projectName` disambiguates from other `name`-like concepts in wizard context). The mapping is a single line (`config.name = settings.projectName`). Introducing conversion helpers like `configToWizardSettings()` adds more abstraction than the problem warrants, and forcibly unifying the name across layers would either make config fields confusingly verbose (`projectName` in config.json) or wizard state ambiguous (bare `name`). This is cosmetic at best.

### [ ] 4. Keep Config Schema Definition In One Place
**File:** `src/lib/types.js`
**Issue:** `name` was added to the JSDoc typedef, but runtime validation still has no explicit handling for it. The schema is now split between comments and write-path behavior, which weakens consistency.
**Suggestion:** Either validate `raw.name` as an optional string in `validateConfig()` or move toward a single schema source that drives both validation and type documentation.

**Verdict:** REJECTED
**Reason:** The `name` field is intentionally optional and free-form — it's a display label set by the wizard with no constraints worth validating beyond being a string (which `JSON.stringify` handles naturally). Adding validation for `name` in `validateConfig()` provides no real safety net (what would you reject? an empty string is valid since the default is `""`). The JSDoc typedef documents the field's existence for IDE support, which is its correct role. Adding runtime validation for every optional cosmetic field would bloat `validateConfig()` without catching real errors. The "schema split" concern is theoretical — `name` has no invariants to enforce.
