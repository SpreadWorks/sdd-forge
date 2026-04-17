#!/usr/bin/env node
/**
 * src/flow.js
 *
 * Flow dispatcher. Resolves ctx (root, config, flowState) and dispatches
 * to commands defined in registry.js.
 *
 * Routing:
 *   sdd-forge flow prepare "title" --base branch --worktree
 *   sdd-forge flow get status
 *   sdd-forge flow set step gate done
 *   sdd-forge flow run gate
 */

import { parseArgs } from "./lib/cli.js";
import { Envelope } from "./lib/flow-envelope.js";
import { FLOW_COMMANDS } from "./flow/registry.js";
import { EXIT_ERROR } from "./lib/constants.js";
import { container, initContainer } from "./lib/container.js";
import { resolveFlowContext } from "./flow/lib/flow-context.js";

initContainer();

// ---------------------------------------------------------------------------
// Parse top-level args: flow <group> [cmd] [rest...]
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const group = args[0];
const rest = args.slice(1);

if (!group || group === "-h" || group === "--help") {
  const lines = [
    "Usage: sdd-forge flow <command> [options]",
    "",
    "Commands:",
    `  ${"prepare".padEnd(18)} Initialize spec and branch/worktree`,
    `  ${"resume".padEnd(18)} Discover and resume active flow`,
    `  ${"get <key>".padEnd(18)} Read flow state`,
    `  ${"set <key>".padEnd(18)} Update flow state`,
    `  ${"run <action>".padEnd(18)} Execute flow actions`,
  ];
  console.log(lines.join("\n"));
  if (!group) process.exit(EXIT_ERROR);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Parse entry args and merge into ctx
// ---------------------------------------------------------------------------

function throwUnexpectedArgs(extras) {
  const unknownOpt = extras.find((v) => typeof v === "string" && v.startsWith("-"));
  if (unknownOpt) {
    throw new Error(`Unknown option: ${unknownOpt}`);
  }
  throw new Error(`Unexpected argument: ${extras[0]}`);
}

function assignPositionalArgs(ctx, positional, values) {
  if (!positional || values.length === 0) return;
  for (let i = 0; i < positional.length && i < values.length; i++) {
    ctx[positional[i]] = values[i];
  }
}

function parseNoArgEntry(rawArgs, ctx) {
  if (rawArgs.length === 0) return;
  if (rawArgs.length === 1 && (rawArgs[0] === "-h" || rawArgs[0] === "--help")) {
    ctx.help = true;
    return;
  }
  throwUnexpectedArgs(rawArgs);
}

function splitArgsBySpec(rawArgs, flags, options) {
  const flagOptionSet = new Set([...(flags || []), ...(options || [])]);
  const nonPositional = [];
  const positionalValues = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === "-h" || a === "--help") {
      nonPositional.push(a);
      continue;
    }
    if (flagOptionSet.has(a)) {
      nonPositional.push(a);
      if ((options || []).includes(a) && i + 1 < rawArgs.length) {
        nonPositional.push(rawArgs[++i]);
      }
      continue;
    }
    positionalValues.push(a);
  }
  return { nonPositional, positionalValues };
}

function parseEntryArgs(entry, rawArgs, ctx) {
  if (!entry.args) {
    parseNoArgEntry(rawArgs, ctx);
    return;
  }

  const { positional, flags, options } = entry.args;

  if (flags || options) {
    const spec = { flags: flags || [], options: options || [] };
    const { nonPositional, positionalValues } = splitArgsBySpec(rawArgs, flags, options);
    const parsed = parseArgs(nonPositional, spec);
    Object.assign(ctx, parsed);

    assignPositionalArgs(ctx, positional, positionalValues);

    const allowedPositionalCount = positional ? positional.length : 0;
    if (positionalValues.length > allowedPositionalCount) {
      throwUnexpectedArgs(positionalValues.slice(allowedPositionalCount));
    }
    return;
  }

  if (rawArgs.some((a) => a === "-h" || a === "--help")) {
    ctx.help = true;
    return;
  }

  // Reject unknown options (--something) when only positional args are expected
  const unknownOpt = rawArgs.find((a) => a.startsWith("-"));
  if (unknownOpt) {
    throw new Error(`Unknown option: ${unknownOpt}`);
  }

  const values = rawArgs.slice(0, positional.length);
  assignPositionalArgs(ctx, positional, values);
  if (rawArgs.length > positional.length) {
    throwUnexpectedArgs(rawArgs.slice(positional.length));
  }
}

function helpCommandFor(entry, groupKey, commandKey) {
  if (entry?.helpPath) return entry.helpPath;
  return `sdd-forge flow ${groupKey} ${commandKey} --help`;
}

// ---------------------------------------------------------------------------
// Run a registry entry: parseArgs → help → pre → command.run → ok/fail → post
// ---------------------------------------------------------------------------

async function runEntry(entry, rawArgs, envelopeType, envelopeKey) {
  // Parse args into a plain input object (CLI flags / options / positional)
  const input = {};
  try {
    parseEntryArgs(entry, rawArgs, input);
  } catch (err) {
    Envelope.fail(envelopeType, envelopeKey, "ERROR", [
      String(err.message || err),
      `Run: ${helpCommandFor(entry, envelopeType, envelopeKey)}`,
    ]).output();
    process.exitCode = EXIT_ERROR;
    return;
  }

  // Help
  if (input.help && entry.help) {
    console.log(entry.help);
    return;
  }

  // Build hook ctx from container + parsed input. The base FlowCommand
  // assembles its own ctx from container; hooks share this object.
  const ctx = { ...resolveFlowContext(container), ...input };

  // requiresFlow check
  const requiresFlow = entry.requiresFlow !== false;
  if (requiresFlow && !ctx.flowState) {
    Envelope.fail(envelopeType, envelopeKey, "NO_FLOW", "no active flow (flow.json not found)").output();
    process.exit(EXIT_ERROR);
  }

  // Pre hook
  if (entry.pre) entry.pre(ctx);

  let envelope;
  try {
    const mod = await entry.command();
    const Command = mod.default;
    const cmd = new Command();
    const result = await cmd.run(container, input);
    envelope = Envelope.ok(envelopeType, envelopeKey, result || {});

    // Post hook runs BEFORE output so failures land in the envelope as warnings
    if (entry.post) {
      try {
        await entry.post(ctx, result);
      } catch (postErr) {
        envelope.addWarning("POST_HOOK_FAILED", postErr.message || String(postErr));
      }
    }
  } catch (err) {
    envelope = Envelope.fail(envelopeType, envelopeKey, err.code || "ERROR", err.message);
    if (entry.onError) {
      try {
        await entry.onError(ctx, err);
      } catch (onErrorErr) {
        envelope.addWarning("ON_ERROR_HOOK_FAILED", onErrorErr.message || String(onErrorErr));
      }
    }
  }
  envelope.output();
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function dispatch() {
  // Top-level command: resume
  if (group === "resume") {
    const entry = FLOW_COMMANDS.resume;
    await runEntry(entry, rest, "run", "resume");
    return;
  }

  // Top-level command: prepare
  if (group === "prepare") {
    const entry = FLOW_COMMANDS.prepare;
    if (!container.get("config") || Object.keys(container.get("config")).length === 0) {
      Envelope.fail("flow", "prepare", "NO_CONFIG", "config.json not found. Run sdd-forge setup first.").output();
      process.exit(EXIT_ERROR);
    }
    await runEntry(entry, rest, "run", "prepare-spec");
    return;
  }

  // Group commands: get/set/run
  const commands = FLOW_COMMANDS[group];
  if (!commands || typeof commands !== "object") {
    console.error(`sdd-forge flow: unknown command '${group}'`);
    console.error("Run: sdd-forge flow --help");
    process.exit(EXIT_ERROR);
  }

  const cmd = rest[0];
  const cmdArgs = rest.slice(1);

  if (!cmd || cmd === "-h" || cmd === "--help") {
    const lines = [`Usage: sdd-forge flow ${group} <key> [options]`, "", "Keys:"];
    for (const name of Object.keys(commands)) {
      lines.push(`  ${name}`);
    }
    console.log(lines.join("\n"));
    if (!cmd) process.exit(EXIT_ERROR);
    process.exit(0);
  }

  const entry = commands[cmd];
  if (!entry) {
    console.error(`sdd-forge flow ${group}: unknown key '${cmd}'`);
    console.error(`Run: sdd-forge flow ${group} --help`);
    process.exit(EXIT_ERROR);
  }

  await runEntry(entry, cmdArgs, group, cmd);
}

await dispatch();
