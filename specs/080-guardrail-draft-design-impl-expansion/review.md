# Code Review Results

### [x] 1. ### Preserve Guardrail Metadata During Preset Merge
**File:** `src/spec/commands/guardrail.js`
**Issue:** `loadGuardrailTemplate()` reparses non-`base` preset articles and rebuilds them as `### title\nbody`, which drops the newly added `meta` directives. As a result, phase-specific rules from presets like `node-cli`, `webapp`, `laravel`, etc. silently fall back to the default `spec` phase.
**Suggestion:** Stop converting parsed articles back into markdown strings. Merge article objects directly, or add a shared serializer that preserves all metadata fields when reconstructing markdown.

2. ### Fix “Project Overrides Preset” Behavior
**File:** `src/spec/commands/guardrail.js`
**Issue:** `loadMergedArticles()` says “project overrides preset”, but the implementation only appends project articles whose titles do not already exist. Duplicate titles are skipped, so preset articles actually win.
**Suggestion:** Replace the preset article when a project article has the same normalized title, or use a `Map` keyed by normalized title so later layers naturally override earlier ones.

3. ### Unify Lint With the New Guardrail Loading Pipeline
**File:** `src/spec/commands/lint.js`
**Issue:** `gate.js` and `guardrail show` now use `loadMergedArticles()`, but `lint.js` still reads only `.sdd-forge/guardrail.md`. That makes the design inconsistent and means preset-level `lint` articles will never be enforced.
**Suggestion:** Switch `lint.js` to use the same merged article loader as the other commands, then filter for `phase: ["lint"]`. This removes duplicate loading logic and keeps command behavior consistent.

4. ### Extract Guardrail Context Resolution
**File:** `src/spec/commands/guardrail.js`
**Issue:** The logic for resolving `lang` and `type` from config is duplicated in `loadMergedArticles()` and `runInit()`. The same fallback rules are now maintained in multiple places.
**Suggestion:** Extract a small helper such as `resolveGuardrailContext(root)` that returns `{ lang, presetKey }`. Reuse it in both code paths to reduce duplication and keep fallback behavior aligned.

5. ### Remove Unused Imports
**File:** `src/spec/commands/guardrail.js`
**Issue:** `sddConfigPath`, `PRESETS_DIR`, and `presetByLeaf` are imported but not used. This is dead code and makes the module look more coupled than it is.
**Suggestion:** Delete the unused imports to tighten the module surface and make the actual dependencies clearer.

**Verdict:** APPROVED
**Reason:** This is a real bug. `appendArticlesFrom()` at line 194 serializes non-base articles as `` `### ${a.title}\n${a.body}` ``, stripping the `<!-- {%meta%} -->` directive. When `loadMergedArticles()` later calls `parseGuardrailArticles()` on the merged string, non-base articles will have no meta and silently fall back to `DEFAULT_META` (`phase: ["spec"]`). This means preset-specific guardrail articles with `phase: [impl]` only (e.g., node-cli's "No Synchronous I/O in Hot Paths") will never appear for `--phase impl` via `guardrail show`. The fix — merging article objects directly or preserving meta during serialization — is correct and necessary.
