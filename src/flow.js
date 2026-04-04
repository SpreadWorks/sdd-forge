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

import { repoRoot, isInsideWorktree, getMainRepoPath, parseArgs } from "./lib/cli.js";
import { loadConfig } from "./lib/config.js";
import { loadFlowState, specIdFromPath } from "./lib/flow-state.js";
import { ok, fail, output } from "./lib/flow-envelope.js";
import { FLOW_COMMANDS } from "./flow/registry.js";
import { EXIT_ERROR } from "./lib/exit-codes.js";

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
// Resolve ctx
// ---------------------------------------------------------------------------

function resolveCtx() {
  const root = repoRoot();
  const inWorktree = isInsideWorktree(root);
  const mainRoot = inWorktree ? getMainRepoPath(root) : root;

  let config;
  try {
    config = loadConfig(root);
  } catch (_) {
    config = null;
  }

  const flowState = loadFlowState(root);
  const specId = flowState ? specIdFromPath(flowState.spec) : null;

  return { root, mainRoot, config, flowState, specId, inWorktree };
}

// ---------------------------------------------------------------------------
// Parse entry args and merge into ctx
// ---------------------------------------------------------------------------

function parseEntryArgs(entry, rawArgs, ctx) {
  if (!entry.args) return;

  const { positional, flags, options } = entry.args;

  // Parse flags/options via parseArgs if defined
  if (flags || options) {
    const spec = { flags: flags || [], options: options || [] };
    // Separate positional args from flag/option args
    const flagOptionSet = new Set([...(flags || []), ...(options || [])]);
    const nonPositional = [];
    const positionalValues = [];
    for (let i = 0; i < rawArgs.length; i++) {
      const a = rawArgs[i];
      if (a === "-h" || a === "--help") { nonPositional.push(a); continue; }
      if (flagOptionSet.has(a)) {
        nonPositional.push(a);
        if ((options || []).includes(a) && i + 1 < rawArgs.length) {
          nonPositional.push(rawArgs[++i]);
        }
        continue;
      }
      positionalValues.push(a);
    }
    const parsed = parseArgs(nonPositional, spec);
    Object.assign(ctx, parsed);

    // Map positional values to named properties
    if (positional && positionalValues.length > 0) {
      for (let i = 0; i < positional.length && i < positionalValues.length; i++) {
        ctx[positional[i]] = positionalValues[i];
      }
    }
  } else if (positional) {
    // Only positional args (no flags/options)
    for (let i = 0; i < positional.length && i < rawArgs.length; i++) {
      ctx[positional[i]] = rawArgs[i];
    }
  }
}

// ---------------------------------------------------------------------------
// Run a registry entry: parseArgs → help → pre → command.run → ok/fail → post
// ---------------------------------------------------------------------------

async function runEntry(entry, ctx, envelopeType, envelopeKey) {
  // Parse args
  parseEntryArgs(entry, ctx.args || [], ctx);

  // Help
  if (ctx.help && entry.help) {
    console.log(entry.help);
    return;
  }

  // requiresFlow check
  const requiresFlow = entry.requiresFlow !== false;
  if (requiresFlow && !ctx.flowState) {
    output(fail(envelopeType, envelopeKey, "NO_FLOW", "no active flow (flow.json not found)"));
    process.exit(EXIT_ERROR);
  }

  // Pre hook
  if (entry.pre) entry.pre(ctx);

  try {
    const mod = await entry.command();
    const Command = mod.default;
    const cmd = new Command();
    const result = await cmd.run(ctx);

    output(ok(envelopeType, envelopeKey, result || {}));

    if (entry.post) entry.post(ctx, result);
  } catch (err) {
    output(fail(envelopeType, envelopeKey, err.code || "ERROR", err.message));
    if (entry.onError) entry.onError(ctx, err);
  } finally {
    if (entry.finally) entry.finally(ctx);
  }
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function dispatch() {
  // Top-level command: resume
  if (group === "resume") {
    const entry = FLOW_COMMANDS.resume;
    const ctx = resolveCtx();
    ctx.args = rest;
    await runEntry(entry, ctx, "run", "resume");
    return;
  }

  // Top-level command: prepare
  if (group === "prepare") {
    const entry = FLOW_COMMANDS.prepare;
    const ctx = resolveCtx();
    if (!ctx.config) {
      output(fail("flow", "prepare", "NO_CONFIG", "config.json not found. Run sdd-forge setup first."));
      process.exit(EXIT_ERROR);
    }
    ctx.args = rest;
    await runEntry(entry, ctx, "run", "prepare-spec");
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

  const ctx = resolveCtx();
  ctx.args = cmdArgs;

  await runEntry(entry, ctx, group, cmd);
}

await dispatch();
