/**
 * src/lib/command-runner.js
 *
 * Shared helper for CLI dispatchers. Dynamically imports a command module,
 * invokes its `main` export, and exits with EXIT_ERROR on failure. Fails fast
 * with a clear message when the imported module does not export `main`, so
 * wiring errors are caught immediately instead of becoming silent no-ops.
 */

import { EXIT_ERROR } from "./constants.js";

export async function runModuleMain(scriptPath, rest) {
  process.argv = [process.argv[0], scriptPath, ...rest];
  const mod = await import(scriptPath);
  if (typeof mod.main !== "function") {
    console.error(`sdd-forge: command module does not export main(): ${scriptPath}`);
    process.exit(EXIT_ERROR);
  }
  try {
    await mod.main();
  } catch (err) {
    console.error(err?.stack || String(err));
    process.exit(EXIT_ERROR);
  }
}
