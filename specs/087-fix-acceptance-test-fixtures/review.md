# Code Review Results

### [x] 1. Framework-Agnostic Command Summary
**File:** `src/presets/webapp/data/commands.js`
**Issue:** The shared `commands` scanner still summarizes commands with `withMain`, which is a CakePHP-style entrypoint concept. For Laravel and Symfony, that metric is misleading because their command entrypoints are not `main()`.
**Suggestion:** Replace `withMain` with a framework-agnostic field such as `entrypointCount`, or let each preset override the summary logic. If the metric is not broadly useful, remove it entirely from the shared webapp source.

**Verdict:** APPROVED
**Reason:** The `withMain` field is genuinely CakePHP-specific (`main()` as entrypoint) and misleading for Laravel/Symfony where commands use `handle()` or `execute()`. The diff shows `withMain` was preserved in the shared `webapp/data/commands.js` and even surfaced in `agents.js` (`${sh.withMain || 0} with main()`). This is a real semantic mismatch that will produce incorrect/meaningless documentation for non-CakePHP presets. Replacing it with a framework-agnostic metric or letting presets override the summary logic is a sound improvement.

### [x] 2. Remove Boilerplate Command Sources
**File:** `src/presets/laravel/data/commands.js`
**Issue:** This class and `src/presets/symfony/data/commands.js` are nearly identical and differ only by the path-matching rule. That duplication makes future behavior changes easy to miss in one preset.
**Suggestion:** Extract a small shared helper or base class that accepts a path predicate/pattern, then keep only the framework-specific matcher configuration in each preset.

**Verdict:** APPROVED
**Reason:** The diff confirms this: the refactored `laravel/data/commands.js` and `symfony/data/commands.js` are now structurally identical — both extend `CommandsSource`, override only `match()`, and differ solely in the path predicate (`app/Console/Commands/` vs `src/Command/`). Extracting a shared helper that accepts a path pattern would eliminate this duplication without behavioral risk. The current diff already did the hard part (unifying on `CommandsSource`); this proposal is the natural next step.

### [x] 3. Finish the Terminology Rename
**File:** `src/presets/cakephp2/scan/commands-detail.js`
**Issue:** The rename from `shells` to `commands` is incomplete. The file header still says “shells”, and local names like `shellDir` keep the old term even though the exported API is now `analyzeCommandDetails`.
**Suggestion:** Rename internal identifiers and comments to `commandDir` / `commandFiles` for consistency, and add one explicit comment that CakePHP still uses `*Shell.php` filenames so readers understand why the file matcher remains shell-based.

**Verdict:** APPROVED
**Reason:** The diff renamed the file from `shells-detail.js` to `commands-detail.js` and the export from `analyzeShellDetails` to `analyzeCommandDetails`, but left internal variables like `shellDir` and the old header comment. This is a genuine consistency issue — half-renamed code is harder to maintain than either the old or new naming. The suggestion to add a comment explaining why the file matcher still uses `*Shell.php` is valuable for preventing future confusion.

### [ ] 4. Rename Residual Shell-Centric Test Artifacts
**File:** `src/presets/cakephp2/tests/unit/analyzers-views-shells.test.js`
**Issue:** The test file name still says `shells` even though its subject under review is now `commands-detail.js`. This leaves dead terminology in the tree and makes test intent harder to scan.
**Suggestion:** Rename the test file to match the new domain language, for example `analyzers-views-commands.test.js`, so filenames, imports, and describe blocks stay aligned.

**Verdict:** REJECTED
**Reason:** The test file covers multiple subjects (`views.js`, `commands-detail.js`, `testing.js`, `notifications.js`), so renaming it from `analyzers-views-shells.test.js` to `analyzers-views-commands.test.js` only partially fixes the name mismatch — it would still not reflect `testing.js` or `notifications.js`. This is a cosmetic-only change with no quality improvement; the file would still have an inaccurate name regardless. If the file is to be renamed, it should be split or given a truly accurate name, which is a larger refactor.

### [ ] 5. Clean Up Legacy Variable Names
**File:** `src/docs/data/agents.js`
**Issue:** The implementation now reads `analysis.commands?.summary`, but the local variable is still named `sh`. That preserves shell-era naming in code that has already been conceptually renamed.
**Suggestion:** Rename `sh` to `commandsSummary` or `cmd` and update the related conditionals. The same cleanup is worth applying in other touched files where `s`/`sh` still refer to commands.

**Verdict:** REJECTED
**Reason:** In `agents.js`, `sh` is a single-letter abbreviation used alongside `ctrl`, `mdl`, and `rt` — a consistent local naming convention for summary variables in that block. Renaming only `sh` to `commandsSummary` while leaving `ctrl`/`mdl`/`rt` as-is would break the local consistency. The variable is scoped to ~15 lines and its meaning is clear from the assignment (`analysis.commands?.summary`). This is cosmetic and risks inconsistency with the surrounding code style.
