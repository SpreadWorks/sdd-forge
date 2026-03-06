# 017: Multi-Language Document Output

## Status
- [x] Spec created
- [ ] User approved this spec
- [ ] Implementation started
- [ ] Implementation complete

## Summary

Enable sdd-forge to generate documentation in multiple languages simultaneously.
When `output.languages` contains more than one language, the default language is output at `docs/` root and `README.md`, while non-default languages are output under `docs/{lang}/` subdirectories.

## Configuration

```json
{
  "output": {
    "languages": ["en", "ja"],
    "default": "en",
    "mode": "translate"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `languages` | `string[]` | List of output languages (e.g. `["en", "ja"]`) |
| `default` | `string` | Primary language — must be in `languages` |
| `mode` | `"translate" \| "generate"` | How non-default languages are produced |

- `mode` is only meaningful when `languages.length >= 2`
- When `languages` has a single entry, behavior is unchanged from current

### Generation Modes

| Mode | Description |
|---|---|
| `translate` | Generate docs in default language first, then translate to non-default languages |
| `generate` | Generate docs independently for each language from source code |

## Output Structure

```
# default: "en", languages: ["en", "ja"]

README.md                ← English (default)
docs/
├── 01_overview.md       ← English (default)
├── 02_architecture.md
├── ...
└── ja/
    ├── README.md        ← Japanese
    ├── 01_overview.md
    └── ...
```

Non-default language files are placed under `docs/{lang}/`.

## Language Links

Each document includes a language switcher link at the top, resolved via a data directive:

```markdown
{{data: lang.links}}

# Overview
...
```

The `lang.links` resolver requires:
- Current file path (to compute relative links)
- Language configuration (`output.languages`, `output.default`)
- Current file's language (inferred from path: `docs/ja/` → `ja`, `docs/` root → default)

### Resolved Examples

Default language file (`docs/01_overview.md`, default=en, languages=[en, ja]):
```markdown
🌐 [日本語](ja/01_overview.md)
```

Non-default language file (`docs/ja/01_overview.md`):
```markdown
🌐 [English](../01_overview.md)
```

Three or more languages (`docs/01_overview.md`, default=en, languages=[en, ja, zh]):
```markdown
🌐 [日本語](ja/01_overview.md) | [中文](zh/01_overview.md)
```

## Build Pipeline

```
sdd-forge build
  │
  ├─ scan
  ├─ init(default)  → docs/
  ├─ data(default)
  ├─ text(default)
  ├─ readme(default)
  │
  └─ Non-default language loop:
      │
      ├─ [mode=translate]
      │    translate(docs/*.md → docs/{lang}/*.md)
      │    translate(README.md → docs/{lang}/README.md)
      │
      └─ [mode=generate]
           init({lang})  → docs/{lang}/
           data({lang})
           text({lang})  ← AI instructed to output in {lang}
           readme({lang}) → docs/{lang}/README.md
  │
  └─ data resolves lang.links across all files

```

## New Command: `sdd-forge translate`

Translates default-language documents to non-default languages.

- Compares mtime of default language file vs translated file
- Re-translates only when default file is newer (or translated file is missing)
- Used by `build` pipeline in `translate` mode
- Can be run standalone for on-demand translation

## Command Behavior by Mode

| Command | `translate` mode | `generate` mode |
|---|---|---|
| `build` | default → translate | default → each lang independently |
| `forge` | Improve default only → re-translate | Improve all languages independently |
| `review` | Check default language only | Check all languages |
| `translate` | Translate/re-translate non-default langs | N/A (not used) |

## Template Fallback

### Multi-language mode (languages.length >= 2)

When the target language template directory does not exist in a preset:

1. Search other language directories in `languages` array order
2. Use the first found template as source
3. Translate it on-the-fly to the target language via AI (on every execution, not cached)

Translation preserves directives (`{{data: ...}}`, `{{text: ...}}`, `@block`, `@extends`) as-is and only translates markdown headings and static text.

This applies to both the default language and non-default languages:
- **Default language has no template** → find another language's template → translate to default
- **Non-default language has no template, mode=translate** → not needed (translates from generated docs, not templates)
- **Non-default language has no template, mode=generate** → find another language's template → translate to target, then use as template for generation

This means preset authors only need to maintain templates in **one language**.

### Single-language mode (languages.length == 1)

If the configured language has no matching template directory → **error immediately**.
No fallback is attempted.

## Prerequisites

Before implementing this spec, the following i18n gaps should be addressed:

1. **Preset templates** — Currently only `ja/` exists in all presets. `en/` templates needed.
2. **Help text i18n** — `--help` output is hardcoded in Japanese across all commands.

## Out of Scope

- Per-language `mode` configuration (all non-default languages share the same mode)
- MANUAL block handling (MANUAL blocks will be deprecated separately)
