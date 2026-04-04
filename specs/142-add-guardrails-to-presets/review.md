# Code Review Results

### [x] 1. Re-centralize agent timeout resolution
**File:** `src/lib/agent.js`
**Issue:** The change removes `resolveAgent(...).timeoutMs` and pushes timeout conversion/defaulting back into multiple callers (`agents.js`, `enrich.js`, `forge.js`, `readme.js`, `text.js`, `translate.js`, `run-review.js`). That reintroduces duplicate code, inconsistent behavior, and hardcoded values.
**Suggestion:** Restore `timeoutMs` in `resolveAgent()`, let `callAgent()` / `callAgentAsync()` default to `agent.timeoutMs`, and remove per-command timeout conversion and `300000` literals from callers.

**Verdict:** APPROVED
**Reason:** The diff reverts a previously centralized `timeoutMs` field from `resolveAgent()` and pushes timeout conversion back into 7 callers. `enrich.js` now does `config.agent?.timeout ? Number(config.agent.timeout) * 1000 : DEFAULT_AGENT_TIMEOUT_MS`, `forge.js` does the same inline conversion, `text.js` reintroduces a `configTimeout` local variable with the same pattern, while `readme.js`, `translate.js`, and `agents.js` fall back to using `DEFAULT_AGENT_TIMEOUT_MS` directly (ignoring config entirely). `run-review.js` re-hardcodes `300000`. This is a genuine DRY regression with inconsistent behavior: some callers respect config, others don't. The project's CLAUDE.md mandates extracting shared patterns at 2+ occurrences.

### [x] 2. Restore the shared Laravel controller parser
**File:** `src/presets/laravel/data/controllers.js`
**Issue:** `parse()` and `parseControllerScan()` now duplicate the same regex parsing for class name, actions, constructor DI, and middleware. The DI skip list is also duplicated with two different forms (`Set` vs array).
**Suggestion:** Reintroduce a private helper like `parseControllerContent(content)` and a single `SKIP_DI_TYPES` constant, then have both `parse()` and `parseControllerScan()` consume that result.

**Verdict:** APPROVED
**Reason:** `parse()` and `parseControllerScan()` now duplicate the same regex-based extraction for class name, actions, constructor DI, and middleware. The DI skip list is inconsistent: `parse()` uses a `Set`, `parseControllerScan()` uses an array with `.includes()`. If the skip list or any regex changes in one function, the other will silently drift. Extracting a shared `parseControllerContent(content)` eliminates both the duplication and the `Set` vs array inconsistency.

### [x] 3. Restore the shared Laravel model parser
**File:** `src/presets/laravel/data/models.js`
**Issue:** `parse()` and `parseModelScan()` now duplicate the same Eloquent model parsing logic for class metadata, table resolution, fillable/guarded/casts/hidden, relations, scopes, and accessors.
**Suggestion:** Bring back a private helper such as `parseModelContent(content)` that returns the raw parsed shape, and reuse it from both entry points to keep the model parser consistent.

**Verdict:** APPROVED
**Reason:** `parse()` and `parseModelScan()` duplicate identical extraction logic for class metadata, table resolution, fillable/guarded/casts/hidden, relations, scopes, and accessors — roughly 50+ lines of near-identical regex parsing. Both already share helper functions (`extractArrayProp`, `extractRelations`, etc.) but duplicate the orchestration that calls them. A shared `parseModelContent(content)` would eliminate this duplication while the helpers remain shared.

### [x] 4. Restore the shared Symfony controller parser
**File:** `src/presets/symfony/data/controllers.js`
**Issue:** `parse()` and `parseControllerFile()` repeat the same parsing flow for class info, route prefix extraction, route-bearing actions, and constructor DI. This increases drift risk if route or DI parsing changes later.
**Suggestion:** Extract a single parser helper for controller content and reuse it from both methods, keeping only file-path-specific wrapping in the callers.

**Verdict:** APPROVED
**Reason:** `parse()` and `parseControllerFile()` duplicate the same parsing flow: class match, route prefix extraction, `findMethodsWithAttributes()` iteration with nested route regex parsing, and constructor DI extraction with the same type skip list. The route regex alone is complex enough (`#\[Route\s*\(\s*['"]([^'"]*)['"]\s*(?:,...`) that having two copies creates meaningful drift risk if Symfony attribute parsing needs adjustment.

### [x] 5. Restore the shared Symfony entity parser
**File:** `src/presets/symfony/data/entities.js`
**Issue:** `parse()` and `parseEntityFile()` now duplicate entity parsing for Doctrine markers, class name, table name, repository class, columns, and relations.
**Suggestion:** Reintroduce a private `parseEntityContent(content)` helper and use it from both code paths so entity metadata extraction has one source of truth.

**Verdict:** APPROVED
**Reason:** `parse()` and `parseEntityFile()` duplicate Doctrine marker detection, class name extraction, table name extraction, repository class extraction, and calls to `extractColumns()` and `extractRelations()`. While the actual column/relation extraction is already in shared helpers, the orchestration and fallback logic (e.g., `camelToSnake` for table name) is duplicated. A shared parser eliminates the risk of one path diverging from the other.

### [x] 6. Restore the shared CakePHP model parser
**File:** `src/presets/cakephp2/data/models.js`
**Issue:** `parse()` and `analyzeModels()` now duplicate the same model parsing logic for class metadata, relation extraction, validation fields, behaviors, and table inference. This is a direct regression from the previous extracted helper.
**Suggestion:** Bring back a private helper like `parseModelContent(src)` and let both `parse()` and `analyzeModels()` build their outputs from that shared parsed object.

**Verdict:** APPROVED
**Reason:** `parse()` (lines 48-85) and `analyzeModels()` (lines 212-262) duplicate the same class match regex, `extractStringProperty` calls for 4 properties, relation loop over `RELATION_TYPES`, validate extraction, actsAs extraction, and table name inference. This is the most extensive duplication of the five files (~50 lines each). A shared `parseModelContent(src)` returning the raw parsed object would eliminate this and keep both code paths consistent.
