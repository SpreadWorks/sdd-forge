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

import { repoRoot, isInsideWorktree, getMainRepoPath } from "./lib/cli.js";
import { loadConfig } from "./lib/config.js";
import { loadFlowState, specIdFromPath } from "./lib/flow-state.js";
import { fail, output } from "./lib/flow-envelope.js";
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

function resolveCtx(requiresFlow) {
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
  if (requiresFlow && !flowState) {
    output(fail("flow", group, "NO_FLOW", "no active flow (flow.json not found)"));
    process.exit(EXIT_ERROR);
  }
  const specId = flowState ? specIdFromPath(flowState.spec) : null;

  return { root, mainRoot, config, flowState, specId, inWorktree };
}

// ---------------------------------------------------------------------------
// Run a registry entry: before → execute → after
// ---------------------------------------------------------------------------

async function runEntry(entry, ctx) {
  if (entry.before) entry.before(ctx);
  const mod = await entry.execute();
  const result = await mod.execute(ctx);
  if (entry.after) entry.after(ctx, result);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function dispatch() {
  // Top-level command: prepare
  if (group === "prepare") {
    const entry = FLOW_COMMANDS.prepare;
    const ctx = resolveCtx(false);
    if (!ctx.config) {
      output(fail("flow", "prepare", "NO_CONFIG", "config.json not found. Run sdd-forge setup first."));
      process.exit(EXIT_ERROR);
    }
    ctx.args = rest;
    await runEntry(entry, ctx);
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

  const requiresFlow = entry.requiresFlow !== false;
  const ctx = resolveCtx(requiresFlow);
  ctx.args = cmdArgs;

  await runEntry(entry, ctx);
}

await dispatch();
