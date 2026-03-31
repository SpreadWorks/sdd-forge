import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSpec, buildPrTitle, buildPrBody } from "../../../../src/flow/commands/merge.js";

const SAMPLE_SPEC = `# Feature Specification: 042-auto-pr

**Feature Branch**: \`feature/042-auto-pr\`
**Created**: 2026-03-31
**Status**: Draft

## Goal
flow-finalize の PR ルートで PR description を自動生成する。

## Scope
- merge.js を拡張する
- spec.md を読む

## Out of Scope
- squash merge の変更

## Requirements
1. [P0] パーサーを追加する
2. [P0] buildPrBody を拡張する

## Acceptance Criteria
- PR body に Goal が含まれること
`;

const MINIMAL_SPEC = `# Feature Specification: 099-minimal

## Goal
最小限の spec。

## Scope
## Requirements
## Acceptance Criteria
`;

describe("parseSpec", () => {
  it("extracts Goal, Scope, Requirements sections", () => {
    const result = parseSpec(SAMPLE_SPEC);
    assert.equal(result.goal, "flow-finalize の PR ルートで PR description を自動生成する。");
    assert.equal(result.scope, "- merge.js を拡張する\n- spec.md を読む");
    assert.equal(result.requirements, "1. [P0] パーサーを追加する\n2. [P0] buildPrBody を拡張する");
  });

  it("returns null fields for empty sections", () => {
    const result = parseSpec(MINIMAL_SPEC);
    assert.equal(result.goal, "最小限の spec。");
    assert.equal(result.scope, null);
    assert.equal(result.requirements, null);
  });

  it("returns all-null for empty string", () => {
    const result = parseSpec("");
    assert.equal(result.goal, null);
    assert.equal(result.scope, null);
    assert.equal(result.requirements, null);
  });
});

describe("buildPrTitle", () => {
  it("returns Goal first line from spec", () => {
    const spec = { goal: "PR description を自動生成する。\n複数行の Goal", scope: null, requirements: null };
    const title = buildPrTitle(spec, "fallback-title");
    assert.equal(title, "PR description を自動生成する。");
  });

  it("falls back to specTitle when goal is null", () => {
    const spec = { goal: null, scope: null, requirements: null };
    const title = buildPrTitle(spec, "fallback-title");
    assert.equal(title, "fallback-title");
  });

  it("falls back when spec is null", () => {
    const title = buildPrTitle(null, "fallback-title");
    assert.equal(title, "fallback-title");
  });
});

describe("buildPrBody", () => {
  it("generates structured body with issue, goal, requirements, scope", () => {
    const state = { issue: 37, request: "original request" };
    const spec = {
      goal: "PR description を自動生成する。",
      requirements: "1. パーサー追加\n2. body 拡張",
      scope: "- merge.js を拡張",
    };
    const body = buildPrBody(state, spec);
    assert.ok(body.includes("fixes #37"));
    assert.ok(body.includes("## Goal"));
    assert.ok(body.includes("PR description を自動生成する。"));
    assert.ok(body.includes("## Requirements"));
    assert.ok(body.includes("1. パーサー追加"));
    assert.ok(body.includes("## Scope"));
    assert.ok(body.includes("- merge.js を拡張"));
  });

  it("omits sections that are null", () => {
    const state = { issue: 5 };
    const spec = { goal: "ゴール", scope: null, requirements: null };
    const body = buildPrBody(state, spec);
    assert.ok(body.includes("fixes #5"));
    assert.ok(body.includes("## Goal"));
    assert.ok(!body.includes("## Requirements"));
    assert.ok(!body.includes("## Scope"));
  });

  it("falls back to request-based body when spec is null", () => {
    const state = { issue: 10, request: "元のリクエスト" };
    const body = buildPrBody(state, null);
    assert.ok(body.includes("fixes #10"));
    assert.ok(body.includes("元のリクエスト"));
    assert.ok(!body.includes("## Goal"));
  });

  it("handles no issue and no spec", () => {
    const state = { request: "リクエスト" };
    const body = buildPrBody(state, null);
    assert.ok(!body.includes("fixes"));
    assert.ok(body.includes("リクエスト"));
  });

  it("handles no issue with spec", () => {
    const state = {};
    const spec = { goal: "ゴール", scope: null, requirements: null };
    const body = buildPrBody(state, spec);
    assert.ok(!body.includes("fixes"));
    assert.ok(body.includes("## Goal"));
  });
});
