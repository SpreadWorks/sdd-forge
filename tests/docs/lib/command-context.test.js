import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import fs from "fs";
import {
  resolveCommandContext,
  loadAnalysisData,
  loadFullAnalysis,
  getChapterFiles,
} from "../../../src/docs/lib/command-context.js";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

describe("resolveCommandContext", () => {
  let tmp;

  it("returns context with defaults when no config exists", () => {
    tmp = createTmpDir("cmd-ctx");
    const ctx = resolveCommandContext(null, { root: tmp });
    assert.equal(ctx.root, tmp);
    assert.equal(ctx.lang, "en");
    assert.equal(typeof ctx.t, "function");
    assert.deepEqual(ctx.config, {});
    removeTmpDir(tmp);
  });

  it("loads config and resolves fields", () => {
    tmp = createTmpDir("cmd-ctx");
    writeJson(tmp, ".sdd-forge/config.json", {
      type: "cli/node-cli",
      lang: "ja",
      output: { languages: ["ja"], default: "ja" },
    });
    const ctx = resolveCommandContext(null, { root: tmp });
    assert.equal(ctx.lang, "ja");
    assert.equal(ctx.outputLang, "ja");
    assert.equal(ctx.type, "cli/node-cli");
    assert.equal(ctx.docsDir, path.join(tmp, "docs"));
    removeTmpDir(tmp);
  });

  it("cli options override config", () => {
    tmp = createTmpDir("cmd-ctx");
    writeJson(tmp, ".sdd-forge/config.json", {
      type: "cli/node-cli",
      lang: "ja",
      output: { languages: ["ja", "en"], default: "ja" },
    });
    const cli = { lang: "en", docsDir: "docs/en" };
    const ctx = resolveCommandContext(cli, { root: tmp });
    assert.equal(ctx.outputLang, "en");
    assert.equal(ctx.docsDir, path.join(tmp, "docs/en"));
    removeTmpDir(tmp);
  });

  it("overrides take highest priority", () => {
    tmp = createTmpDir("cmd-ctx");
    writeJson(tmp, ".sdd-forge/config.json", {
      type: "cli/node-cli",
      lang: "ja",
      output: { languages: ["ja"], default: "ja" },
    });
    const cli = { lang: "en" };
    const ctx = resolveCommandContext(cli, { root: tmp, lang: "fr" });
    assert.equal(ctx.lang, "fr");
    removeTmpDir(tmp);
  });
});

describe("loadAnalysisData", () => {
  let tmp;

  it("returns null when no analysis files exist", () => {
    tmp = createTmpDir("analysis");
    fs.mkdirSync(path.join(tmp, ".sdd-forge", "output"), { recursive: true });
    assert.equal(loadAnalysisData(tmp), null);
    removeTmpDir(tmp);
  });

  it("returns analysis.json data", () => {
    tmp = createTmpDir("analysis");
    writeJson(tmp, ".sdd-forge/output/analysis.json", { source: "analysis" });
    const data = loadAnalysisData(tmp);
    assert.equal(data.source, "analysis");
    removeTmpDir(tmp);
  });
});

describe("loadFullAnalysis", () => {
  let tmp;

  it("returns analysis.json data", () => {
    tmp = createTmpDir("full-analysis");
    writeJson(tmp, ".sdd-forge/output/analysis.json", { source: "analysis" });
    const data = loadFullAnalysis(tmp);
    assert.equal(data.source, "analysis");
    removeTmpDir(tmp);
  });

  it("returns null when analysis.json missing", () => {
    tmp = createTmpDir("full-analysis");
    fs.mkdirSync(path.join(tmp, ".sdd-forge", "output"), { recursive: true });
    assert.equal(loadFullAnalysis(tmp), null);
    removeTmpDir(tmp);
  });
});

describe("getChapterFiles", () => {
  let tmp;

  it("returns empty array for non-existent directory", () => {
    assert.deepEqual(getChapterFiles("/nonexistent/dir"), []);
  });

  it("returns sorted chapter files matching NN_*.md pattern", () => {
    tmp = createTmpDir("chapters");
    writeFile(tmp, "03_config.md", "# Config");
    writeFile(tmp, "01_overview.md", "# Overview");
    writeFile(tmp, "02_commands.md", "# Commands");
    writeFile(tmp, "README.md", "# Readme");
    writeFile(tmp, "notes.txt", "notes");
    const files = getChapterFiles(tmp);
    assert.deepEqual(files, [
      "01_overview.md",
      "02_commands.md",
      "03_config.md",
    ]);
    removeTmpDir(tmp);
  });
});
