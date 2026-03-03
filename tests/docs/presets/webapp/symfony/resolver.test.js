import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSymfonyCategories } from "../../../../../src/docs/presets/webapp/symfony/resolver.js";

const desc = () => "—";
const loadOverrides = () => ({});

describe("Symfony resolver categories", () => {
  const categories = createSymfonyCategories(desc, loadOverrides);

  it("provides expected category keys", () => {
    const expectedKeys = [
      "controllers", "controllers.actions", "controllers.di",
      "tables", "tables.columns", "tables.fk",
      "entities.relations", "entities.columns",
      "routes", "routes.attribute", "routes.yaml",
      "commands",
      "config.composer", "config.env", "config.bundles", "config.packages", "config.services",
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

  it("controllers resolves from symfonyControllers", () => {
    const analysis = {
      extras: {
        symfonyControllers: [
          { className: "UserController", file: "src/Controller/UserController.php" },
        ],
      },
    };
    const result = categories.controllers(analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "UserController");
  });

  it("controllers.actions resolves actions", () => {
    const analysis = {
      extras: {
        symfonyControllers: [
          {
            className: "UserController",
            actions: [{ name: "index", routes: [] }, { name: "show", routes: [] }],
          },
        ],
      },
    };
    const result = categories["controllers.actions"](analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].action, "index");
    assert.equal(result[1].action, "show");
  });

  it("controllers.di resolves DI dependencies", () => {
    const analysis = {
      extras: {
        symfonyControllers: [
          { className: "UserController", diDeps: ["UserRepository", "LoggerInterface"] },
        ],
      },
    };
    const result = categories["controllers.di"](analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].dependency, "UserRepository");
  });

  it("tables resolves from migrations", () => {
    const analysis = {
      extras: {
        migrations: [
          { name: "user", columns: [{ name: "id", type: "INTEGER" }], foreignKeys: [] },
          { name: "post", columns: [{ name: "id", type: "INTEGER" }, { name: "title", type: "VARCHAR" }], foreignKeys: [] },
        ],
      },
    };
    const result = categories.tables(analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].name, "user");
    assert.equal(result[0].columns, 1);
    assert.equal(result[1].columns, 2);
  });

  it("tables.fk resolves foreign keys", () => {
    const analysis = {
      extras: {
        migrations: [
          { name: "post", columns: [], foreignKeys: [{ column: "user_id", references: "id", on: "user" }] },
        ],
      },
    };
    const result = categories["tables.fk"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].references, "user.id");
  });

  it("entities.relations returns relation data", () => {
    const analysis = {
      extras: {
        symfonyEntities: [
          {
            className: "User",
            relations: { OneToMany: [{ property: "posts", target: "Post" }] },
          },
        ],
      },
    };
    const result = categories["entities.relations"](analysis);
    assert.equal(result.length, 1);
    assert.match(result[0].associations, /OneToMany: Post/);
  });

  it("entities.columns returns column data", () => {
    const analysis = {
      extras: {
        symfonyEntities: [
          {
            className: "User",
            columns: [
              { name: "id", type: "integer", nullable: false, id: true },
              { name: "email", type: "string", nullable: false, id: false },
            ],
          },
        ],
      },
    };
    const result = categories["entities.columns"](analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "PK");
    assert.equal(result[1].id, "");
  });

  it("routes returns route list", () => {
    const analysis = {
      extras: {
        symfonyRoutes: [
          { path: "/users", controller: "UserController::index", methods: ["GET"], name: "user_index", source: "attribute" },
          { path: "/api/posts", controller: "App\\Controller\\PostController::list", methods: ["GET"], name: "api_posts", source: "yaml" },
        ],
      },
    };
    const result = categories.routes(analysis);
    assert.equal(result.length, 2);
    assert.equal(result[0].method, "GET");
    assert.equal(result[0].path, "/users");
  });

  it("routes.attribute filters to attribute routes only", () => {
    const analysis = {
      extras: {
        symfonyRoutes: [
          { path: "/users", controller: "UserController::index", methods: ["GET"], name: "user_index", source: "attribute" },
          { path: "/posts", controller: "PostController::list", methods: ["GET"], name: "post_list", source: "yaml" },
        ],
      },
    };
    const result = categories["routes.attribute"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].path, "/users");
  });

  it("routes.yaml filters to yaml routes only", () => {
    const analysis = {
      extras: {
        symfonyRoutes: [
          { path: "/users", controller: "UserController::index", methods: ["GET"], source: "attribute" },
          { path: "/posts", controller: "PostController::list", methods: ["GET"], source: "yaml" },
        ],
      },
    };
    const result = categories["routes.yaml"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].path, "/posts");
  });

  it("config.composer returns empty when no data", () => {
    const result = categories["config.composer"]({ extras: {} });
    assert.deepEqual(result, []);
  });

  it("config.bundles returns bundle list", () => {
    const analysis = {
      extras: {
        bundles: [
          { shortName: "FrameworkBundle", fullName: "Symfony\\Bundle\\FrameworkBundle\\FrameworkBundle" },
        ],
      },
    };
    const result = categories["config.bundles"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].bundle, "FrameworkBundle");
  });

  it("config.services returns service config", () => {
    const analysis = { extras: { services: { autowire: true, autoconfigure: true } } };
    const result = categories["config.services"](analysis);
    assert.equal(result.length, 1);
    assert.equal(result[0].autowire, "YES");
  });
});
