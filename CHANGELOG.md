# Changelog

## Unreleased

### Breaking Changes

#### Agent configuration redesign — `agent.commands` and `agent.providers.*.profiles` removed

The following fields are no longer recognized and will be silently ignored:

- `agent.commands` — per-command agent override map
- `agent.providers.<key>.profiles` — provider-level argument switching

**Migration:** Replace `agent.commands` with the new `agent.profiles` format.

**Before:**
```jsonc
{
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}"],
        "profiles": {
          "fast": ["-p", "{{PROMPT}}", "--model", "haiku"]
        }
      }
    },
    "commands": {
      "docs": { "agent": "claude", "profile": "fast" },
      "spec": { "agent": "claude", "profile": "default" }
    }
  }
}
```

**After:**
```jsonc
{
  "agent": {
    "default": "claude/sonnet",
    "providers": {
      "claude/haiku": { "command": "claude", "args": ["-p", "{{PROMPT}}", "--model", "haiku"] }
    },
    "profiles": {
      "fast": {
        "docs": "claude/haiku",
        "spec": "claude/sonnet"
      }
    },
    "useProfile": "fast"
  }
}
```

### New Features

#### `agent.profiles` — named profile routing

Profiles map command ID prefixes to provider keys. The active profile is selected by `agent.useProfile`.

```jsonc
"profiles": {
  "default": {
    "docs": "claude/sonnet",
    "spec": "claude/opus"
  }
}
```

Prefix matching is used: a profile entry `"docs"` matches command IDs `docs`, `docs.review`, `docs.forge`, etc. When multiple entries match, the longest prefix wins.

#### `agent.useProfile` — active profile selector

```jsonc
"useProfile": "default"
```

#### `SDD_FORGE_PROFILE` environment variable

Override `agent.useProfile` at runtime without modifying config:

```bash
SDD_FORGE_PROFILE=fast sdd-forge docs build
```

The environment variable takes precedence over `agent.useProfile`.

#### Built-in providers

The following providers are available without configuration:

| Key | Command |
|---|---|
| `claude/sonnet` | `claude -p {{PROMPT}} --model sonnet` |
| `claude/opus` | `claude -p {{PROMPT}} --model opus` |
| `codex/gpt-5.4` | `codex exec -m gpt-5.4 --full-auto -C .tmp {{PROMPT}}` |
| `codex/gpt-5.3` | `codex exec -m gpt-5.3-codex --full-auto -C .tmp {{PROMPT}}` |

User-defined providers in `agent.providers` override built-ins with the same key.
