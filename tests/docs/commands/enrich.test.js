import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEnrichPrompt,
  parseEnrichResponse,
  mergeEnrichment,
} from "../../../src/docs/commands/enrich.js";

describe("buildEnrichPrompt", () => {
  it("includes chapter list and category entries", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 2 },
        modules: [
          { file: "src/foo.js", name: "foo.js", methods: [{ name: "bar" }] },
          { file: "src/baz.js", name: "baz.js", methods: [] },
        ],
      },
    };
    const chapters = ["overview.md", "internal_design.md"];
    const prompt = buildEnrichPrompt(analysis, chapters, "/fake/root");

    assert.ok(prompt.includes("overview"));
    assert.ok(prompt.includes("internal_design"));
    assert.ok(prompt.includes("modules"));
    assert.ok(prompt.includes("foo.js"));
    assert.ok(prompt.includes("baz.js"));
    assert.ok(prompt.includes("bar")); // method name
  });

  it("skips meta keys", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      extras: { packageDeps: {} },
      files: { summary: { total: 10 } },
    };
    const prompt = buildEnrichPrompt(analysis, ["overview.md"], "/fake");

    assert.ok(!prompt.includes("analyzedAt"));
    assert.ok(!prompt.includes("packageDeps"));
  });

  it("handles empty categories gracefully", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 0 },
        modules: [],
      },
    };
    const prompt = buildEnrichPrompt(analysis, ["overview.md"], "/fake");
    assert.ok(typeof prompt === "string");
  });
});

describe("parseEnrichResponse", () => {
  it("parses clean JSON", () => {
    const json = JSON.stringify({ modules: [{ index: 0, summary: "test" }] });
    const result = parseEnrichResponse(json);
    assert.deepEqual(result, { modules: [{ index: 0, summary: "test" }] });
  });

  it("strips markdown fences", () => {
    const wrapped = "```json\n" + JSON.stringify({ modules: [] }) + "\n```";
    const result = parseEnrichResponse(wrapped);
    assert.deepEqual(result, { modules: [] });
  });

  it("extracts JSON from surrounding text", () => {
    const text = "Here is the result:\n" + JSON.stringify({ modules: [{ index: 0 }] }) + "\nDone.";
    const result = parseEnrichResponse(text);
    assert.ok(result);
    assert.ok(Array.isArray(result.modules));
  });

  it("returns null for unparseable input", () => {
    assert.equal(parseEnrichResponse("not json at all"), null);
  });

  it("returns null for empty input", () => {
    assert.equal(parseEnrichResponse(""), null);
  });
});

describe("mergeEnrichment", () => {
  it("merges enrichment data into analysis entries", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 2 },
        modules: [
          { file: "src/foo.js", name: "foo.js" },
          { file: "src/bar.js", name: "bar.js" },
        ],
      },
    };
    const enrichment = {
      modules: [
        { index: 0, summary: "Foo module", detail: "Does foo things", chapter: "internal_design", role: "lib" },
        { index: 1, summary: "Bar module", detail: "Does bar things", chapter: "overview", role: "cli" },
      ],
    };

    const result = mergeEnrichment(analysis, enrichment);

    assert.equal(result.modules.modules[0].summary, "Foo module");
    assert.equal(result.modules.modules[0].detail, "Does foo things");
    assert.equal(result.modules.modules[0].chapter, "internal_design");
    assert.equal(result.modules.modules[0].role, "lib");
    assert.equal(result.modules.modules[0].file, "src/foo.js"); // original preserved
    assert.equal(result.modules.modules[1].summary, "Bar module");
    assert.ok(result.enrichedAt); // timestamp added
  });

  it("skips invalid indices", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        modules: [{ file: "a.js" }],
      },
    };
    const enrichment = {
      modules: [
        { index: 5, summary: "Out of range" },
        { index: -1, summary: "Negative" },
      ],
    };

    const result = mergeEnrichment(analysis, enrichment);
    assert.ok(!result.modules.modules[0].summary); // not modified
  });

  it("skips unknown categories", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        modules: [{ file: "a.js" }],
      },
    };
    const enrichment = {
      unknown_cat: [{ index: 0, summary: "test" }],
    };

    const result = mergeEnrichment(analysis, enrichment);
    assert.ok(!result.unknown_cat);
  });

  it("preserves existing fields when enrichment field is empty", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        modules: [{ file: "a.js", summary: "original" }],
      },
    };
    const enrichment = {
      modules: [{ index: 0, detail: "new detail" }],
    };

    const result = mergeEnrichment(analysis, enrichment);
    assert.equal(result.modules.modules[0].summary, "original"); // preserved
    assert.equal(result.modules.modules[0].detail, "new detail"); // added
  });
});
