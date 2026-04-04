/**
 * src/flow/registry.js
 *
 * Single source of truth for flow subcommand metadata.
 * Each command is defined declaratively with help, command (lazy import),
 * args definition, and optional pre/post/onError/finally hooks.
 *
 * Used by flow.js dispatcher and help.js.
 */

import { updateStepStatus, incrementMetric, derivePhase, loadFlowState } from "../lib/flow-state.js";
import { VALID_PHASES } from "./lib/phases.js";
import { loadIssueLog, saveIssueLog } from "./lib/set-issue-log.js";

/**
 * Load flow state and derive the current phase.
 * @param {string} root
 * @returns {string|null} phase name or null
 */
function deriveActivePhase(root) {
  const state = loadFlowState(root);
  return derivePhase(state?.steps);
}

/**
 * Best-effort step status update. Silently ignores errors (e.g. flow.json absent after cleanup).
 */
function tryUpdateStepStatus(root, stepId, status) {
  try { updateStepStatus(root, stepId, status); } catch {}
}

/**
 * Create a pre hook that sets a step to in_progress.
 * @param {string} stepId
 * @returns {(ctx: object) => void}
 */
function stepPre(stepId) {
  return (ctx) => tryUpdateStepStatus(ctx.root, stepId, "in_progress");
}

/**
 * Create a post hook that sets a step status based on result.
 * @param {string} stepId
 * @param {(result: object) => string} [statusFn] - derive status from result; defaults to "done"
 * @returns {(ctx: object, result: object) => void}
 */
function stepPost(stepId, statusFn) {
  return (ctx, result) => {
    const status = statusFn ? statusFn(result) : "done";
    tryUpdateStepStatus(ctx.root, stepId, status);
  };
}

/**
 * Map gate --phase value to the corresponding step ID.
 * @param {string} [phase]
 * @returns {string}
 */
function resolveGateStepId(phase) {
  if (phase === "draft") return "gate-draft";
  if (phase === "impl") return "gate-impl";
  return "gate";
}

export const FLOW_COMMANDS = {
  resume: {
    helpKey: "flow.resume",
    requiresFlow: false,
    command: () => import("./lib/run-resume.js"),
    help: "Usage: sdd-forge flow resume\n\nDiscover and display the active flow context for recovery.",
  },
  prepare: {
    helpKey: "flow.prepare",
    requiresFlow: false,
    command: () => import("./lib/run-prepare-spec.js"),
    args: {
      flags: ["--no-branch", "--worktree", "--dry-run"],
      options: ["--title", "--base", "--issue", "--request"],
    },
    help: [
      "Usage: sdd-forge flow prepare [options]",
      "",
      "Create branch/worktree and initialize spec directory.",
      "",
      "Options:",
      "  --title <name>     Feature title (required)",
      "  --base <branch>    Base branch (default: current HEAD)",
      "  --worktree         Use git worktree mode",
      "  --no-branch        Spec-only mode (no branch creation)",
      "  --issue <number>   GitHub Issue number to link",
      "  --request <text>   User request text to save in flow.json",
      "  --dry-run          Show what would happen without executing",
    ].join("\n"),
  },
  get: {
    status: {
      helpKey: "flow.get.status",
      command: () => import("./lib/get-status.js"),
      help: "Usage: sdd-forge flow get status\n\nReturn current flow state as JSON envelope.",
    },
    "resolve-context": {
      helpKey: "flow.get.resolve-context",
      command: () => import("./lib/get-resolve-context.js"),
      help: "Usage: sdd-forge flow get resolve-context\n\nResolve worktree/repo paths and active flow for context recovery.",
    },
    check: {
      helpKey: "flow.get.check",
      command: () => import("./lib/get-check.js"),
      args: { positional: ["target"] },
      help: "Usage: sdd-forge flow get check <target>\n\nCheck a condition. Targets: dirty, gh, impl, finalize.",
    },
    prompt: {
      helpKey: "flow.get.prompt",
      requiresFlow: false,
      command: () => import("./lib/get-prompt.js"),
      args: { positional: ["kind"] },
      help: "Usage: sdd-forge flow get prompt <kind>\n\nReturn a prompt template by kind.",
    },
    "qa-count": {
      helpKey: "flow.get.qa-count",
      command: () => import("./lib/get-qa-count.js"),
      help: "Usage: sdd-forge flow get qa-count\n\nReturn the number of answered questions in draft phase.",
    },
    guardrail: {
      helpKey: "flow.get.guardrail",
      requiresFlow: false,
      command: () => import("./lib/get-guardrail.js"),
      args: { positional: ["phase"], options: ["--format"] },
      help: `Usage: sdd-forge flow get guardrail <phase> [--format json]\n\nReturn guardrails filtered by phase. Phases: ${VALID_PHASES.join(", ")}.`,
    },
    issue: {
      helpKey: "flow.get.issue",
      requiresFlow: false,
      command: () => import("./lib/get-issue.js"),
      args: { positional: ["number"] },
      help: "Usage: sdd-forge flow get issue <number>\n\nGet GitHub issue content as JSON.",
    },
    context: {
      helpKey: "flow.get.context",
      command: () => import("./lib/get-context.js"),
      args: { positional: ["path"], flags: ["--raw"], options: ["--search"] },
      help: [
        "Usage: sdd-forge flow get context [path] [--raw] [--search <query>]",
        "",
        "List mode (no path): filtered analysis entries.",
        "File mode (with path): file content + metric increment.",
        "Search mode (--search): keyword search in analysis entries.",
        "",
        "Options:",
        "  --raw              Output content without JSON envelope",
        "  --search <query>   Search entries by keyword (matches against keywords array)",
      ].join("\n"),
      post(ctx, result) {
        const phase = deriveActivePhase(ctx.root);
        if (!phase) return;

        if (result?.type) {
          // File mode: result.type is "docs" or "src"
          incrementMetric(ctx.root, phase, result.type === "docs" ? "docsRead" : "srcRead");
        } else if (result?.entries || result?.total != null) {
          // List mode or search mode: reads analysis.json → docsRead
          incrementMetric(ctx.root, phase, "docsRead");
        }
      },
    },
  },
  set: {
    step: {
      helpKey: "flow.set.step",
      command: () => import("./lib/set-step.js"),
      args: { positional: ["id", "status"] },
      help: "Usage: sdd-forge flow set step <id> <status>\n\nUpdate a workflow step's status.",
    },
    request: {
      helpKey: "flow.set.request",
      command: () => import("./lib/set-request.js"),
      args: { positional: ["text"] },
      help: "Usage: sdd-forge flow set request \"<text>\"\n\nSet the user request field in flow.json.",
    },
    issue: {
      helpKey: "flow.set.issue",
      command: () => import("./lib/set-issue.js"),
      args: { positional: ["number"] },
      help: "Usage: sdd-forge flow set issue <number>\n\nSet the GitHub issue number in flow.json.",
    },
    note: {
      helpKey: "flow.set.note",
      command: () => import("./lib/set-note.js"),
      args: { positional: ["text"] },
      help: "Usage: sdd-forge flow set note \"<text>\"\n\nAppend a note to the notes array in flow.json.",
    },
    summary: {
      helpKey: "flow.set.summary",
      command: () => import("./lib/set-summary.js"),
      args: { positional: ["json"] },
      help: "Usage: sdd-forge flow set summary '<json-array>'\n\nSet requirements list from a JSON string array.",
    },
    req: {
      helpKey: "flow.set.req",
      command: () => import("./lib/set-req.js"),
      args: { positional: ["index", "status"] },
      help: "Usage: sdd-forge flow set req <index> <status>\n\nUpdate a single requirement's status.",
    },
    metric: {
      helpKey: "flow.set.metric",
      command: () => import("./lib/set-metric.js"),
      args: { positional: ["phase", "counter"] },
      help: `Usage: sdd-forge flow set metric <phase> <counter>\n\nIncrement a metric counter in flow.json. Phases: ${VALID_PHASES.join(", ")}. Counters: question, redo, docsRead, srcRead.`,
    },
    "issue-log": {
      helpKey: "flow.set.issue-log",
      command: () => import("./lib/set-issue-log.js"),
      args: { options: ["--step", "--reason", "--trigger", "--resolution", "--guardrail-candidate"] },
      help: "Usage: sdd-forge flow set issue-log --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]\n\nRecord an issue-log entry in issue-log.json.",
      post(ctx) {
        const phase = deriveActivePhase(ctx.root);
        if (phase) incrementMetric(ctx.root, phase, "issueLog");
      },
    },
    redo: {
      helpKey: "flow.set.redo",
      requiresFlow: false,
      execute: () => Promise.resolve({ execute() { output(fail("set", "redo", "RENAMED", '"redo" has been renamed to "issue-log". Use: sdd-forge flow set issue-log')); } }),
    },
    auto: {
      helpKey: "flow.set.auto",
      command: () => import("./lib/set-auto.js"),
      args: { positional: ["value"] },
      help: "Usage: sdd-forge flow set auto on|off\n\nEnable or disable autoApprove mode in flow.json.",
    },
    "test-summary": {
      helpKey: "flow.set.test-summary",
      command: () => import("./lib/set-test-summary.js"),
      args: { options: ["--unit", "--integration", "--acceptance"] },
      help: [
        "Usage: sdd-forge flow set test-summary [options]",
        "",
        "Options:",
        "  --unit N          Number of unit tests",
        "  --integration N   Number of integration tests",
        "  --acceptance N    Number of acceptance tests",
      ].join("\n"),
    },
  },
  run: {
    gate: {
      helpKey: "flow.run.gate",
      pre(ctx) {
        tryUpdateStepStatus(ctx.root, resolveGateStepId(ctx.phase), "in_progress");
      },
      command: () => import("./lib/run-gate.js"),
      args: {
        options: ["--spec", "--phase"],
        flags: ["--skip-guardrail"],
      },
      help: [
        "Usage: sdd-forge flow run gate [options]",
        "",
        "Run gate check. Resolves target from flow.json if omitted.",
        "",
        "Options:",
        "  --spec <path>                 Path to spec.md (auto-resolved from flow.json)",
        "  --phase <draft|pre|post|impl> Gate phase (default: pre)",
        "  --skip-guardrail              Skip AI guardrail compliance check",
      ].join("\n"),
      post(ctx, result) {
        const status = result?.result === "pass" ? "done" : "in_progress";
        tryUpdateStepStatus(ctx.root, resolveGateStepId(ctx.phase), status);

        // Auto-record issue-log on gate FAIL
        if (result?.result !== "pass") {
          try {
            const logRoot = ctx.mainRoot || ctx.root;
            const issueLog = loadIssueLog(logRoot, ctx.flowState?.spec);
            const reasons = result?.artifacts?.issues?.length
              ? result.artifacts.issues.join("; ")
              : (result?.artifacts?.reasons || []).map(r => r.detail || r).join("; ");
            issueLog.entries.push({
              step: resolveGateStepId(ctx.phase),
              reason: reasons || "gate FAIL (no details)",
              trigger: "gate post hook (auto)",
              timestamp: new Date().toISOString(),
            });
            saveIssueLog(logRoot, ctx.flowState?.spec, issueLog);
          } catch (e) { console.error("[gate issue-log hook]", e.message); }
        }
      },
      onError(ctx, err) {
        try {
          const logRoot = ctx.mainRoot || ctx.root;
          const issueLog = loadIssueLog(logRoot, ctx.flowState?.spec);
          issueLog.entries.push({
            step: resolveGateStepId(ctx.phase),
            reason: err.message || String(err),
            trigger: "gate onError hook (auto)",
            timestamp: new Date().toISOString(),
          });
          saveIssueLog(logRoot, ctx.flowState?.spec, issueLog);
        } catch (e) { console.error("[gate issue-log hook]", e.message); }
      },
    },
    review: {
      helpKey: "flow.run.review",
      pre: stepPre("review"),
      command: () => import("./lib/run-review.js"),
      args: {
        flags: ["--dry-run", "--skip-confirm"],
        options: ["--phase"],
      },
      help: [
        "Usage: sdd-forge flow run review [options]",
        "",
        "Run AI code review on current changes.",
        "",
        "Options:",
        "  --phase <type>   Review phase: 'test' for test sufficiency, 'spec' for spec completeness",
        "  --dry-run        Show proposals without applying",
        "  --skip-confirm   Skip initial confirmation prompt",
      ].join("\n"),
      post: stepPost("review"),
    },
    // impl-confirm is a read-only check, not the finalize action itself.
    // Step status is managed by the skill, not hooks.
    "impl-confirm": {
      helpKey: "flow.run.impl-confirm",
      command: () => import("./lib/run-impl-confirm.js"),
      args: { options: ["--mode"] },
      help: [
        "Usage: sdd-forge flow run impl-confirm [options]",
        "",
        "Check implementation readiness against requirements.",
        "",
        "Options:",
        "  --mode <overview|detail>  Check mode (default: overview)",
        "    overview: summarize requirements status from flow.json",
        "    detail:   also compare git diff against requirements",
      ].join("\n"),
    },
    // finalize runs cleanup internally which deletes .active-flow,
    // so post hooks cannot update step status. Managed by the skill.
    finalize: {
      helpKey: "flow.run.finalize",
      command: () => import("./lib/run-finalize.js"),
      args: {
        flags: ["--dry-run"],
        options: ["--mode", "--steps", "--merge-strategy", "--message"],
      },
      help: [
        "Usage: sdd-forge flow run finalize [options]",
        "",
        "Execute finalization pipeline: commit(+retro+report) -> merge -> sync -> cleanup.",
        "",
        "Options:",
        "  --mode <all|select>           Mode (required)",
        "  --steps <1,2,3,4>            Comma-separated step numbers (select mode: 1=commit 2=merge 3=sync 4=cleanup)",
        "  --merge-strategy <strategy>   squash or pr (default: auto-detect)",
        "  --message <msg>               Custom commit message",
        "  --dry-run                     Preview only",
      ].join("\n"),
      steps: {
        commit: {
          async post(ctx, result) {
            const m = await import("./lib/run-finalize.js");
            await m.executeCommitPost(ctx);
          },
          async onError(ctx, err) {
            const m = await import("./lib/run-finalize.js");
            m.finalizeOnError("commit")(ctx, err);
          },
        },
        merge: {
          async onError(ctx, err) {
            const m = await import("./lib/run-finalize.js");
            m.finalizeOnError("merge")(ctx, err);
          },
        },
        sync: {
          async onError(ctx, err) {
            const m = await import("./lib/run-finalize.js");
            m.finalizeOnError("sync")(ctx, err);
          },
        },
        cleanup: {
          async onError(ctx, err) {
            const m = await import("./lib/run-finalize.js");
            m.finalizeOnError("cleanup")(ctx, err);
          },
        },
      },
    },
    sync: {
      helpKey: "flow.run.sync",
      requiresFlow: false,
      command: () => import("./lib/run-sync.js"),
      args: { flags: ["--dry-run"] },
      help: [
        "Usage: sdd-forge flow run sync [options]",
        "",
        "Sync documentation: build -> review -> add -> commit.",
        "",
        "Options:",
        "  --dry-run   Preview only",
      ].join("\n"),
    },
    // lint is a sub-task of the implement phase; it does not exclusively own the step.
    // Step status is managed by the skill, not hooks.
    lint: {
      helpKey: "flow.run.lint",
      command: () => import("./lib/run-lint.js"),
      args: { options: ["--base"] },
      help: [
        "Usage: sdd-forge flow run lint [options]",
        "",
        "Check changed files against guardrail lint patterns.",
        "",
        "Options:",
        "  --base <branch>  Base branch for git diff (auto-resolved from flow.json)",
      ].join("\n"),
    },
    // retro is a post-flow analysis; it does not own the finalize step.
    retro: {
      helpKey: "flow.run.retro",
      command: () => import("./lib/run-retro.js"),
      args: { flags: ["--force", "--dry-run"] },
      help: [
        "Usage: sdd-forge flow run retro [options]",
        "",
        "Evaluate spec accuracy after implementation.",
        "Compares spec requirements against git diff and saves retro.json.",
        "",
        "Options:",
        "  --force     Overwrite existing retro.json",
        "  --dry-run   Preview only, do not write retro.json",
      ].join("\n"),
    },
    // report generates a work report from the current flow state.
    report: {
      helpKey: "flow.run.report",
      command: () => import("./lib/run-report.js"),
      args: { flags: ["--dry-run"] },
      help: [
        "Usage: sdd-forge flow run report [options]",
        "",
        "Generate a work report from the current flow state.",
        "",
        "Options:",
        "  --dry-run   Preview only, do not write report.json",
      ].join("\n"),
    },
  },
};
