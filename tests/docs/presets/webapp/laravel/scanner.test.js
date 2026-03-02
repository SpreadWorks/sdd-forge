import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCAN_DEFAULTS } from "../../../../../src/docs/presets/webapp/laravel/scanner.js";

describe("Laravel SCAN_DEFAULTS", () => {
  it("has controllers config", () => {
    assert.ok(SCAN_DEFAULTS.controllers);
    assert.equal(SCAN_DEFAULTS.controllers.dir, "app/Http/Controllers");
    assert.equal(SCAN_DEFAULTS.controllers.lang, "php");
    assert.equal(SCAN_DEFAULTS.controllers.subDirs, true);
  });

  it("has models config", () => {
    assert.ok(SCAN_DEFAULTS.models);
    assert.equal(SCAN_DEFAULTS.models.dir, "app/Models");
    assert.equal(SCAN_DEFAULTS.models.lang, "php");
  });

  it("has shells/commands config", () => {
    assert.ok(SCAN_DEFAULTS.shells);
    assert.equal(SCAN_DEFAULTS.shells.dir, "app/Console/Commands");
  });

  it("has routes config", () => {
    assert.ok(SCAN_DEFAULTS.routes);
    assert.equal(SCAN_DEFAULTS.routes.file, "routes/web.php");
  });

  it("excludes base Controller.php", () => {
    assert.ok(SCAN_DEFAULTS.controllers.exclude.includes("Controller.php"));
  });
});
