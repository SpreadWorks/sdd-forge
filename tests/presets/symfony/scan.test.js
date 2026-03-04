import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const presetPath = path.resolve(__dirname, "../../../src/presets/symfony/preset.json");

describe("Symfony preset.json scan config", () => {
  const preset = JSON.parse(fs.readFileSync(presetPath, "utf8"));
  const scan = preset.scan;

  it("has controllers config", () => {
    assert.ok(scan.controllers);
    assert.equal(scan.controllers.dir, "src/Controller");
    assert.equal(scan.controllers.lang, "php");
    assert.equal(scan.controllers.subDirs, true);
  });

  it("has models (entities) config", () => {
    assert.ok(scan.models);
    assert.equal(scan.models.dir, "src/Entity");
    assert.equal(scan.models.lang, "php");
  });

  it("has shells/commands config", () => {
    assert.ok(scan.shells);
    assert.equal(scan.shells.dir, "src/Command");
  });

  it("has routes config", () => {
    assert.ok(scan.routes);
    assert.equal(scan.routes.file, "config/routes.yaml");
    assert.equal(scan.routes.lang, "yaml");
  });

  it("excludes .gitkeep", () => {
    assert.ok(scan.controllers.exclude.includes(".gitkeep"));
  });
});
