import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createTmpDir, removeTmpDir, writeFile } from "../../../../../tests/helpers/tmp-dir.js";
import { analyzeMiddleware } from "../../scan/middleware.js";

describe("Hono analyzeMiddleware", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("detects middleware with path: app.use('/api', cors())", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/index.ts", `
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use('/api/*', cors());

export default app;
`);
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 1);
    assert.equal(result.middleware[0].name, "cors");
    assert.equal(result.middleware[0].path, "/api/*");
    assert.equal(result.middleware[0].file, "src/index.ts");
  });

  it("detects middleware without path: app.use(logger())", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/index.ts", `
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();
app.use(logger());

export default app;
`);
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 1);
    assert.equal(result.middleware[0].name, "logger");
    assert.equal(result.middleware[0].path, "*");
  });

  it("detects multiple middleware in one file", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/app.ts", `
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bearerAuth } from "hono/bearer-auth";

const app = new Hono();
app.use(logger());
app.use('/api/*', cors());
app.use('/api/*', bearerAuth({ token: 'secret' }));

export default app;
`);
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 3);
    const names = result.middleware.map((m) => m.name).sort();
    assert.deepEqual(names, ["bearerAuth", "cors", "logger"]);
  });

  it("returns empty when no middleware found", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/index.ts", `
import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => c.text("Hello"));

export default app;
`);
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 0);
    assert.deepEqual(result.middleware, []);
  });

  it("returns empty when no source files exist", () => {
    tmp = createTmpDir();
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 0);
    assert.deepEqual(result.middleware, []);
  });

  it("detects custom middleware via createMiddleware", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/middleware/auth.ts", `
import { createMiddleware } from "hono/factory";

const authGuard = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization");
  if (!token) return c.text("Unauthorized", 401);
  await next();
});

export { authGuard };
`);
    const result = analyzeMiddleware(tmp);
    assert.ok(result.middleware.some((m) => m.name === "authGuard"));
  });

  it("deduplicates identical middleware registrations", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/a.ts", `
app.use('/api', cors());
`);
    writeFile(tmp, "src/b.ts", `
app.use('/api', cors());
`);
    const result = analyzeMiddleware(tmp);
    const corsEntries = result.middleware.filter((m) => m.name === "cors" && m.path === "/api");
    assert.equal(corsEntries.length, 1);
  });

  it("scans .js and .mjs files", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/app.js", `
app.use(logger());
`);
    writeFile(tmp, "src/setup.mjs", `
app.use('/admin', bearerAuth({ token: "x" }));
`);
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 2);
  });

  it("excludes node_modules and dist", () => {
    tmp = createTmpDir();
    writeFile(tmp, "node_modules/hono/index.js", `
app.use(cors());
`);
    writeFile(tmp, "dist/index.js", `
app.use(logger());
`);
    writeFile(tmp, "src/index.ts", `
app.use(bearerAuth({ token: "x" }));
`);
    const result = analyzeMiddleware(tmp);
    assert.equal(result.summary.total, 1);
    assert.equal(result.middleware[0].name, "bearerAuth");
  });
});
