# Feature Specification: 072-add-new-presets

**Feature Branch**: `feature/072-add-new-presets`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User request

## Goal

Add 11 new presets for modern web/cloud stacks and implement cross-chain template additive merge to support multi-preset document generation with same-name chapter files.

## Scope

### 1. New Presets

Create the following presets under `src/presets/`:

| Preset | Parent | Purpose |
|---|---|---|
| api | base | HTTP API common (auth, runtime environment) |
| rest | api | REST API documentation |
| graphql | api | GraphQL API documentation |
| js-webapp | webapp | JS/TS web application common (scan: `*.ts`, `*.js`, `*.tsx`, `*.jsx`) |
| hono | js-webapp | Hono framework (routing, middleware scan) |
| nextjs | js-webapp | Next.js App Router + Pages Router |
| storage | base | Storage service common |
| r2 | storage | Cloudflare R2 |
| edge | base | Edge compute common |
| workers | edge | Cloudflare Workers |
| drizzle | database | Drizzle ORM (inherits database table/relation chapters) |

Each preset consists of:
- `preset.json` — parent, label, aliases, scan include/exclude, chapters
- `templates/{lang}/*.md` — chapter templates with `{{data}}` / `{{text}}` directives
- `data/*.js` — DataSource classes (where scan/data extraction is needed)
- `scan/*.js` — Source code analyzers (where framework-specific parsing is needed)

### 2. Cross-Chain Template Additive Merge

When multiple presets in `type` array define the same chapter file (e.g., both `nextjs` and `rest` have `api.md`), their template contents must be additively merged.

**Implementation in `template-merger.js`:**
- `resolveTemplates()` must accept `string | string[]` for the type parameter
- When type is an array, resolve templates from each chain independently
- For same-name files across chains, concatenate `@block` sections additively (not override)
- Chain-specific sections should be identifiable by block names

**Implementation in `init.js`:**
- Pass the full type array to `resolveTemplates()` instead of a single string

### 3. Preset Hierarchy (updated)

```
base
├── api
│   ├── rest
│   └── graphql
├── webapp
│   ├── php-webapp → laravel, symfony, cakephp2
│   └── js-webapp
│       ├── hono
│       └── nextjs
├── cli → node-cli
├── library
├── database (existing: postgres)
│   └── drizzle
├── storage
│   └── r2
└── edge
    └── workers
```

## Out of Scope

- AWS / GCP presets (s3, lambda, cloud-functions, etc.) — future work
- CDN presets (pages, cloudfront) — future work
- Monorepo-specific preset — handled by base overview/project_structure + config scan.include
- App-level type mapping for monorepo — future work
- Non-HTTP API presets (gRPC, WebSocket) — future work
- SOAP/XML API preset — future work

## Clarifications (Q&A)

- Q: Should API presets be language-dependent?
  - A: No. API method (REST, GraphQL) is independent from language/framework axis. Language-specific scan comes from the language preset (e.g., `php-webapp`). Combine via multi-preset: `{ "type": ["symfony", "rest"] }`.

- Q: How to handle Next.js Route Handlers + separate API server?
  - A: Route Handlers are part of the `nextjs` preset. The separate API server uses `rest`/`hono` preset. Both combined via type array. Same-name chapter additive merge enables this.

- Q: Should Cloudflare be a single preset?
  - A: No. Split by service category (storage, edge, etc.) for better composability and future AWS/GCP extensibility.

- Q: Where does Drizzle belong in the hierarchy?
  - A: Under `database`. Inherits common database chapters (table list, relations). DB engine (`postgres`, `mysql`) is combined via multi-preset.

- Q: What about Symfony API Platform?
  - A: Future: `{ "type": ["symfony-api-platform", "rest"] }`. API Platform-specific scan under `symfony-api-platform` preset, REST chapters from `rest`.

- Q: Next.js Pages Router support?
  - A: Yes. Scan detects both `app/` and `pages/` directories.

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-18
- Notes: User chose to proceed with implementation

## Requirements

1. Create `preset.json` for all 11 new presets with correct parent chain, scan patterns, and chapters
2. Create English chapter templates (`templates/en/*.md`) for each preset with appropriate `{{data}}` and `{{text}}` directives
3. Implement cross-chain template additive merge in `template-merger.js`
4. Update `init.js` to pass type array to `resolveTemplates()`
5. Create DataSource classes for presets that need scan/data extraction (hono, nextjs, workers, r2, drizzle, rest, graphql)
6. Create scan analyzers for framework-specific source parsing (hono routes, Next.js pages, Drizzle schemas, Workers bindings, R2 config)
7. All presets must be generic — no project-specific information in `src/`
8. Existing presets and tests must not break

## Acceptance Criteria

1. `sdd-forge presets` lists all 11 new presets with correct labels and parent chains
2. `type: ["nextjs", "rest"]` produces docs with chapters from both presets; same-name chapters are additively merged
3. `type: ["hono", "workers", "postgres", "drizzle"]` produces correct combined documentation
4. Each new preset's scan correctly identifies relevant source files when present
5. Template inheritance (`@extends` / `@block`) works within each new preset chain
6. `npm test` passes with no regressions

## Open Questions

- (none)
