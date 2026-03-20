# Code Review Results

### [ ] 1. Use More Specific Block Names
**File:** `src/presets/api/templates/en/api_overview.md`
**Issue:** The new block name `description` is very generic compared with adjacent block names like `versioning` and `auth-flow`. If block identifiers are referenced by tooling or merged across templates, a generic name increases ambiguity and makes intent less clear.
**Suggestion:** Rename the block to something section-specific, such as `api-description` in `api_overview.md` and `authentication-description` in `authentication.md`, and apply the same naming rule in both `en` and `ja` templates.

**Verdict:** REJECTED
**Reason:** `description` is already a **standard block name used 44 times across the codebase**. It is the established convention for intro sections in all presets (base, webapp, laravel, symfony, cakephp2, etc.). Block names are scoped per-file (stored in a `Map` within `parseBlocks()`), so there is no cross-file ambiguity. Renaming to `api-description` / `authentication-description` would **break the template inheritance convention** — child presets override parent blocks by matching names, and `description` is the canonical name that the merge chain expects.

### [ ] 2. Standardize Blocking Strategy Across Localized Templates
**File:** `src/presets/api/templates/ja/api_overview.md`
**Issue:** The same structural change was applied manually in four files, which creates duplication and raises the risk that future edits will update one locale or document but miss the others.
**Suggestion:** Define a single convention for block-wrapped section scaffolding and generate or share that structure where possible, so `en` and `ja` templates stay aligned without repeating the same markup change manually.

**Verdict:** REJECTED
**Reason:** The `en` and `ja` templates are intentionally separate files with locale-specific `{{text}}` prompts — they are not generated from a shared source and the project has no template-generation infrastructure for this. The four files changed are small, and the change is mechanical (adding two comment lines each). Introducing a code-generation layer to avoid duplicating two HTML comments across locale pairs would be over-engineering. The existing pattern of manually maintaining `en`/`ja` template pairs is consistent across all 128+ template files in the project.

### [x] 3. Avoid Partial Adoption of Section Blocks
**File:** `src/presets/api/templates/en/authentication.md`
**Issue:** Only the `Description` section is wrapped with `@block` markers, while neighboring sections already use more specific block names. This creates an inconsistent template pattern and makes the purpose of the new wrapper look ad hoc.
**Suggestion:** Either apply the same block-wrapping rule consistently to all editable sections in these templates, or document why `Description` is the only section that needs this metadata.

**Verdict:** APPROVED
**Reason:** The `Description` section was the only unwrapped block in these files, while adjacent sections (`versioning`, `auth-flow`) were already wrapped. This diff completes the coverage, making the template structure consistent. The `template-merger.js` merge logic operates on blocks — an unwrapped section falls into preamble/postamble and cannot be independently overridden by child presets. Wrapping it enables the same override capability that other sections already have. This is a genuine functional improvement, not cosmetic.

### [ ] 4. Remove the Markup If It Has No Consumer
**File:** `src/presets/api/templates/ja/authentication.md`
**Issue:** `<!-- @block: ... -->` and `<!-- @endblock -->` are only valuable if they are actually consumed by the preset/template processing pipeline. Otherwise they are dead metadata that adds noise without changing behavior.
**Suggestion:** Verify that the block comments are used by the parser or merge logic. If they are not, remove them and keep the original simpler template structure.

**Verdict:** REJECTED
**Reason:** The premise is factually wrong. `@block` / `@endblock` markers **are actively consumed** by `directive-parser.js` (`parseBlocks()` at lines 402–462) and `template-merger.js` (`mergeTexts()`, `addTexts()`). They are the core mechanism for template inheritance — child presets override parent blocks by name, and `stripBlockDirectives()` removes them from final output. Removing these markers would break the template merge pipeline for any preset that extends `api`.
