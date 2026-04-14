/**
 * src/lib/flow-state.js
 *
 * SDD フロー状態の永続化。
 * .sdd-forge/.active-flow (ポインタ) + specs/NNN/flow.json (実体) 方式。
 * flow-plan / flow-impl / flow-finalize / flow-sync 間の状態引き継ぎに使用。
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { runGit } from "./git-helpers.js";
import { sddDir } from "./config.js";
import { isInsideWorktree, getMainRepoPath } from "./cli.js";

const STATE_FILE = "flow.json";
const ACTIVE_FLOW_FILE = ".active-flow";
const PREPARING_PREFIX = ".active-flow.";
const PREPARING_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PREPARING_SCAN_LIMIT = 100;
const SCAN_FLOWS_LIMIT = 200;

/**
 * Extract the spec name (e.g. "152-add-logger-to-callsites") from a flow object or state.
 * Both `flow.spec` and `state.spec` hold a relative path like "specs/152-.../spec.md".
 *
 * @param {{ spec?: string }|null|undefined} flowOrState
 * @returns {string|null}
 */
export function getSpecName(flowOrState) {
  if (!flowOrState?.spec) return null;
  return path.basename(path.dirname(flowOrState.spec));
}

/** SDD workflow step IDs in order. */
export const FLOW_STEPS = [
  "approach", "branch", "prepare-spec", "draft", "gate-draft", "spec",
  "gate", "approval", "test", "implement", "gate-impl", "review", "finalize",
  "commit", "push", "merge", "pr-create", "branch-cleanup",
  "pr-merge", "sync-cleanup", "docs-update", "docs-review", "docs-commit",
];

/** Step ID → phase mapping. */
export const PHASE_MAP = {
  approach: "plan", branch: "plan", "prepare-spec": "plan", draft: "plan",
  "gate-draft": "plan", spec: "plan", gate: "plan", approval: "plan", test: "plan",
  implement: "impl", "gate-impl": "impl", review: "impl", finalize: "impl",
  commit: "finalize", push: "finalize", merge: "finalize",
  "pr-create": "finalize", "branch-cleanup": "finalize",
  "pr-merge": "sync", "sync-cleanup": "sync",
  "docs-update": "sync", "docs-review": "sync", "docs-commit": "sync",
};

/**
 * Derive current phase from steps.
 * Returns the phase of the first in_progress step,
 * or the phase after the last done/skipped step.
 * @param {StepEntry[]} [steps]
 * @returns {"plan"|"impl"|"finalize"|"sync"}
 */
export function derivePhase(steps) {
  if (!steps?.length) return "plan";
  const inProgress = steps.find((s) => s.status === "in_progress" && PHASE_MAP[s.id]);
  if (inProgress) return PHASE_MAP[inProgress.id];
  let lastDone = null;
  for (const s of steps) {
    if ((s.status === "done" || s.status === "skipped") && PHASE_MAP[s.id]) lastDone = s;
  }
  if (!lastDone) return "plan";
  return PHASE_MAP[lastDone.id];
}

/**
 * @typedef {Object} StepEntry
 * @property {string} id     - step ID (one of FLOW_STEPS)
 * @property {"pending"|"in_progress"|"done"|"skipped"} status
 */

/**
 * @typedef {Object} RequirementEntry
 * @property {string} desc   - requirement description
 * @property {"pending"|"in_progress"|"done"} status
 */

/**
 * @typedef {Object} FlowState
 * @property {string} spec          - spec.md の相対パス (e.g. "specs/003-xxx/spec.md")
 * @property {string} baseBranch    - 分岐元ブランチ名
 * @property {string} featureBranch - feature ブランチ名
 * @property {boolean} [worktree]      - worktree モードかどうか
 * @property {string}  [request]        - ユーザーの元のリクエスト
 * @property {string[]} [notes]         - 選択肢結果・メモの配列
 * @property {StepEntry[]} [steps]          - workflow step tracking
 * @property {RequirementEntry[]} [requirements] - spec requirements tracking
 * @property {number|null} [issue]      - 紐付く GitHub Issue 番号
 * @property {"squash"|"pr"|null} [mergeStrategy] - finalize 時に記録されるマージ方式
 * @property {boolean} [autoApprove] - autoApprove モード（true の場合 AI が選択肢を自動選択して進む）
 */

/**
 * @typedef {Object} ActiveFlowEntry
 * @property {string} spec - spec ID (e.g. "086-migrate-flow-state")
 * @property {"worktree"|"branch"|"local"} mode
 */

// ── .active-flow pointer ────────────────────────────────────────────────────

function activeFlowPath(mainRoot) {
  return path.join(sddDir(mainRoot), ACTIVE_FLOW_FILE);
}

/**
 * Resolve the main repo root from any working directory.
 * If inside a worktree, resolves to the main repo.
 * Otherwise returns workRoot as-is.
 */
function resolveMainRoot(workRoot) {
  if (isInsideWorktree(workRoot)) {
    return getMainRepoPath(workRoot);
  }
  return workRoot;
}

/**
 * Load all active flow entries from .active-flow.
 * @param {string} workRoot
 * @returns {ActiveFlowEntry[]}
 */
export function loadActiveFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const p = activeFlowPath(mainRoot);
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`[flow-state] WARN: failed to parse .active-flow (${p}): ${err.message}`);
    }
    return [];
  }
}

/**
 * Add an active flow entry to .active-flow.
 * @param {string} workRoot
 * @param {string} specId
 * @param {"worktree"|"branch"|"local"} mode
 */
export function addActiveFlow(workRoot, specId, mode) {
  const mainRoot = resolveMainRoot(workRoot);
  const flows = loadActiveFlows(mainRoot);
  if (flows.some((f) => f.spec === specId)) return;
  flows.push({ spec: specId, mode });
  const p = activeFlowPath(mainRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(flows, null, 2) + "\n", "utf8");
}

/**
 * Remove an active flow entry from .active-flow.
 * Deletes the file if no entries remain.
 * @param {string} workRoot
 * @param {string} specId
 */
export function removeActiveFlow(workRoot, specId) {
  const mainRoot = resolveMainRoot(workRoot);
  const flows = loadActiveFlows(mainRoot);
  const filtered = flows.filter((f) => f.spec !== specId);
  const p = activeFlowPath(mainRoot);
  if (filtered.length === 0) {
    try { fs.unlinkSync(p); } catch (err) { if (err.code !== "ENOENT") console.error(err); }
    return;
  }
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + "\n", "utf8");
}

// ── stale detection ─────────────────────────────────────────────────────────

/**
 * Check if a git worktree exists for the given branch.
 * @param {string} mainRoot
 * @param {string} branch
 * @returns {boolean}
 */
/**
 * Run a git query and apply a stdout predicate; on git failure, log to stderr
 * and return `true` (fail-open: prevents accidental deletion when status is unknown).
 * @param {string[]} args - git arguments
 * @param {(stdout: string) => boolean} predicate
 * @param {string} contextLabel - label used in the stderr warning
 * @returns {boolean}
 */
function runGitFailOpenBoolean(args, predicate, contextLabel) {
  const res = runGit(args);
  if (!res.ok) {
    process.stderr.write(`[sdd-forge] ${contextLabel}: git ${args.join(" ")} failed, assuming exists: ${res.stderr}\n`);
    return true;
  }
  return predicate(res.stdout);
}

function worktreeExists(mainRoot, branch) {
  return runGitFailOpenBoolean(
    ["-C", mainRoot, "worktree", "list", "--porcelain"],
    (stdout) => stdout.includes(`branch refs/heads/${branch}`),
    "worktreeExists",
  );
}

/**
 * Check if a git branch exists.
 * @param {string} mainRoot
 * @param {string} branch
 * @returns {boolean}
 */
function branchExists(mainRoot, branch) {
  return runGitFailOpenBoolean(
    ["-C", mainRoot, "branch", "--list", branch],
    (stdout) => stdout.trim().length > 0,
    "branchExists",
  );
}

/**
 * Remove stale entries from .active-flow.
 * Returns cleaned active flows.
 * @param {string} workRoot
 * @returns {ActiveFlowEntry[]}
 */
export function cleanStaleFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const flows = loadActiveFlows(mainRoot);
  if (flows.length === 0) return [];

  const valid = [];
  for (const entry of flows) {
    const branch = `feature/${entry.spec}`;
    let isStale = false;

    if (entry.mode === "worktree") {
      isStale = !worktreeExists(mainRoot, branch);
    } else if (entry.mode === "branch") {
      isStale = !branchExists(mainRoot, branch);
    } else {
      // local mode: check if flow.json exists on disk in main repo
      isStale = !fs.existsSync(path.join(mainRoot, "specs", entry.spec, STATE_FILE));
    }

    if (!isStale) valid.push(entry);
  }

  if (valid.length !== flows.length) {
    const p = activeFlowPath(mainRoot);
    if (valid.length === 0) {
      try { fs.unlinkSync(p); } catch (err) { if (err.code !== "ENOENT") console.error(err); }
    } else {
      fs.writeFileSync(p, JSON.stringify(valid, null, 2) + "\n", "utf8");
    }
  }

  return valid;
}

// ── preparing state files (.active-flow.<runId>) ────────────────────────────

/**
 * Generate a new runId.
 * @returns {string}
 */
export function generateRunId() {
  return crypto.randomUUID();
}

/**
 * Create a preparing state file (.active-flow.<runId>).
 * @param {string} workRoot
 * @param {string} runId
 * @param {object} [extra] - additional fields to merge
 * @returns {string} path to the created file
 */
export function createPreparingFlow(workRoot, runId, extra = {}) {
  const mainRoot = resolveMainRoot(workRoot);
  const dir = sddDir(mainRoot);
  fs.mkdirSync(dir, { recursive: true });
  const state = {
    runId,
    lifecycle: "preparing",
    spec: null,
    baseBranch: null,
    featureBranch: null,
    worktree: null,
    steps: buildInitialSteps(),
    requirements: [],
    autoApprove: false,
    ...extra,
  };
  const p = path.join(dir, `${PREPARING_PREFIX}${runId}`);
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf8");
  return p;
}

/**
 * Load a preparing state file by runId.
 * @param {string} workRoot
 * @param {string} runId
 * @returns {object|null}
 */
export function loadPreparingFlow(workRoot, runId) {
  const mainRoot = resolveMainRoot(workRoot);
  const p = path.join(sddDir(mainRoot), `${PREPARING_PREFIX}${runId}`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    console.error(`[flow-state] WARN: failed to read preparing flow ${runId}: ${err.message}`);
    return null;
  }
}

/**
 * Delete a preparing state file by runId.
 * @param {string} workRoot
 * @param {string} runId
 */
export function deletePreparingFlow(workRoot, runId) {
  const mainRoot = resolveMainRoot(workRoot);
  const p = path.join(sddDir(mainRoot), `${PREPARING_PREFIX}${runId}`);
  try { fs.unlinkSync(p); } catch (err) { if (err.code !== "ENOENT") throw err; }
}

/**
 * List existing preparing state files.
 * @param {string} workRoot
 * @returns {string[]} array of runIds
 */
export function listPreparingFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const dir = sddDir(mainRoot);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.startsWith(PREPARING_PREFIX))
    .map((f) => f.slice(PREPARING_PREFIX.length))
    .slice(0, PREPARING_SCAN_LIMIT);
}

/**
 * Remove stale preparing files (mtime > TTL).
 * @param {string} workRoot
 * @returns {string[]} deleted runIds
 */
export function cleanStalePreparingFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const dir = sddDir(mainRoot);
  if (!fs.existsSync(dir)) return [];

  const now = Date.now();
  const deleted = [];
  const entries = fs.readdirSync(dir)
    .filter((f) => f.startsWith(PREPARING_PREFIX))
    .slice(0, PREPARING_SCAN_LIMIT);

  for (const f of entries) {
    const p = path.join(dir, f);
    try {
      const stat = fs.statSync(p);
      if (now - stat.mtimeMs > PREPARING_TTL_MS) {
        fs.unlinkSync(p);
        deleted.push(f.slice(PREPARING_PREFIX.length));
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(`[flow-state] WARN: stale cleanup failed for ${f}: ${err.message}`);
      }
    }
  }
  return deleted;
}

// ── spec ID helpers ─────────────────────────────────────────────────────────

/**
 * Extract spec ID from spec path.
 * e.g. "specs/086-migrate-flow-state/spec.md" → "086-migrate-flow-state"
 * @param {string} specPath
 * @returns {string}
 */
export function specIdFromPath(specPath) {
  const parts = specPath.replace(/\\/g, "/").split("/");
  const idx = parts.indexOf("specs");
  if (idx >= 0 && idx + 1 < parts.length) return parts[idx + 1];
  return parts[0];
}

// ── flow.json in specs/NNN/ ─────────────────────────────────────────────────

/**
 * Resolve the flow.json path for a given spec ID.
 * @param {string} workRoot
 * @param {string} specId
 * @returns {string}
 */
function specFlowPath(workRoot, specId) {
  return path.join(workRoot, "specs", specId, STATE_FILE);
}

/**
 * Resolve which spec ID is "current" based on context.
 * 1. If inside a worktree, match by current branch name.
 * 2. If on a feature branch, match by branch name.
 * 3. If only one active flow, use that.
 * @param {string} workRoot
 * @param {ActiveFlowEntry[]} flows
 * @returns {ActiveFlowEntry|null}
 */
function resolveCurrentFlow(workRoot, flows) {
  if (flows.length === 0) return null;
  if (flows.length === 1) return flows[0];

  // Try matching by current branch
  let currentBranch;
  const res = runGit(["-C", workRoot, "rev-parse", "--abbrev-ref", "HEAD"]);
  if (!res.ok) return null;
  currentBranch = res.stdout.trim();

  // Match feature/<spec-id>
  for (const entry of flows) {
    if (currentBranch === `feature/${entry.spec}`) return entry;
  }

  return null;
}

/**
 * Build initial steps array with all steps set to "pending".
 * @returns {StepEntry[]}
 */
export function buildInitialSteps() {
  return FLOW_STEPS.map((id) => ({ id, status: "pending" }));
}

/**
 * flow.json を specs/NNN/ に書き込む。
 * spec フィールドから spec ID を導出する。
 * @param {string} workRoot
 * @param {FlowState} state
 */
export function saveFlowState(workRoot, state) {
  const specId = specIdFromPath(state.spec);
  const p = specFlowPath(workRoot, specId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

/**
 * flow.json を読み込む。存在しなければ null。
 *
 * Worktree 内の場合は branch 名から spec ID を導出し、
 * .active-flow を経由せず直接 specs/NNN/flow.json を読む。
 *
 * @param {string} workRoot
 * @param {string} [specId] - 明示的に spec ID を指定する場合
 * @returns {FlowState|null}
 */
export function loadFlowState(workRoot, specId) {
  let state = null;
  let resolvedPath = null;

  if (specId) {
    const p = specFlowPath(workRoot, specId);
    if (!fs.existsSync(p)) return null;
    state = JSON.parse(fs.readFileSync(p, "utf8"));
    resolvedPath = p;
  } else if (isInsideWorktree(workRoot)) {
    // Worktree shortcut: derive spec ID from branch name directly
    const id = specIdFromBranch(workRoot);
    if (id) {
      const p = specFlowPath(workRoot, id);
      if (fs.existsSync(p)) {
        state = JSON.parse(fs.readFileSync(p, "utf8"));
        resolvedPath = p;
      }
    }
  }

  if (!state) {
    const flows = loadActiveFlows(workRoot);
    const current = resolveCurrentFlow(workRoot, flows);
    if (!current) return null;
    const p = specFlowPath(workRoot, current.spec);
    if (!fs.existsSync(p)) return null;
    state = JSON.parse(fs.readFileSync(p, "utf8"));
    resolvedPath = p;
  }

  // Transparent migration: auto-assign runId if missing
  if (state && !state.runId) {
    state.runId = generateRunId();
    try {
      fs.writeFileSync(resolvedPath, JSON.stringify(state, null, 2) + "\n", "utf8");
    } catch (err) {
      console.error(`[flow-state] WARN: failed to persist migrated runId: ${err.message}`);
    }
  }

  return state;
}

/**
 * Derive spec ID from the current branch name inside a worktree.
 * Branch format: feature/<spec-id>
 * @param {string} workRoot
 * @returns {string|null}
 */
function specIdFromBranch(workRoot) {
  const res = runGit(["-C", workRoot, "rev-parse", "--abbrev-ref", "HEAD"]);
  if (!res.ok) return null;
  const branch = res.stdout.trim();
  const prefix = "feature/";
  if (branch.startsWith(prefix)) return branch.slice(prefix.length);
  return null;
}

/**
 * .active-flow からエントリを削除する。flow.json 自体は残す。
 * @param {string} workRoot
 * @param {string} [specId] - 省略時はコンテキストから判別
 */
export function clearFlowState(workRoot, specId) {
  if (!specId) {
    const flows = loadActiveFlows(workRoot);
    const current = resolveCurrentFlow(workRoot, flows);
    if (!current) return;
    specId = current.spec;
  }
  removeActiveFlow(workRoot, specId);
}

/**
 * Load flow.json, apply a mutation, and save.
 * @param {string} workRoot
 * @param {(state: FlowState) => void} mutator
 */
export function mutateFlowState(workRoot, mutator) {
  const state = loadFlowState(workRoot);
  if (!state) throw new Error("no active flow (flow.json not found)");
  mutator(state);
  saveFlowState(workRoot, state);
}

/**
 * Accumulate agent invocation metrics into flow.json.
 * Called after each agent invocation completes during an active SDD flow.
 * Silently no-ops when phase is null (outside any flow).
 * On write failure, logs to stderr but does not throw (non-fatal per R1-4).
 *
 * @param {string} workRoot
 * @param {string|null} phase - current SDD step id (e.g. "draft", "impl"); null = skip
 * @param {object|null} usage - normalized usage from agent.js: { input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd }
 * @param {number} responseChars - character count of the agent response
 * @param {string|null} model - model identifier (e.g. "claude-sonnet-4-6")
 */
export function accumulateAgentMetrics(workRoot, phase, usage, responseChars, model) {
  if (!phase) return; // R1-2: skip when no active flow
  try {
    mutateFlowState(workRoot, (state) => {
      if (!state.metrics) state.metrics = {};
      if (!state.metrics[phase]) state.metrics[phase] = {};
      const m = state.metrics[phase];

      // tokens
      if (usage) {
        if (!m.tokens) m.tokens = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
        m.tokens.input = (m.tokens.input || 0) + (usage.input_tokens || 0);
        m.tokens.output = (m.tokens.output || 0) + (usage.output_tokens || 0);
        m.tokens.cacheRead = (m.tokens.cacheRead || 0) + (usage.cache_read_tokens || 0);
        m.tokens.cacheCreation = (m.tokens.cacheCreation || 0) + (usage.cache_creation_tokens || 0);
        // R1-3: skip cost when cost_usd is null
        if (usage.cost_usd != null) {
          m.cost = (m.cost || 0) + usage.cost_usd;
        }
      }

      // callCount and responseChars are always recorded
      m.callCount = (m.callCount || 0) + 1;
      m.responseChars = (m.responseChars || 0) + (responseChars || 0);

      // model call count (for post-hoc cost calculation when cost_usd is null)
      if (model) {
        if (!m.models) m.models = {};
        m.models[model] = (m.models[model] || 0) + 1;
      }
    });
  } catch (err) {
    // R1-4: non-fatal — log to stderr, do not throw
    process.stderr.write(`[sdd-forge] failed to accumulate agent metrics: ${err.message}\n`);
  }
}

/**
 * Increment a metric counter in flow.json.
 * Silently no-ops if no active flow exists (e.g. outside a flow).
 * @param {string} workRoot
 * @param {string} phase - e.g. "plan", "impl"
 * @param {string} counter - e.g. "docsRead", "srcRead"
 */
export function incrementMetric(workRoot, phase, counter) {
  if (!phase) return;
  try {
    mutateFlowState(workRoot, (state) => {
      if (!state.metrics) state.metrics = {};
      if (!state.metrics[phase]) state.metrics[phase] = {};
      state.metrics[phase][counter] = (state.metrics[phase][counter] || 0) + 1;
    });
  } catch (_) {
    // flow.json may not exist outside a flow
  }
}

/**
 * Update a single step's status.
 * @param {string} workRoot
 * @param {string} stepId
 * @param {string} status
 */
export function updateStepStatus(workRoot, stepId, status) {
  mutateFlowState(workRoot, (state) => {
    if (!state.steps) throw new Error("flow.json has no steps");
    const step = state.steps.find((s) => s.id === stepId);
    if (!step) throw new Error(`unknown step: ${stepId}`);
    step.status = status;
  });
}

/**
 * Set requirements list (replaces existing).
 * @param {string} workRoot
 * @param {string[]} descriptions - array of requirement descriptions
 */
export function setRequirements(workRoot, descriptions) {
  mutateFlowState(workRoot, (state) => {
    state.requirements = descriptions.map((desc) => ({ desc, status: "pending" }));
  });
}

/**
 * Set test summary counts in flow.json under test.summary.
 * Replaces existing test.summary entirely.
 * @param {string} workRoot
 * @param {{ [type: string]: number }} summary
 */
export function setTestSummary(workRoot, summary) {
  mutateFlowState(workRoot, (state) => {
    if (!state.test) state.test = {};
    state.test.summary = summary;
  });
}

/**
 * Update a single requirement's status.
 * @param {string} workRoot
 * @param {number} index
 * @param {string} status
 */
export function updateRequirement(workRoot, index, status) {
  mutateFlowState(workRoot, (state) => {
    if (!state.requirements?.[index]) throw new Error(`requirement index out of range: ${index}`);
    state.requirements[index].status = status;
  });
}

/**
 * Set the request field in flow.json.
 * @param {string} workRoot
 * @param {string} text
 */
export function setRequest(workRoot, text) {
  mutateFlowState(workRoot, (state) => {
    state.request = text;
  });
}

/**
 * Set the issue number in flow.json.
 * @param {string} workRoot
 * @param {number} issue - GitHub Issue number
 */
export function setIssue(workRoot, issue) {
  mutateFlowState(workRoot, (state) => {
    state.issue = issue;
  });
}

/**
 * Append a note to the notes array in flow.json.
 * @param {string} workRoot
 * @param {string} text
 */
export function addNote(workRoot, text) {
  mutateFlowState(workRoot, (state) => {
    if (!state.notes) state.notes = [];
    state.notes.push(text);
  });
}

/**
 * flow.json のパスを返す。
 * .active-flow からコンテキストに対応する spec ID を解決し、specs/NNN/flow.json を返す。
 * @param {string} workRoot
 * @returns {string|null}
 */
export function flowStatePath(workRoot) {
  const flows = loadActiveFlows(workRoot);
  const current = resolveCurrentFlow(workRoot, flows);
  if (!current) return null;
  return specFlowPath(workRoot, current.spec);
}

/**
 * worktree モードのパスを実行時に算出する。
 * flow.json には絶対パスを保存せず、featureBranch から導出する。
 *
 * @param {string} root - 現在の作業ディレクトリ (repoRoot())
 * @param {FlowState} state - flow.json の内容
 * @returns {{ worktreePath: string|null, mainRepoPath: string|null }}
 */
export function resolveWorktreePaths(root, state) {
  if (!state.worktree) return { worktreePath: null, mainRepoPath: null };

  if (isInsideWorktree(root)) {
    return {
      worktreePath: root,
      mainRepoPath: getMainRepoPath(root),
    };
  }

  // main repo にいる場合: featureBranch から worktree パスを算出
  const dirName = state.featureBranch.replace(/\//g, "-");
  return {
    worktreePath: path.join(sddDir(root), "worktree", dirName),
    mainRepoPath: root,
  };
}

// ── scan all flows ──────────────────────────────────────────────────────────

/**
 * Scan all flow.json files across worktrees, branches, and local specs.
 * Returns an array of { specId, mode, state, location }.
 * @param {string} workRoot
 * @returns {Array<{specId: string, mode: string|null, state: FlowState, location: string}>}
 */
export function scanAllFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const results = [];
  const seen = new Set();
  let truncated = false;

  // 1. Local: specs/*/ in main repo (with or without flow.json)
  const specsDir = path.join(mainRoot, "specs");
  if (fs.existsSync(specsDir)) {
    for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^\d{3}-/.test(entry.name)) continue;
      if (results.length >= SCAN_FLOWS_LIMIT) { truncated = true; break; }
      const fp = path.join(specsDir, entry.name, STATE_FILE);
      if (fs.existsSync(fp)) {
        const state = JSON.parse(fs.readFileSync(fp, "utf8"));
        const mode = state.worktree ? "worktree" : (state.featureBranch && state.featureBranch !== state.baseBranch) ? "branch" : "local";
        results.push({ specId: entry.name, mode, state, location: mainRoot });
      } else {
        results.push({ specId: entry.name, mode: null, state: null, location: mainRoot });
      }
      seen.add(entry.name);
    }
  }

  // 2. Worktrees: scan each worktree's specs/*/flow.json
  if (!truncated) {
    const wtRes = runGit(["-C", mainRoot, "worktree", "list", "--porcelain"]);
    if (wtRes.ok) {
      const output = wtRes.stdout;
      let wtPath = null;
      outer: for (const line of output.split("\n")) {
        if (line.startsWith("worktree ")) {
          wtPath = line.slice("worktree ".length);
        } else if (line === "" && wtPath && wtPath !== mainRoot) {
          const wtSpecs = path.join(wtPath, "specs");
          if (fs.existsSync(wtSpecs)) {
            for (const entry of fs.readdirSync(wtSpecs, { withFileTypes: true })) {
              if (!entry.isDirectory() || seen.has(entry.name)) continue;
              if (results.length >= SCAN_FLOWS_LIMIT) { truncated = true; break outer; }
              const fp = path.join(wtSpecs, entry.name, STATE_FILE);
              if (fs.existsSync(fp)) {
                const state = JSON.parse(fs.readFileSync(fp, "utf8"));
                results.push({ specId: entry.name, mode: "worktree", state, location: wtPath });
                seen.add(entry.name);
              }
            }
          }
          wtPath = null;
        }
      }
    }
  }

  // 3. Branches: check feature/* branches for specs/*/flow.json
  if (!truncated) {
    const branchRes = runGit(["-C", mainRoot, "branch", "--list", "feature/*"]);
    if (branchRes.ok) {
      for (const line of branchRes.stdout.split("\n")) {
        const branch = line.replace(/^[*+ ]+/, "").trim();
        if (!branch) continue;
        const specId = branch.replace("feature/", "");
        if (seen.has(specId)) continue;
        if (results.length >= SCAN_FLOWS_LIMIT) { truncated = true; break; }
        const showRes = runGit(
          ["-C", mainRoot, "show", `${branch}:specs/${specId}/flow.json`],
        );
        if (showRes.ok) {
          try {
            const state = JSON.parse(showRes.stdout);
            results.push({ specId, mode: "branch", state, location: `branch:${branch}` });
            seen.add(specId);
          } catch (e) {
            process.stderr.write(`[sdd-forge] scanAllFlows: invalid JSON in ${branch}:specs/${specId}/flow.json: ${e.message}\n`);
          }
        }
      }
    }
  }

  if (truncated) {
    process.stderr.write(`[sdd-forge] scanAllFlows: truncated at ${SCAN_FLOWS_LIMIT} entries\n`);
  }

  return results;
}

// ── resolve active flow (shared helper) ─────────────────────────────────────

/**
 * 3-stage fallback to resolve the single active flow.
 *
 * 1. flowState (already loaded by dispatcher)
 * 2. loadActiveFlows → single entry
 * 3. scanAllFlows → filter entries with active state
 *
 * @param {string} root - repoRoot()
 * @param {FlowState|null} flowState - pre-loaded flow state (may be null)
 * @returns {{ state: FlowState, specId: string, worktreePath: string|null } | null}
 */
export function resolveActiveFlow(root, flowState) {
  // Stage 1: use pre-loaded flowState
  if (flowState) {
    const specId = specIdFromPath(flowState.spec);
    let worktreePath = null;
    if (flowState.worktree) {
      worktreePath = resolveWorktreePaths(root, flowState).worktreePath;
    }
    return { state: flowState, specId, worktreePath };
  }

  // Stage 2: loadActiveFlows
  const activeFlows = loadActiveFlows(root);
  if (activeFlows.length === 1) {
    const specId = activeFlows[0].spec;
    let state = loadFlowState(root, specId);
    let worktreePath = null;
    if (state?.worktree) {
      const resolved = resolveWorktreePaths(root, state);
      worktreePath = resolved.worktreePath;
      if (worktreePath && fs.existsSync(worktreePath)) {
        state = loadFlowState(worktreePath, specId);
      }
    }
    if (state) return { state, specId, worktreePath };
  } else if (activeFlows.length > 1) {
    throw new Error(
      `multiple active flows: ${activeFlows.map((f) => `${f.spec} (${f.mode})`).join(", ")}`
    );
  }

  // Stage 3: scanAllFlows
  const allFlows = scanAllFlows(root);
  const active = allFlows.filter((f) => f.state != null);
  if (active.length === 1) {
    const { specId, state, location } = active[0];
    const worktreePath = state.worktree ? location : null;
    return { state, specId, worktreePath };
  } else if (active.length > 1) {
    throw new Error(
      `multiple active flows: ${active.map((f) => `${f.specId} (${f.mode})`).join(", ")}`
    );
  }

  return null;
}

/**
 * Read-only flow.json loader. Does NOT trigger transparent migration.
 * Use this for resolution/lookup paths where side effects are undesirable.
 * @param {string} workRoot
 * @param {string} specId
 * @returns {object|null}
 */
function loadFlowStateReadOnly(workRoot, specId) {
  const p = specFlowPath(workRoot, specId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Resolve flow state by runId.
 * 1. Scan active flows' flow.json for matching runId (max PREPARING_SCAN_LIMIT entries)
 * 2. Fall back to .active-flow.<runId> file
 * 3. Return null if not found
 *
 * Uses read-only loader to avoid triggering transparent migration as a side effect.
 *
 * @param {string} workRoot
 * @param {string} runId
 * @returns {object|null} flow state object
 */
export function resolveByRunId(workRoot, runId) {
  // Stage 1: check active flows (read-only — no migration side effects)
  const activeFlows = loadActiveFlows(workRoot);
  const limit = Math.min(activeFlows.length, PREPARING_SCAN_LIMIT);
  for (let i = 0; i < limit; i++) {
    const state = loadFlowStateReadOnly(workRoot, activeFlows[i].spec);
    if (state?.runId === runId) return state;
  }

  // Stage 2: check preparing file
  const preparing = loadPreparingFlow(workRoot, runId);
  if (preparing) return preparing;

  // Stage 3: not found
  return null;
}
