import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aiFilterChapters } from "../../../../src/docs/commands/init.js";

const CHAPTERS = [
  { fileName: "overview.md", content: "# Overview\nProject overview." },
  { fileName: "stack_and_ops.md", content: "# Stack & Ops\nTechnology stack." },
  { fileName: "development.md", content: "# Development\nDev setup." },
  { fileName: "db_tables.md", content: "# DB Tables\nDatabase tables." },
  { fileName: "batch_and_shell.md", content: "# Batch & Shell\nBatch jobs." },
];

const ANALYSIS = {
  analyzedAt: "2026-01-01",
  files: { summary: { total: 5 } },
};

function makeAgent(response) {
  return {
    command: "node",
    args: ["-e", `process.stdout.write(${JSON.stringify(response)})`, "{{PROMPT}}"],
  };
}

function makeThrowingAgent() {
  return {
    command: "node",
    args: ["-e", "process.exit(1)", "{{PROMPT}}"],
  };
}

describe("aiFilterChapters", () => {
  it("filters chapters based on valid AI JSON response", () => {
    const agent = makeAgent('["overview.md","development.md"]');
    const result = aiFilterChapters(CHAPTERS, ANALYSIS, agent, process.cwd(), "");
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((c) => c.fileName), ["overview.md", "development.md"]);
  });

  it("returns all chapters when AI returns invalid JSON", () => {
    const agent = makeAgent("not valid json at all");
    const result = aiFilterChapters(CHAPTERS, ANALYSIS, agent, process.cwd(), "");
    assert.equal(result.length, CHAPTERS.length);
  });

  it("returns all chapters when AI returns empty array", () => {
    const agent = makeAgent("[]");
    const result = aiFilterChapters(CHAPTERS, ANALYSIS, agent, process.cwd(), "");
    assert.equal(result.length, CHAPTERS.length);
  });

  it("returns all chapters when AI call throws", () => {
    const agent = makeThrowingAgent();
    const result = aiFilterChapters(CHAPTERS, ANALYSIS, agent, process.cwd(), "");
    assert.equal(result.length, CHAPTERS.length);
  });

  it("returns all chapters when AI returns non-array JSON", () => {
    const agent = makeAgent('{"chapters": ["overview.md"]}');
    const result = aiFilterChapters(CHAPTERS, ANALYSIS, agent, process.cwd(), "");
    assert.equal(result.length, CHAPTERS.length);
  });

  it("strips markdown fences from AI response", () => {
    const agent = makeAgent('```json\n["overview.md","development.md"]\n```');
    const result = aiFilterChapters(CHAPTERS, ANALYSIS, agent, process.cwd(), "");
    assert.equal(result.length, 2);
  });
});
