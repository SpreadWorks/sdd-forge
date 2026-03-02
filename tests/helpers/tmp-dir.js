import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export function createTmpDir(prefix = "sdd-test-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function removeTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

export function writeJson(dir, relPath, data) {
  const full = join(dir, relPath);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2));
}

export function writeFile(dir, relPath, content = "") {
  const full = join(dir, relPath);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
}
