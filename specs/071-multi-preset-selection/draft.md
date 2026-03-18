# Draft: Multi-Preset Selection (#071)

## Original Request

Implement a multi-preset selection mechanism that allows combining presets
from different axes (framework, platform, database, etc.) in a single project.

## Key Decisions (Q&A)

### 1. Config schema for multiple presets
- **Q**: How should users specify multiple presets?
- **A**: Extend `type` to `string | string[]`. Each element is a leaf preset name.
  - Single: `"type": "symfony"`
  - Multiple: `"type": ["symfony", "postgres"]`
  - Type path format (`"webapp/symfony"`) is abolished.

### 2. Preset hierarchy model
- **Q**: How to handle the cross-product problem (lang × arch)?
- **A**: Combination presets (e.g., `php-webapp`) with single-inheritance parent chains.
  No multi-inheritance, no `requires`, no `axis` concept.
  Add layers as needed: `base → webapp → php-webapp → symfony`.

### 3. Multiple chain resolution
- **Q**: How are multiple type entries resolved?
- **A**: Each entry is resolved as an independent parent chain.
  Parent-child dedup: if both parent and child are specified, child wins.

### 4. Template composition
- **Q**: How are templates from different chains combined?
- **A**: Paragraph-level (##) additive merge:
  - Same-name paragraph → append content
  - Unique paragraph → AI determines insertion position
  - Merged result stored in `.sdd-forge/templates/`
  - Subsequent runs use the stored templates

### 5. Directive syntax
- **Q**: How do directives know which chain's resolver to use?
- **A**: New syntax: `{{data: preset.source.method("labels")}}`
  Preset name is always required. All templates rewritten.

### 6. `lang` and `axis` fields
- **Q**: What happens to these fields?
- **A**: Abolished. `resolveLangPreset()`, `resolveType()`, `TYPE_ALIASES` removed.
  Everything resolved via parent chain only.

### 7. `php` and `node` preset disposition
- **Q**: What happens to standalone lang presets?
- **A**: `php` → renamed to `php-webapp` (parent: webapp).
  `node` → abolished (node-cli is self-contained).
  Future: insert `php`/`node` layer above when php-cli/node-webapp needed.

### 8. Load order
- **Q**: In what order are chains loaded?
- **A**: In type array order. Each chain is resolved independently.
  Within a chain: parent chain order (root → leaf).

### 9. Same-name chapters across chains
- **Q**: How are they merged?
- **A**: Paragraph-level additive merge, not replacement.
  Each chain's templates are resolved via bottom-up merge first (existing),
  then cross-chain same-name chapters are merged by paragraph addition.

### 10. Scope boundaries
- **Q**: What about monorepo support?
- **A**: Same mechanism applies. More chains in the type array.
  Monorepo-specific concerns (scan path separation, directive scoping)
  are separate spec but this foundation enables them.

## Approval
- [x] User approved this draft
- Confirmed at: 2026-03-18
