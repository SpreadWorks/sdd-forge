import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEnrichPrompt,
  parseEnrichResponse,
  mergeEnrichment,
  collectEntries,
  splitIntoBatches,
  getRetryCount,
  enrichBatchWithRetry,
} from "../../../../src/docs/commands/enrich.js";

describe("collectEntries", () => {
  it("collects entries across categories with index and category", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 2 },
        entries: [
          { file: "src/foo.js", name: "foo.js", lines: 100 },
          { file: "src/bar.js", name: "bar.js", lines: 50 },
        ],
      },
    };
    const entries = collectEntries(analysis);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].category, "modules");
    assert.equal(entries[0].index, 0);
    assert.equal(entries[0].file, "src/foo.js");
    assert.equal(entries[0].lines, 100);
    assert.equal(entries[0].enriched, false);
    assert.equal(entries[1].index, 1);
    assert.equal(entries[1].lines, 50);
  });

  it("marks entries with enrich metadata as enriched", () => {
    const analysis = {
      modules: {
        entries: [
          { file: "a.js", enrich: { processedAt: "2026-03-26T00:00:00.000Z", attempts: 1 } },
          { file: "b.js" },
        ],
      },
    };
    const entries = collectEntries(analysis);
    assert.equal(entries[0].enriched, true);
    assert.equal(entries[1].enriched, false);
  });

  it("does not mark entries with summary alone as enriched", () => {
    const analysis = {
      modules: {
        entries: [
          { file: "a.js", summary: "Already done" },
          { file: "b.js" },
        ],
      },
    };
    const entries = collectEntries(analysis);
    assert.equal(entries[0].enriched, false);
    assert.equal(entries[1].enriched, false);
  });

  it("defaults lines to 0 when not present", () => {
    const analysis = {
      modules: { entries: [{ file: "a.js" }] },
    };
    const entries = collectEntries(analysis);
    assert.equal(entries[0].lines, 0);
  });

  it("skips meta keys", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      enrichedAt: "2026-01-01",
      extras: { foo: "bar" },
      modules: {
        entries: [{ file: "a.js" }],
      },
    };
    const entries = collectEntries(analysis);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].category, "modules");
  });

  it("handles multiple categories", () => {
    const analysis = {
      modules: { entries: [{ file: "a.js" }] },
      controllers: { entries: [{ file: "b.js" }, { file: "c.js" }] },
    };
    const entries = collectEntries(analysis);
    assert.equal(entries.length, 3);
  });
});

describe("splitIntoBatches", () => {
  it("splits by item count when maxLines is 0", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ lines: 100, index: i }));
    const batches = splitIntoBatches(entries, 0, 2);
    assert.equal(batches.length, 3);
    assert.equal(batches[0].length, 2);
    assert.equal(batches[1].length, 2);
    assert.equal(batches[2].length, 1);
  });

  it("splits by total lines", () => {
    const entries = [
      { lines: 100 }, { lines: 100 }, { lines: 100 },
      { lines: 100 }, { lines: 100 },
    ];
    const batches = splitIntoBatches(entries, 250, 20);
    // 100+100=200 OK, +100=300 > 250, so batch 1 = 2 items
    assert.equal(batches.length, 3);
    assert.equal(batches[0].length, 2);
    assert.equal(batches[1].length, 2);
    assert.equal(batches[2].length, 1);
  });

  it("puts a single large file in its own batch", () => {
    const entries = [
      { lines: 5000 }, // exceeds maxLines alone
      { lines: 50 },
      { lines: 50 },
    ];
    const batches = splitIntoBatches(entries, 3000, 20);
    assert.equal(batches.length, 2);
    assert.equal(batches[0].length, 1); // large file alone
    assert.equal(batches[1].length, 2); // small files together
  });

  it("respects maxItems even when lines budget remains", () => {
    const entries = Array.from({ length: 10 }, () => ({ lines: 10 }));
    const batches = splitIntoBatches(entries, 99999, 3);
    assert.equal(batches.length, 4); // 3+3+3+1
  });

  it("handles empty entries", () => {
    const batches = splitIntoBatches([], 3000, 20);
    assert.equal(batches.length, 0);
  });
});

describe("buildEnrichPrompt", () => {
  it("includes file list and chapter list", () => {
    const chapters = ["overview.md", "internal_design.md"];
    const batchEntries = [
      { category: "modules", index: 0, file: "src/foo.js" },
      { category: "modules", index: 1, file: "src/bar.js" },
    ];
    const prompt = buildEnrichPrompt(chapters, batchEntries);

    assert.ok(prompt.includes("src/foo.js"));
    assert.ok(prompt.includes("src/bar.js"));
    assert.ok(prompt.includes("overview"));
    assert.ok(prompt.includes("internal_design"));
    assert.ok(prompt.includes("Output format"));
    assert.ok(prompt.includes("JSON"));
  });

  it("includes category and index in file list", () => {
    const batchEntries = [
      { category: "modules", index: 5, file: "src/lib/config.js" },
    ];
    const prompt = buildEnrichPrompt(["overview.md"], batchEntries);
    assert.ok(prompt.includes('category: "modules"'));
    assert.ok(prompt.includes("index: 5"));
  });

  it("instructs AI to read source files", () => {
    const prompt = buildEnrichPrompt(["overview.md"], [
      { category: "modules", index: 0, file: "src/a.js" },
    ]);
    assert.ok(prompt.includes("Read"));
    assert.ok(prompt.includes("source file"));
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
        entries: [
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

    const result = mergeEnrichment(analysis, enrichment, {
      batchEntries: [{ category: "modules", index: 0 }, { category: "modules", index: 1 }],
      attemptsByKey: new Map([
        ["modules:0", 1],
        ["modules:1", 1],
      ]),
    });

    assert.equal(result.modules.entries[0].summary, "Foo module");
    assert.equal(result.modules.entries[0].detail, "Does foo things");
    assert.equal(result.modules.entries[0].chapter, "internal_design");
    assert.equal(result.modules.entries[0].role, "lib");
    assert.equal(result.modules.entries[0].file, "src/foo.js"); // original preserved
    assert.equal(result.modules.entries[0].enrich.attempts, 1);
    assert.ok(result.modules.entries[0].enrich.processedAt);
    assert.equal(result.modules.entries[1].summary, "Bar module");
    assert.ok(result.enrichedAt); // timestamp added
  });

  it("skips invalid indices", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        entries: [{ file: "a.js" }],
      },
    };
    const enrichment = {
      modules: [
        { index: 5, summary: "Out of range" },
        { index: -1, summary: "Negative" },
      ],
    };

    const result = mergeEnrichment(analysis, enrichment);
    assert.ok(!result.modules.entries[0].summary); // not modified
  });

  it("skips unknown categories", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        entries: [{ file: "a.js" }],
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
        entries: [{ file: "a.js", summary: "original" }],
      },
    };
    const enrichment = {
      modules: [{ index: 0, detail: "new detail" }],
    };

    const result = mergeEnrichment(analysis, enrichment, {
      batchEntries: [{ category: "modules", index: 0 }],
      attemptsByKey: new Map([["modules:0", 2]]),
    });
    assert.equal(result.modules.entries[0].summary, "original"); // preserved
    assert.equal(result.modules.entries[0].detail, "new detail"); // added
    assert.equal(result.modules.entries[0].enrich.attempts, 2);
  });

  it("marks entries as processed even when summary is missing and emits a warning", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 1 },
        entries: [{ file: "a.js" }],
      },
    };
    const warnings = [];
    const enrichment = {
      modules: [{ index: 0, detail: "new detail" }],
    };

    const result = mergeEnrichment(analysis, enrichment, {
      batchEntries: [{ category: "modules", index: 0, file: "a.js" }],
      attemptsByKey: new Map([["modules:0", 3]]),
      onWarn: (msg) => warnings.push(msg),
    });

    assert.equal(result.modules.entries[0].detail, "new detail");
    assert.equal(result.modules.entries[0].enrich.attempts, 3);
    assert.ok(result.modules.entries[0].enrich.processedAt);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /a\.js/);
    assert.match(warnings[0], /modules/);
    assert.match(warnings[0], /index=0/);
  });

  it("does not mark entries as processed when they are missing from the AI response", () => {
    const analysis = {
      analyzedAt: "2026-01-01",
      modules: {
        summary: { total: 2 },
        entries: [{ file: "a.js" }, { file: "b.js" }],
      },
    };
    const enrichment = {
      modules: [{ index: 0, summary: "A summary" }],
    };

    const result = mergeEnrichment(analysis, enrichment, {
      batchEntries: [
        { category: "modules", index: 0, file: "a.js" },
        { category: "modules", index: 1, file: "b.js" },
      ],
      attemptsByKey: new Map([
        ["modules:0", 1],
        ["modules:1", 1],
      ]),
    });

    assert.ok(result.modules.entries[0].enrich);
    assert.equal(result.modules.entries[0].enrich.attempts, 1);
    assert.equal(result.modules.entries[1].enrich.processedAt, undefined);
    assert.equal(result.modules.entries[1].enrich.attempts, 1);
  });
});

describe("getRetryCount", () => {
  it("defaults to 1 when config is missing", () => {
    assert.equal(getRetryCount({}), 1);
  });

  it("uses configured agent.retryCount", () => {
    assert.equal(getRetryCount({ agent: { retryCount: 4 } }), 4);
  });
});

describe("enrichBatchWithRetry", () => {
  it("retries empty response and succeeds", async () => {
    const calls = [];
    const result = await enrichBatchWithRetry({
      agent: {},
      prompt: "test",
      timeoutMs: 1000,
      cwd: process.cwd(),
      retryCount: 1,
      callAgent: async () => {
        calls.push("call");
        return calls.length === 1 ? "" : "{\"modules\":[]}";
      },
      sleep: async () => {},
    });

    assert.equal(calls.length, 2);
    assert.equal(result, "{\"modules\":[]}");
  });

  it("retries transient agent failure and succeeds", async () => {
    let calls = 0;
    const result = await enrichBatchWithRetry({
      agent: {},
      prompt: "test",
      timeoutMs: 1000,
      cwd: process.cwd(),
      retryCount: 1,
      callAgent: async () => {
        calls += 1;
        if (calls === 1) throw new Error("transient");
        return "{\"modules\":[]}";
      },
      sleep: async () => {},
    });

    assert.equal(calls, 2);
    assert.equal(result, "{\"modules\":[]}");
  });

  it("stops after retry limit is exceeded", async () => {
    let calls = 0;
    await assert.rejects(
      enrichBatchWithRetry({
        agent: {},
        prompt: "test",
        timeoutMs: 1000,
        cwd: process.cwd(),
        retryCount: 1,
        callAgent: async () => {
          calls += 1;
          throw new Error("still failing");
        },
        sleep: async () => {},
      }),
      /still failing/,
    );
    assert.equal(calls, 2);
  });
});
