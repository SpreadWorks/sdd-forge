# Draft: fix symfony regex backtracking

## Problem

`methodBlockRegex` in two files causes catastrophic backtracking when PHP Route attributes contain `{}`:

```
#[Route('/threads/{threadId}/posts')]
```

**Affected regex** (identical in both files):
```js
/((?:\s*#\[(?:[^\[\]]*(?:\[[^\[\]]*\])?)*\]\s*)*)\s*public\s+function\s+(\w+)\s*\(/g
```

**Root cause**: `(?:[^\[\]]*(?:\[[^\[\]]*\])?)*` — the outer `*` wraps two sub-patterns where `[^\[\]]*` can match empty. When `]` is not reachable through the expected path (e.g. long `{...}` sequences), the engine tries exponential combinations of splitting the string across iterations.

## Affected Files

1. `src/presets/symfony/scan/controllers.js` L46
2. `src/presets/symfony/scan/routes.js` L172

## Fix

Replace the attribute-matching part:
```
#\[(?:[^\[\]]*(?:\[[^\[\]]*\])?)*\]
```
with:
```
#\[(?:[^\[\]]|\[[^\]]*\])*\]
```

**Why this is safe**: Each iteration of `*` consumes either:
- Exactly one non-bracket char (`[^\[\]]` — single char), or
- A complete `[...]` group (`\[[^\]]*\]`)

No empty matches possible → no backtracking.

**Full regex becomes**:
```js
/((?:\s*#\[(?:[^\[\]]|\[[^\]]*\])*\]\s*)*)\s*public\s+function\s+(\w+)\s*\(/g
```

## Verification

Handles all PHP 8 attribute patterns:
- `#[Route('/path')]` — simple
- `#[Route('/threads/{threadId}/posts')]` — curly braces (was hanging)
- `#[Route('/path', methods: ['GET', 'POST'])]` — nested brackets
- `#[ORM\Column(type: 'string')]` — backslash in namespace

## Decisions

- [x] User approved this draft (option 1: simplify regex)
- Confirmed: 2026-03-18
