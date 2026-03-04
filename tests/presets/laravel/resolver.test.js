import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLaravelCategories } from "../../../src/presets/laravel/resolve.js";

const desc = () => "—";
const loadOverrides = () => ({});

describe("Laravel resolver categories", () => {
  const categories = createLaravelCategories(desc, loadOverrides);

  it("provides expected category keys", () => {
    const expectedKeys = [
      "controllers", "controllers.actions", "controllers.middleware",
      "tables", "tables.columns", "tables.fk", "tables.indexes",
      "models.relations", "models.scopes", "models.casts",
      "routes", "routes.api",
      "commands",
      "config.composer", "config.env", "config.providers", "config.middleware", "config.files",
    ];
    for (const key of expectedKeys) {
      assert.ok(categories[key], `missing category: ${key}`);
      assert.equal(typeof categories[key], "function", `${key} should be a function`);
    }
  });

  it("controllers returns empty array when no data", () => {
    const result = categories.controllers({ extras: {} });
    assert.deepEqual(result, []);
  });

  it("controllers resolves from laravelControllers", () => {
    const analysis = {
      extras: {
        laravelControllers: [
          { className: "UserController", file: "app/Http/Controllers/UserController.php" },
        ],
      },
    };
    const result = categories.controllers(analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "UserController");
  });

  it("tables resolves from migrations", () => {
    const analysis = {
      extras: {
        migrations: [
          { name: "users", columns: [{ name: "id", type: "bigIncrements" }], indexes: [], foreignKeys: [] },
          { name: "posts", columns: [{ name: "id", type: "bigIncrements" }, { name: "title", type: "string" }], indexes: [], foreignKeys: [] },
        ],
      },
    };
    const result = categories.tables(analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].name, "users");
    assert.equal(result[0].columns, 1);
    assert.equal(result[1].columns, 2);
  });

  it("tables.fk resolves foreign keys", () => {
    const analysis = {
      extras: {
        migrations: [
          { name: "posts", columns: [], indexes: [], foreignKeys: [{ column: "user_id", references: "id", on: "users" }] },
        ],
      },
    };
    const result = categories["tables.fk"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].references, "users.id");
  });

  it("routes returns route list", () => {
    const analysis = {
      extras: {
        laravelRoutes: [
          { httpMethod: "GET", uri: "/users", controller: "UserController", action: "index", routeType: "web" },
          { httpMethod: "POST", uri: "/api/users", controller: "UserController", action: "store", routeType: "api" },
        ],
      },
    };
    const result = categories.routes(analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].method, "GET");
  });

  it("routes.api filters to API routes only", () => {
    const analysis = {
      extras: {
        laravelRoutes: [
          { httpMethod: "GET", uri: "/users", controller: "UserController", action: "index", routeType: "web" },
          { httpMethod: "GET", uri: "/api/users", controller: "UserController", action: "index", routeType: "api" },
        ],
      },
    };
    const result = categories["routes.api"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].uri, "/api/users");
  });

  it("config.composer returns empty when no data", () => {
    const result = categories["config.composer"]({ extras: {} });
    assert.deepEqual(result, []);
  });

  it("models.relations returns relation data", () => {
    const analysis = {
      extras: {
        laravelModels: [
          {
            className: "User",
            relations: { hasMany: [{ method: "posts", model: "Post" }] },
          },
        ],
      },
    };
    const result = categories["models.relations"](analysis);
    assert.equal(result.length, 1);
    assert.match(result[0].associations, /hasMany: Post/);
  });
});
