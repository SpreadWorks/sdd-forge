import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { commands } from "../src/help.js";

const CMD = join(process.cwd(), "src/help.js");

describe("help", () => {
  it("exports commands array", () => {
    assert.ok(Array.isArray(commands));
    assert.ok(commands.length > 0);
  });

  it("has expected commands", () => {
    const names = commands.filter((c) => c.name).map((c) => c.name);
    assert.ok(names.includes("help"));
    assert.ok(names.includes("setup"));
    assert.ok(names.includes("build"));
    assert.ok(names.includes("scan"));
    assert.ok(names.includes("spec"));
    assert.ok(names.includes("gate"));
    assert.ok(names.includes("flow"));
  });

  it("prints help output via CLI", () => {
    const result = execFileSync("node", [CMD], { encoding: "utf8" });
    assert.match(result, /SDD Forge/);
    assert.match(result, /コマンド一覧/);
  });
});
