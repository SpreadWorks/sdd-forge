/**
 * src/lib/command-registry.js
 *
 * Unified command registry. Every CLI subcommand (flow / docs / check /
 * metrics) is declared here as a tree. Each dispatcher imports only the
 * subtree it needs via named exports (e.g. `flowCommands`), while static
 * checks and tests import the combined `allCommands` root.
 *
 * An entry shape:
 *
 *   {
 *     help: string,
 *     args?: { flags?, options?, positional? },
 *     command: () => Promise<{ default: typeof Command }>,
 *     outputMode: "envelope" | "raw",
 *     pre?, post?, onError?,
 *   }
 *
 * During spec 188 migration, legacy docs / check / metrics commands are
 * wrapped on the fly via `legacyMainToCommand(...)` until each is rewritten
 * as a Command subclass.
 */

import { FLOW_COMMANDS } from "../flow/registry.js";
import { legacyMainToCommand } from "./command-adapter.js";

// ---------------------------------------------------------------------------
// flow subtree — re-use the existing FLOW_COMMANDS tree and attach
// outputMode: "envelope" to every leaf entry. All flow commands emit
// JSON envelopes.
// ---------------------------------------------------------------------------

function decorateFlowEntry(entry) {
  if (entry && typeof entry.command === "function") {
    return { ...entry, outputMode: "envelope" };
  }
  if (entry && typeof entry === "object") {
    const out = {};
    for (const [k, v] of Object.entries(entry)) out[k] = decorateFlowEntry(v);
    return out;
  }
  return entry;
}

export const flowCommands = decorateFlowEntry(FLOW_COMMANDS);

// ---------------------------------------------------------------------------
// docs subtree
// ---------------------------------------------------------------------------

const rawMode = "raw";

function legacyEntry(modulePath, outputMode) {
  return {
    command: () => legacyMainToCommand(() => import(modulePath), outputMode),
    outputMode,
    // Legacy commands parse their own argv internally; the dispatcher forwards
    // raw args untouched via process.argv in command-adapter.js.
    passthroughArgs: true,
  };
}

export const docsCommands = {
  scan:      legacyEntry("../docs/commands/scan.js", rawMode),
  enrich:    legacyEntry("../docs/commands/enrich.js", rawMode),
  init:      legacyEntry("../docs/commands/init.js", rawMode),
  data:      legacyEntry("../docs/commands/data.js", rawMode),
  text:      legacyEntry("../docs/commands/text.js", rawMode),
  readme:    legacyEntry("../docs/commands/readme.js", rawMode),
  forge:     legacyEntry("../docs/commands/forge.js", rawMode),
  review:    legacyEntry("../docs/commands/review.js", rawMode),
  changelog: legacyEntry("../docs/commands/changelog.js", rawMode),
  agents:    legacyEntry("../docs/commands/agents.js", rawMode),
  translate: legacyEntry("../docs/commands/translate.js", rawMode),
};

// ---------------------------------------------------------------------------
// check subtree
// ---------------------------------------------------------------------------

export const checkCommands = {
  config:    legacyEntry("../check/commands/config.js", rawMode),
  freshness: legacyEntry("../check/commands/freshness.js", rawMode),
  scan:      legacyEntry("../check/commands/scan.js", rawMode),
};

// ---------------------------------------------------------------------------
// metrics subtree
// ---------------------------------------------------------------------------

export const metricsCommands = {
  token: legacyEntry("../metrics/commands/token.js", rawMode),
};

// ---------------------------------------------------------------------------
// Unified root
// ---------------------------------------------------------------------------

export const allCommands = {
  flow: flowCommands,
  docs: docsCommands,
  check: checkCommands,
  metrics: metricsCommands,
};
