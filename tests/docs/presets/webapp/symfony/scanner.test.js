import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCAN_DEFAULTS } from "../../../../../src/docs/presets/webapp/symfony/scanner.js";

describe("Symfony SCAN_DEFAULTS", () => {
  it("has controllers config", () => {
    assert.ok(SCAN_DEFAULTS.controllers);
    assert.equal(SCAN_DEFAULTS.controllers.dir, "src/Controller");
    assert.equal(SCAN_DEFAULTS.controllers.lang, "php");
    assert.equal(SCAN_DEFAULTS.controllers.subDirs, true);
  });

  it("has models (entities) config", () => {
    assert.ok(SCAN_DEFAULTS.models);
    assert.equal(SCAN_DEFAULTS.models.dir, "src/Entity");
    assert.equal(SCAN_DEFAULTS.models.lang, "php");
  });

  it("has shells/commands config", () => {
    assert.ok(SCAN_DEFAULTS.shells);
    assert.equal(SCAN_DEFAULTS.shells.dir, "src/Command");
  });

  it("has routes config", () => {
    assert.ok(SCAN_DEFAULTS.routes);
    assert.equal(SCAN_DEFAULTS.routes.file, "config/routes.yaml");
    assert.equal(SCAN_DEFAULTS.routes.lang, "yaml");
  });

  it("excludes .gitkeep", () => {
    assert.ok(SCAN_DEFAULTS.controllers.exclude.includes(".gitkeep"));
  });
});
