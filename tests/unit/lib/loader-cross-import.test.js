/**
 * tests/unit/lib/loader-cross-import.test.js
 *
 * Verifies that the module loader hook resolves
 * `sdd-forge/presets/<name>/<subpath>` specifiers via 3-tier lookup:
 *   1. project tier:  <projectRoot>/.sdd-forge/presets/<name>/<subpath>.js
 *   2. user tier:     <userHome>/.sdd-forge/presets/<name>/<subpath>.js
 *   3. builtin tier:  <pkg>/src/presets/<name>/<subpath>.js
 *
 * Also verifies:
 *   - fall-through to nextResolve when no tier matches
 *   - existing `sdd-forge/api` and non-preset `sdd-forge/*` specifiers unchanged
 *   - per-process in-memory cache (second lookup skips fs)
 *   - project tier skipped when projectRoot is not initialized
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const BUILTIN_PRESETS_DIR = path.join(REPO_ROOT, "src", "presets");

let loaderMod;
let resolveHook;

/** Create a unique tmp dir that will be removed after the test. */
function makeTmp(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `sdd-forge-loader-${label}-`));
  return dir;
}

/** Write a JS file at tmp/<relative>, ensuring parent directories exist. */
function writeFile(root, relative, contents) {
  const abs = path.join(root, relative);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents);
  return abs;
}

describe("module loader hook — sdd-forge/presets/<name>/<subpath>", () => {
  let cleanupDirs = [];
  let originalHome;

  before(async () => {
    loaderMod = await import("../../../src/loader.js");
    resolveHook = loaderMod.resolve;
    originalHome = process.env.HOME;
  });

  beforeEach(() => {
    // Reset loader state between tests
    if (typeof loaderMod.__resetForTest === "function") {
      loaderMod.__resetForTest();
    }
  });

  after(() => {
    // Clean tmp dirs
    for (const d of cleanupDirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch {}
    }
    if (originalHome !== undefined) process.env.HOME = originalHome;
  });

  function track(dir) {
    cleanupDirs.push(dir);
    return dir;
  }

  it("exports initialize() for projectRoot/user-home injection", () => {
    assert.strictEqual(typeof loaderMod.initialize, "function");
  });

  it("resolves from project tier when file exists there", async () => {
    const projectRoot = track(makeTmp("proj"));
    const userHome = track(makeTmp("home"));
    writeFile(projectRoot, ".sdd-forge/presets/my-app/data/source.js", "export const tier='project';");
    writeFile(userHome, ".sdd-forge/presets/my-app/data/source.js", "export const tier='user';");

    loaderMod.initialize({ projectRoot, userHome });

    const result = await Promise.resolve(
      resolveHook("sdd-forge/presets/my-app/data/source", {}, () => {
        throw new Error("should not fall through");
      }),
    );
    const expected = pathToFileURL(path.join(projectRoot, ".sdd-forge/presets/my-app/data/source.js")).href;
    assert.strictEqual(result.url, expected);
    assert.strictEqual(result.shortCircuit, true);
  });

  it("resolves from user tier when project tier misses", async () => {
    const projectRoot = track(makeTmp("proj"));
    const userHome = track(makeTmp("home"));
    writeFile(userHome, ".sdd-forge/presets/my-app/data/source.js", "export const tier='user';");

    loaderMod.initialize({ projectRoot, userHome });

    const result = await Promise.resolve(
      resolveHook("sdd-forge/presets/my-app/data/source", {}, () => {
        throw new Error("should not fall through");
      }),
    );
    const expected = pathToFileURL(path.join(userHome, ".sdd-forge/presets/my-app/data/source.js")).href;
    assert.strictEqual(result.url, expected);
  });

  it("resolves from builtin tier when project/user miss (uses a real builtin preset file)", async () => {
    const projectRoot = track(makeTmp("proj"));
    const userHome = track(makeTmp("home"));
    loaderMod.initialize({ projectRoot, userHome });

    // Pick any file that actually exists under src/presets/
    const sample = walkFindJs(BUILTIN_PRESETS_DIR);
    assert.ok(sample, "expected at least one .js file under src/presets/");
    const rel = path.relative(BUILTIN_PRESETS_DIR, sample).replace(/\.js$/, "");
    const specifier = `sdd-forge/presets/${rel.split(path.sep).join("/")}`;

    const result = await Promise.resolve(
      resolveHook(specifier, {}, () => {
        throw new Error("should not fall through");
      }),
    );
    assert.strictEqual(result.url, pathToFileURL(sample).href);
  });

  it("falls through to nextResolve when no tier matches", async () => {
    const projectRoot = track(makeTmp("proj"));
    const userHome = track(makeTmp("home"));
    loaderMod.initialize({ projectRoot, userHome });

    let nextCalled = false;
    const nextResolve = (spec) => {
      nextCalled = true;
      return { url: `fallthrough:${spec}`, shortCircuit: true };
    };
    const result = await Promise.resolve(
      resolveHook("sdd-forge/presets/does-not-exist/foo/bar", {}, nextResolve),
    );
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(result.url, "fallthrough:sdd-forge/presets/does-not-exist/foo/bar");
  });

  it("skips project tier when projectRoot is not provided", async () => {
    const projectRoot = track(makeTmp("proj"));
    const userHome = track(makeTmp("home"));
    writeFile(projectRoot, ".sdd-forge/presets/my-app/data/source.js", "export const tier='project';");
    writeFile(userHome, ".sdd-forge/presets/my-app/data/source.js", "export const tier='user';");

    // Initialize without projectRoot — project tier must be skipped
    loaderMod.initialize({ projectRoot: null, userHome });

    const result = await Promise.resolve(
      resolveHook("sdd-forge/presets/my-app/data/source", {}, () => {
        throw new Error("should not fall through");
      }),
    );
    const expected = pathToFileURL(path.join(userHome, ".sdd-forge/presets/my-app/data/source.js")).href;
    assert.strictEqual(result.url, expected);
  });

  it("caches resolution — second call does not touch fs", async () => {
    const projectRoot = track(makeTmp("proj"));
    const userHome = track(makeTmp("home"));
    writeFile(projectRoot, ".sdd-forge/presets/my-app/data/source.js", "export {};");

    loaderMod.initialize({ projectRoot, userHome });

    const specifier = "sdd-forge/presets/my-app/data/source";
    const first = await Promise.resolve(resolveHook(specifier, {}, () => { throw new Error("x"); }));

    // Spy on fs/promises access (hot-path I/O)
    const originalAccess = fsp.access;
    let accessCalls = 0;
    fsp.access = (...args) => { accessCalls++; return originalAccess(...args); };
    try {
      const second = await Promise.resolve(resolveHook(specifier, {}, () => { throw new Error("x"); }));
      assert.strictEqual(second.url, first.url);
      assert.strictEqual(accessCalls, 0, "cached lookup must not call fsp.access");
    } finally {
      fsp.access = originalAccess;
    }
  });

  it("preserves existing sdd-forge/api resolution (no regression)", async () => {
    loaderMod.initialize({ projectRoot: null, userHome: os.homedir() });
    const result = await Promise.resolve(
      resolveHook("sdd-forge/api", {}, () => { throw new Error("no fallthrough"); }),
    );
    assert.ok(result.url.endsWith("/src/api.js"), `got: ${result.url}`);
    assert.strictEqual(result.shortCircuit, true);
  });

  it("preserves existing non-preset sdd-forge/<subpath> resolution", async () => {
    loaderMod.initialize({ projectRoot: null, userHome: os.homedir() });
    const result = await Promise.resolve(
      resolveHook("sdd-forge/docs/lib/data-source", {}, () => { throw new Error("no fallthrough"); }),
    );
    assert.ok(
      result.url.endsWith("/src/docs/lib/data-source.js"),
      `got: ${result.url}`,
    );
  });

  it("passes non-sdd-forge specifiers through to nextResolve", async () => {
    loaderMod.initialize({ projectRoot: null, userHome: os.homedir() });
    const result = await Promise.resolve(
      resolveHook("some-other-pkg", {}, (spec) => ({ url: `resolved:${spec}`, shortCircuit: true })),
    );
    assert.strictEqual(result.url, "resolved:some-other-pkg");
  });
});

/** Walk presets dir and return the first .js file path, or null. */
function walkFindJs(root) {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        // Skip tests dirs to pick implementation files
        if (e.name === "tests" || e.name === "templates") continue;
        stack.push(p);
      } else if (e.isFile() && e.name.endsWith(".js")) {
        return p;
      }
    }
  }
  return null;
}
