## SDD (Spec-Driven Development)

This project uses Spec-Driven Development powered by sdd-forge.

- To add or modify features, run `/sdd-flow-start`.
- After implementation is complete, run `/sdd-flow-close`.
- If skills are unavailable, run `sdd-forge flow --request "<request>"` instead.

### About docs/

`docs/` is a structured knowledge base covering the project's design, architecture, and business logic.
Read docs to understand the full picture before making changes.

**If docs and source code conflict, source code is the truth.**

Before starting work, compare modification dates of docs/ and source code.
If source is newer, suggest running `sdd-forge build` to the user.

### docs/ Editing Rules

- docs/ content is primarily auto-generated from source code analysis
- Content inside `{{data}}` / `{{text}}` directives is overwritten by auto-generation
- Content outside directives is preserved
- Chapter ordering is defined by the `chapters` array in `preset.json`
