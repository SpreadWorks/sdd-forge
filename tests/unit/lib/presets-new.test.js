import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS,
  resolveChain,
  resolveMultiChains,
  presetByLeaf,
} from "../../../src/lib/presets.js";

// ---------------------------------------------------------------------------
// New preset discovery
// ---------------------------------------------------------------------------

const NEW_PRESETS = [
  { key: "api",       parent: "base" },
  { key: "rest",      parent: "api" },
  { key: "graphql",   parent: "api" },
  { key: "js-webapp", parent: "webapp" },
  { key: "hono",      parent: "js-webapp" },
  { key: "nextjs",    parent: "js-webapp" },
  { key: "storage",   parent: "base" },
  { key: "r2",        parent: "storage" },
  { key: "edge",      parent: "base" },
  { key: "workers",   parent: "edge" },
  { key: "drizzle",   parent: "database" },
];

describe("new presets: discovery", () => {
  for (const { key } of NEW_PRESETS) {
    it(`preset "${key}" is discovered`, () => {
      const found = presetByLeaf(key);
      assert.ok(found, `preset "${key}" should be in PRESETS`);
    });
  }
});

// ---------------------------------------------------------------------------
// Parent chain resolution
// ---------------------------------------------------------------------------

describe("new presets: parent chain", () => {
  for (const { key, parent } of NEW_PRESETS) {
    it(`"${key}" has parent "${parent}"`, () => {
      const preset = presetByLeaf(key);
      assert.equal(preset.parent, parent);
    });
  }

  it("rest chain is base → api → rest", () => {
    const chain = resolveChain("rest");
    const keys = chain.map((p) => p.key);
    assert.deepEqual(keys, ["base", "api", "rest"]);
  });

  it("hono chain is base → webapp → js-webapp → hono", () => {
    const chain = resolveChain("hono");
    const keys = chain.map((p) => p.key);
    assert.deepEqual(keys, ["base", "webapp", "js-webapp", "hono"]);
  });

  it("nextjs chain is base → webapp → js-webapp → nextjs", () => {
    const chain = resolveChain("nextjs");
    const keys = chain.map((p) => p.key);
    assert.deepEqual(keys, ["base", "webapp", "js-webapp", "nextjs"]);
  });

  it("r2 chain is base → storage → r2", () => {
    const chain = resolveChain("r2");
    const keys = chain.map((p) => p.key);
    assert.deepEqual(keys, ["base", "storage", "r2"]);
  });

  it("workers chain is base → edge → workers", () => {
    const chain = resolveChain("workers");
    const keys = chain.map((p) => p.key);
    assert.deepEqual(keys, ["base", "edge", "workers"]);
  });

  it("drizzle chain is base → database → drizzle", () => {
    const chain = resolveChain("drizzle");
    const keys = chain.map((p) => p.key);
    assert.deepEqual(keys, ["base", "database", "drizzle"]);
  });
});

// ---------------------------------------------------------------------------
// Multi-chain resolution
// ---------------------------------------------------------------------------

describe("new presets: resolveMultiChains", () => {
  it("resolves independent chains for [nextjs, rest]", () => {
    const chains = resolveMultiChains(["nextjs", "rest"]);
    assert.equal(chains.length, 2);
    const leafKeys = chains.map((c) => c[c.length - 1].key);
    assert.ok(leafKeys.includes("nextjs"));
    assert.ok(leafKeys.includes("rest"));
  });

  it("resolves independent chains for [hono, workers, postgres, drizzle]", () => {
    const chains = resolveMultiChains(["hono", "workers", "postgres", "drizzle"]);
    // hono and workers are independent chains
    // postgres and drizzle: drizzle's chain includes database→drizzle,
    // postgres's chain includes database→postgres — both are independent
    const leafKeys = chains.map((c) => c[c.length - 1].key);
    assert.ok(leafKeys.includes("hono"));
    assert.ok(leafKeys.includes("workers"));
  });

  it("deduplicates when parent and child are both listed", () => {
    const chains = resolveMultiChains(["api", "rest"]);
    // rest includes api in its chain, so api-only chain should be removed
    assert.equal(chains.length, 1);
    assert.equal(chains[0][chains[0].length - 1].key, "rest");
  });
});
