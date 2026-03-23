import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../../../helpers/tmp-dir.js";
import { copyFixtureInto } from "../../../acceptance/lib/pipeline.js";
import { getAcceptanceFixtureDir } from "../../../acceptance/lib/targets.js";

const SCAN_CMD = join(process.cwd(), "src/docs/commands/scan.js");
const INIT_CMD = join(process.cwd(), "src/docs/commands/init.js");
const DATA_CMD = join(process.cwd(), "src/docs/commands/data.js");

function makeEnv(tmp) {
  return { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp };
}

function setupFromFixture(tmp, fixtureName, configOverrides) {
  return copyFixtureInto(getAcceptanceFixtureDir(fixtureName), tmp, configOverrides);
}

describe("parent chain: scan", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("node-cli scan loads modules from cli parent chain DataSource", () => {
    tmp = createTmpDir();
    setupFromFixture(tmp, "node-cli");

    const result = execFileSync("node", [SCAN_CMD, "--stdout"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });
    const analysis = JSON.parse(result);

    assert.ok(analysis.analyzedAt, "should have analyzedAt");
    assert.ok(analysis.modules, "modules category should exist from cli parent chain");
    assert.ok(analysis.modules.summary.total > 0, "should have scanned modules");
    assert.ok(analysis.modules.modules.length > 0, "should have module entries");

    const fileNames = analysis.modules.modules.map((m) => m.file);
    assert.ok(fileNames.some((f) => f.includes("cli.js")), "should have scanned cli.js");
  });

  it("laravel scan loads php-webapp parent chain DataSource (config category at top level)", () => {
    tmp = createTmpDir();
    setupFromFixture(tmp, "laravel");

    const result = execFileSync("node", [SCAN_CMD, "--stdout"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });
    const analysis = JSON.parse(result);

    assert.ok(analysis.analyzedAt, "should have analyzedAt");
    assert.ok(analysis.config, "config category should exist at top level");
    assert.ok(analysis.config.composerDeps, "config.composerDeps should exist");
    assert.ok(analysis.config.composerDeps.require, "should have require deps");
    assert.ok(analysis.controllers, "controllers category should exist");
    assert.ok(analysis.controllers.laravelControllers, "laravelControllers should exist");
    assert.ok(analysis.controllers.laravelControllers.length > 0, "should have scanned controllers");
    assert.ok(analysis.models, "models category should exist");
    assert.ok(analysis.models.laravelModels, "laravelModels should exist");
    assert.ok(analysis.routes, "routes category should exist");
    assert.ok(analysis.routes.laravelRoutes, "laravelRoutes should exist");
    assert.ok(analysis.tables, "tables category should exist");
    assert.ok(analysis.tables.migrations, "migrations should exist");
  });
});

describe("parent chain: init", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("node-cli init includes stack_and_ops.md from parent chain", () => {
    tmp = createTmpDir();
    setupFromFixture(tmp, "node-cli", {
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      modules: { modules: [], summary: { total: 0 } },
    });

    execFileSync("node", [INIT_CMD, "--force"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });

    const docsDir = join(tmp, "docs");
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    assert.ok(files.length > 0, "should have chapter files");

    const hasStackAndOps = files.some((f) => f.includes("stack_and_ops"));
    assert.ok(hasStackAndOps, "stack_and_ops.md should be included from parent chain");
  });

  it("laravel init generates webapp chapters with ja fallback", () => {
    tmp = createTmpDir();
    setupFromFixture(tmp, "laravel", {
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      controllers: { controllers: [], summary: { total: 0, totalActions: 0 } },
      models: { models: [], summary: { total: 0 } },
    });

    execFileSync("node", [INIT_CMD, "--force"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });

    const docsDir = join(tmp, "docs");
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    assert.ok(files.length >= 4, `should have at least 4 chapters, got ${files.length}`);

    const hasStackAndOps = files.some((f) => f.includes("stack_and_ops"));
    assert.ok(hasStackAndOps, "stack_and_ops.md should be included from php-webapp parent chain");
  });

  it("resolveChaptersOrder includes parent chain chapters", async () => {
    const { resolveChaptersOrder } = await import("../../../../src/docs/lib/template-merger.js");

    const nodeCli = resolveChaptersOrder("node-cli");
    assert.ok(nodeCli.includes("stack_and_ops.md"), "node-cli should include stack_and_ops.md from parent chain");
    assert.ok(nodeCli.includes("overview.md"), "should include overview.md");
    assert.ok(nodeCli.includes("cli_commands.md"), "should include cli_commands.md from node-cli preset");

    const overviewIdx = nodeCli.indexOf("overview.md");
    const stackIdx = nodeCli.indexOf("stack_and_ops.md");
    assert.ok(stackIdx > overviewIdx, "stack_and_ops.md should come after overview.md");

    const laravel = resolveChaptersOrder("laravel");
    assert.ok(laravel.includes("stack_and_ops.md"), "laravel should include stack_and_ops.md from parent chain");
    assert.ok(laravel.includes("controller_routes.md"), "should include controller_routes.md from webapp preset");
  });
});

describe("parent chain: data", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("node-cli stack_and_ops uses text directive instead of data for config.stack", () => {
    tmp = createTmpDir();
    setupFromFixture(tmp, "node-cli", {
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });

    execFileSync("node", [INIT_CMD, "--force"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });

    const docsDir = join(tmp, "docs");
    const files = fs.readdirSync(docsDir).filter((f) => f.includes("stack_and_ops"));
    assert.ok(files.length > 0, "stack_and_ops chapter should exist");

    const stackFile = join(docsDir, files[0]);
    const content = fs.readFileSync(stackFile, "utf8");
    assert.ok(!content.includes("config.stack"), "should not contain config.stack data directive");
  });

  it("laravel data resolves config.composer directive via laravel DataSource", () => {
    tmp = createTmpDir();
    setupFromFixture(tmp, "laravel", {
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });

    execFileSync("node", [SCAN_CMD], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });

    execFileSync("node", [INIT_CMD, "--force"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });

    const docsDir = join(tmp, "docs");
    const files = fs.readdirSync(docsDir).filter((f) => f.includes("stack_and_ops"));

    let targetFile;
    if (files.length > 0) {
      targetFile = join(docsDir, files[0]);
    } else {
      targetFile = join(docsDir, "01_stack_and_ops.md");
      fs.writeFileSync(targetFile, "# 01. Stack and Ops\n\n");
    }

    const before = fs.readFileSync(targetFile, "utf8");
    if (!before.includes("laravel.config.composer")) {
      const content = `${before}\n<!-- {{data("laravel.config.composer", {labels: "Package|Version|Description"})}} -->\nplaceholder\n<!-- {{/data}} -->\n`;
      fs.writeFileSync(targetFile, content);
    }

    execFileSync("node", [DATA_CMD], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });

    const after = fs.readFileSync(targetFile, "utf8");
    assert.ok(!after.includes("placeholder"), "config.composer directive should be resolved");
    assert.ok(
      after.includes("Package") || after.includes("laravel/framework") || after.includes("php"),
      "resolved config.composer should contain package information from composer.json",
    );
  });
});
