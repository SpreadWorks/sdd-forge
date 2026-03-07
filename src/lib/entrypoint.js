import path from "path";
import { fileURLToPath } from "url";

export function isDirectRun(importMetaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return path.resolve(argv1) === path.resolve(fileURLToPath(importMetaUrl));
}

export function runIfDirect(importMetaUrl, main) {
  if (!isDirectRun(importMetaUrl)) return;
  try {
    const result = main();
    if (result && typeof result.then === "function") {
      result.catch((e) => {
        console.error(e?.stack || String(e));
        process.exit(1);
      });
    }
  } catch (e) {
    console.error(e?.stack || String(e));
    process.exit(1);
  }
}
