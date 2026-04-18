/**
 * src/lib/command-adapter.js
 *
 * Temporary adapter that wraps a legacy `main()`-style command module
 * into a Command subclass. Used during the migration (spec 188) to plug
 * docs / check / metrics commands into the unified registry before each
 * file is fully converted.
 *
 * Migration target: every command eventually exports `export default class
 * XxxCommand extends Command` directly. At that point this adapter is
 * removed.
 */

import { Command } from "./command.js";

/**
 * Wrap a legacy `export async function main(ctx?) { ... }` into a Command class.
 *
 * @param {() => Promise<{ main: Function, default?: unknown }>} importer
 *        lazy importer for the legacy command module.
 * @param {"raw"|"envelope"} outputMode
 * @returns {Promise<{ default: typeof Command }>}
 */
export async function legacyMainToCommand(importer, outputMode) {
  const mod = await importer();
  const main = mod.main || mod.default;
  if (typeof main !== "function") {
    throw new Error("legacyMainToCommand: module exports neither main nor default function");
  }

  class LegacyAdapter extends Command {
    static outputMode = outputMode;
    async execute(ctx) {
      // Legacy main() often calls `parseArgs(process.argv.slice(2), ...)` to
      // parse its own options. The dispatcher has already consumed the
      // top-level sdd-forge+subcommand tokens, so reshape process.argv to
      // just this command's argv tail for the duration of the call.
      const savedArgv = process.argv;
      const rawArgs = ctx?._rawArgs || [];
      process.argv = [savedArgv[0], savedArgv[1], ...rawArgs];
      try {
        // Legacy main()s build their own internal context when called with
        // no argument. Passing the dispatcher ctx (which lacks domain-
        // specific fields like docsDir) would confuse them, so call bare.
        return await main();
      } finally {
        process.argv = savedArgv;
      }
    }
  }

  return { default: LegacyAdapter };
}
