import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { commands } from "../../src/help.js";

const CMD = join(process.cwd(), "src/help.js");

describe("help", () => {
  it("exports commands array", () => {
    assert.ok(Array.isArray(commands));
    assert.ok(commands.length > 0);
  });

  it("has expected commands in namespace groups", () => {
    const names = commands.filter((c) => c.name).map((c) => c.name);
    assert.ok(names.includes("help"));
    assert.ok(names.includes("setup"));
    assert.ok(names.includes("docs build"));
    assert.ok(names.includes("spec init"));
    assert.ok(names.includes("spec gate"));
    assert.ok(names.includes("flow start"));
  });

  it("does not include old flat commands", () => {
    const names = commands.filter((c) => c.name).map((c) => c.name);
    assert.ok(!names.includes("build"), "should not have flat 'build'");
    assert.ok(!names.includes("gate"), "should not have flat 'gate'");
    assert.ok(!names.includes("scan"), "should not have flat 'scan'");
  });

  it("has namespace sections", () => {
    const sections = commands.filter((c) => c.section).map((c) => c.section);
    assert.ok(sections.includes("Docs"));
    assert.ok(sections.includes("Spec"));
    assert.ok(sections.includes("Flow"));
  });

  it("prints help output via CLI", () => {
    const result = execFileSync("node", [CMD], { encoding: "utf8" });
    assert.match(result, /SDD Forge/);
    assert.match(result, /コマンド一覧/);
  });
});
