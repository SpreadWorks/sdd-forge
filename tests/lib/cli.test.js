import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, repoRoot, sourceRoot } from "../../src/lib/cli.js";

describe("parseArgs", () => {
  it("parses flags", () => {
    const result = parseArgs(["--dry-run", "--force"], {
      flags: ["--dry-run", "--force"],
    });
    assert.equal(result.dryRun, true);
    assert.equal(result.force, true);
    assert.equal(result.help, false);
  });

  it("parses options with values", () => {
    const result = parseArgs(["--type", "webapp", "--agent", "claude"], {
      options: ["--type", "--agent"],
    });
    assert.equal(result.type, "webapp");
    assert.equal(result.agent, "claude");
  });

  it("parses --help / -h", () => {
    assert.equal(parseArgs(["--help"], {}).help, true);
    assert.equal(parseArgs(["-h"], {}).help, true);
  });

  it("applies defaults", () => {
    const result = parseArgs([], {
      flags: ["--force"],
      defaults: { force: false, count: "5" },
    });
    assert.equal(result.force, false);
    assert.equal(result.count, "5");
  });

  it("resolves aliases", () => {
    const result = parseArgs(["-v"], {
      flags: ["--verbose"],
      aliases: { "-v": "--verbose" },
    });
    assert.equal(result.verbose, true);
  });

  it("throws on unknown option", () => {
    assert.throws(() => parseArgs(["--unknown"], { flags: [] }), {
      message: /Unknown option/,
    });
  });

  it("skips --", () => {
    const result = parseArgs(["--"], { flags: [] });
    assert.equal(result.help, false);
  });

  it("converts kebab-case to camelCase", () => {
    const result = parseArgs(["--dry-run"], {
      flags: ["--dry-run"],
    });
    assert.equal(result.dryRun, true);
  });
});

describe("repoRoot", () => {
  const origWorkRoot = process.env.SDD_WORK_ROOT;

  afterEach(() => {
    if (origWorkRoot !== undefined) {
      process.env.SDD_WORK_ROOT = origWorkRoot;
    } else {
      delete process.env.SDD_WORK_ROOT;
    }
  });

  it("returns SDD_WORK_ROOT when set", () => {
    process.env.SDD_WORK_ROOT = "/tmp/test-root";
    assert.equal(repoRoot(), "/tmp/test-root");
  });

  it("returns a string when SDD_WORK_ROOT is not set", () => {
    delete process.env.SDD_WORK_ROOT;
    const result = repoRoot();
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });
});

describe("sourceRoot", () => {
  const origSourceRoot = process.env.SDD_SOURCE_ROOT;
  const origWorkRoot = process.env.SDD_WORK_ROOT;

  afterEach(() => {
    if (origSourceRoot !== undefined) {
      process.env.SDD_SOURCE_ROOT = origSourceRoot;
    } else {
      delete process.env.SDD_SOURCE_ROOT;
    }
    if (origWorkRoot !== undefined) {
      process.env.SDD_WORK_ROOT = origWorkRoot;
    } else {
      delete process.env.SDD_WORK_ROOT;
    }
  });

  it("returns SDD_SOURCE_ROOT when set", () => {
    process.env.SDD_SOURCE_ROOT = "/tmp/src-root";
    assert.equal(sourceRoot(), "/tmp/src-root");
  });

  it("falls back to repoRoot when SDD_SOURCE_ROOT is not set", () => {
    delete process.env.SDD_SOURCE_ROOT;
    process.env.SDD_WORK_ROOT = "/tmp/work";
    assert.equal(sourceRoot(), "/tmp/work");
  });
});
