import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { writeJson } from "./tmp-dir.js";

export const SDD_FORGE = join(process.cwd(), "src/sdd-forge.js");

export function writeBaseConfig(tmp) {
  writeJson(tmp, ".sdd-forge/config.json", {
    lang: "ja",
    type: "base",
    docs: { languages: ["ja"], defaultLanguage: "ja" },
  });
}

export function runToken(tmp, args = []) {
  return execFileSync("node", [SDD_FORGE, "metrics", "token", ...args], {
    encoding: "utf8",
    env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
    cwd: tmp,
  });
}

export function runTokenJson(tmp) {
  return runToken(tmp, ["--format", "json"]);
}

export function runTokenCapture(tmp, args = ["--format", "json"]) {
  const res = spawnSync("node", [SDD_FORGE, "metrics", "token", ...args], {
    encoding: "utf8",
    env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
    cwd: tmp,
  });
  return { stdout: res.stdout ?? "", stderr: res.stderr ?? "", status: res.status };
}
