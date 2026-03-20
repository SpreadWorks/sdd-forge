# Code Review Results

### [x] 1. Extract Shared Chapter Metadata Parsing
**File:** `src/docs/data/docs.js`
**Issue:** `chapters()` and `nav()` both read chapter files and derive titles independently. They already use slightly different rules (`chapters()` prefers `# 01.` first, `nav()` uses the first `# ` only), which creates duplicate logic and a drift risk in displayed chapter names.
**Suggestion:** Introduce a shared helper such as `_readChapterMeta(filePath, fileName)` or `_extractChapterTitle(lines, fileName)` and use it from both `chapters()` and `nav()`. If numbered headings should be treated specially, encode that once in the helper.

**Verdict:** APPROVED
**Reason:** The drift risk is real and already present. `chapters()` (line 182) uses `find(l => /^# \d{2}\./)` with fallback to `find(l => /^# /)`, while the new `_extractTitle()` (line 282) uses only `find(l => /^# /)`. These will produce different titles for chapters with numbered headings (e.g., `# 01. Overview`). Extracting a shared helper eliminates this actual inconsistency and reduces code duplication.

### [x] 2. Centralize File-Context Injection for Data Resolvers
**File:** `src/docs/commands/data.js`
**Issue:** `wrappedResolveFn` now has multiple hard-coded branches for `lang.links`, `docs.langSwitcher`, and `docs.nav`, all injecting the current file path in slightly different ways. This is repetitive and makes every new file-aware resolver require another ad hoc condition.
**Suggestion:** Move this into a small helper or dispatch table, for example `injectResolverContext({ source, method, labels, fileRelPath })`, or pass a structured context object to resolvers. That keeps the resolver interface more consistent and reduces branching in `main()`.

**Verdict:** APPROVED
**Reason:** `wrappedResolveFn` in `data.js` now has three special-case branches (`lang.links`, `docs.langSwitcher`, `docs.nav`) that each inject file path context in ad hoc ways. This pattern will grow with every new file-aware resolver. A dispatch table or structured context object would reduce branching and make the resolver contract more consistent. Low risk, genuine improvement.

### [x] 3. Remove Duplicate Block-Syntax Parsing Between Parser and Merger
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `parseBlocks()` now preserves nested `@block` markers as raw lines, and `template-merger.js` reparses those markers with its own `NESTED_BLOCK_START` / `NESTED_BLOCK_END` regexes. That duplicates syntax knowledge across two modules and makes future directive changes easy to miss in one place.
**Suggestion:** Parse nested blocks into a structured tree once in `parseBlocks()` and let the merger consume that structure directly. As a smaller step, export and reuse the block directive regex/constants from `directive-parser.js` instead of redefining them in `template-merger.js`.

**Verdict:** APPROVED
**Reason:** `directive-parser.js` defines `BLOCK_START_RE` / `BLOCK_END_RE` (line 59-60) and `template-merger.js` redefines identical patterns as `NESTED_BLOCK_START` / `NESTED_BLOCK_END` (line 550-551). This is duplicated syntax knowledge. The smaller step—exporting and reusing the constants from `directive-parser.js`—is low risk and directly addresses a real maintenance concern. The full tree-based approach is more invasive and should be evaluated separately.

### [x] 4. Unify “Special Markdown Files” Rules
**File:** `src/docs/lib/template-merger.js`
**Issue:** The new `layout.md` exclusion was added to `SPECIAL_FILES` in template discovery, but chapter discovery in `src/docs/lib/command-context.js` still maintains a separate exclusion list with different contents. This is an inconsistency in the “non-chapter markdown” rule set.
**Suggestion:** Extract a shared constant/helper for excluded template-only files and reuse it in both template discovery and chapter discovery. That keeps the design consistent as more infrastructure files are introduced.

**Verdict:** APPROVED
**Reason:** `template-merger.js` SPECIAL_FILES = `{"README.md", "AGENTS.sdd.md", "layout.md"}` while `command-context.js` EXCLUDE = `{"README.md", "AGENTS.sdd.md"}` (line 138). The sets are already divergent—`layout.md` is excluded from template discovery but not from chapter discovery. If a `layout.md` file exists in `docs/`, `getChapterFiles()` will include it as a chapter, which is incorrect. This is a latent bug, not just cosmetic. Extracting a shared constant fixes a real inconsistency.
