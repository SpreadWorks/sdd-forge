# Draft: Add New Presets

## User Request

Add new presets for modern web/cloud stacks. Generic only, no project-specific information.

## Decisions

### 1. API Preset Hierarchy

- API method presets are independent from language/framework axis
- `base → api → rest / graphql`
- Combined via multi-preset: `{ "type": ["nextjs", "rest"] }`
- Symfony API Platform: `{ "type": ["symfony-api-platform", "rest"] }` (future)
- Next.js Route Handlers: covered by `nextjs` preset, not `api`

### 2. JS Web Application Layer

- `js-webapp` as JS equivalent of `php-webapp`
- Parent: `webapp`
- Covers JS/TS runtimes (Node.js, Deno, Bun, Workers)
- Common scan: `*.ts`, `*.js`, `*.tsx`, `*.jsx`

### 3. Hono

- Parent: `js-webapp`
- Scan: routing, middleware
- Thin preset, mostly scan contribution

### 4. Next.js

- Parent: `js-webapp`
- Both App Router (`app/`) and Pages Router (`pages/`) supported
- Scan: `app/**`, `pages/**`, `middleware.ts`, `next.config.*`
- Chapters: page/routing structure, Route Handlers, middleware

### 5. Cloudflare — Service Category Split

- NOT a single `cloudflare` preset
- Split by service category:
  - `base → storage → r2`
  - `base → edge → workers`
- Reasons:
  - Multi-preset philosophy: combine what you use
  - Clean scan separation
  - Future extensibility (s3, lambda as siblings)
- `cdn → pages` etc. deferred to future

### 6. Drizzle

- Parent: `database`
- Inherits `database` common chapters (table list, relations)
- Scan: schema definition files (`schema.ts`, `drizzle.config.ts`)

### 7. Cross-Chain Template Additive Merge

- Currently: same-name templates across different chains are NOT merged
- Needed: when `type: ["nextjs", "rest"]` both have `api.md`, content should be additively merged
- Implementation in `template-merger.js`: `resolveTemplates` must handle multi-chain resolution

## New Preset Summary

| Preset | Parent | Purpose |
|---|---|---|
| api | base | HTTP API common (auth, runtime env) |
| rest | api | REST API |
| graphql | api | GraphQL API |
| js-webapp | webapp | JS/TS web app common |
| hono | js-webapp | Hono framework |
| nextjs | js-webapp | Next.js (App/Pages Router) |
| storage | base | Storage common |
| r2 | storage | Cloudflare R2 |
| edge | base | Edge compute common |
| workers | edge | Cloudflare Workers |
| drizzle | database | Drizzle ORM |

## Open Questions

- None remaining.

## Approval

- [x] User approved this draft
- Date: 2026-03-18
