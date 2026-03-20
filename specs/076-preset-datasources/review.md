# Code Review Results

### [x] 1. Centralize Localized Column Schemas
**File:** `src/presets/cli/templates/en/commands.md`
**Issue:** The new `{{data: ...("...|...")}}` calls duplicate the same datasource invocation across `en` and `ja` templates, with only the column labels changing. That repetition now exists in many presets and makes header changes expensive and error-prone.
**Suggestion:** Move column definitions into the datasource layer or locale resources so templates can call `cli.commands.list()` (and similar) without embedding header strings. That removes duplicate template code and keeps localization concerns in one place.

**Verdict:** APPROVED
**Reason:** The diff clearly shows every datasource call duplicated across `en` and `ja` templates with only column labels differing (e.g., `"Command|Description"` vs `"コマンド|説明"`). This is a real maintenance burden — adding a column or renaming one requires synchronized edits in every locale. Moving column labels into locale resources or the datasource layer eliminates a genuine source of drift and is consistent with the project's design philosophy of keeping localization concerns centralized.

### [x] 2. Normalize Datasource Naming Conventions
**File:** `src/presets/nextjs/templates/en/components.md`
**Issue:** Datasource names are inconsistent and sometimes redundant, for example `nextjs.nextjs-components.*`, `workers.workers-bindings.*`, and `api.api-overview.roles`. The pattern mixes preset name, document name, and domain concept inconsistently, which makes the API harder to predict.
**Suggestion:** Adopt one naming convention such as `<preset>.<domain>.<operation>`, for example `nextjs.components.server`, `workers.bindings.list`, `workers.runtime.constraints`, `api.authentication.roles`. That improves discoverability and keeps design patterns consistent across presets.

**Verdict:** APPROVED
**Reason:** The diff confirms the inconsistency: `nextjs.nextjs-components.server` redundantly embeds the preset name, while `nextjs.routes.app` uses a clean `<preset>.<domain>.<operation>` pattern. Similarly `workers.workers-bindings.*` vs `rest.endpoints.list`. Since these are new datasource names being introduced in this very diff, now is the cheapest time to normalize them before they become entrenched API contracts. This improves predictability for preset authors.

### [x] 3. Avoid Cross-Document Coupling in API Auth Templates
**File:** `src/presets/api/templates/en/authentication.md`
**Issue:** The authorization section now depends on `api.api-overview.roles(...)`, which ties an authentication template to an `api-overview` datasource namespace. The name no longer reflects the template’s responsibility and creates a misleading dependency.
**Suggestion:** Expose a datasource that matches the document intent, such as `api.authentication.roles(...)` or `api.auth.roles(...)`. Keep each template bound to a domain-specific datasource rather than borrowing from a differently named document area.

**Verdict:** APPROVED
**Reason:** The diff shows `authentication.md` calling `api.api-overview.roles(...)` — a datasource namespaced under `api-overview` being consumed by a different document (`authentication`). This creates a misleading dependency: the template's domain is auth, but it reaches into an overview namespace. Introducing `api.authentication.roles` or similar aligns the datasource with its consumer and avoids coupling documents that should be independently maintainable. This is a concrete correctness concern, not cosmetic.

### [ ] 4. Extract Shared Edge Runtime/Table Contracts
**File:** `src/presets/workers/templates/en/edge_runtime.md`
**Issue:** Several presets now define nearly identical table contracts for adjacent concepts, such as `edge.edge-runtime.*` and `workers.workers-bindings.entryPoints/constraints`. This duplicates structural conventions and increases the chance of schema drift between related presets.
**Suggestion:** Introduce a shared datasource contract or shared base preset for common runtime sections, then let specialized presets extend or override only the provider-specific parts. That simplifies maintenance and keeps structurally similar docs aligned.

**Verdict:** REJECTED
**Reason:** While the observation about structural similarity between `edge.edge-runtime.*` and `workers.workers-bindings.entryPoints/constraints` is valid, these are different presets serving different platforms with different semantics. The `workers` datasource already bundles entry points and constraints under `workers-bindings` (which is itself a naming issue from Proposal #2), not a separate runtime datasource. Prematurely abstracting a shared base for these creates coupling between presets that may diverge as platform-specific features evolve. The duplication is superficial (similar column shapes), not structural. The risk of over-abstraction outweighs the maintenance benefit at this scale.

### [ ] 5. Keep Presentation Details Out of Templates
**File:** `src/presets/rest/templates/en/endpoints.md`
**Issue:** Templates now encode table layout details directly in the datasource call, for example `"Method|Path|Description"`. This mixes content selection with presentation and leaves many templates carrying boilerplate formatting arguments.
**Suggestion:** Let the datasource return a canonical table shape by default and reserve explicit column overrides for exceptional cases. That makes templates smaller, reduces duplication, and keeps formatting logic in one place.

**Verdict:** REJECTED
**Reason:** The column header strings (e.g., `"Method|Path|Description"`) serve a dual purpose: they define the table schema *and* the localized headers. Removing them from templates and defaulting them in the datasource would either (a) hardcode English column names in the datasource layer — violating the project rule against embedding locale-specific content in `src/` — or (b) require the datasource to read locale configuration, adding complexity for marginal gain. The current approach keeps the contract explicit and visible in templates, which aligns with the project's "構成の安定性" (structural stability) principle. The "boilerplate" is actually the locale-aware configuration that Proposal #1 would properly centralize.
