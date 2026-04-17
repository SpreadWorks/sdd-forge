/**
 * src/lib/container.js
 *
 * Dependency container for CLI-wide initialized services (config, logger, paths,
 * agent, i18n, flowManager, etc.). Built once in src/sdd-forge.js and
 * referenced by all dispatchers and commands via the module-level `container`
 * export.
 */

import path from "path";
import { repoRoot, sourceRoot, isInsideWorktree, getMainRepoPath } from "./cli.js";
import { loadConfig, sddConfigPath, sddDir, sddOutputDir, resolveWorkDir } from "./config.js";
import { Logger } from "./log.js";
import { Agent } from "./agent.js";
import { ProviderRegistry } from "./provider.js";
import { translate } from "./i18n.js";
import { FlowManager } from "./flow-manager.js";

export class Container {
  constructor() {
    this._map = new Map();
  }

  register(name, value) {
    this._map.set(name, value);
  }

  get(name) {
    if (!this._map.has(name)) {
      throw new Error(`Container: dependency not registered: ${name}`);
    }
    return this._map.get(name);
  }

  has(name) {
    return this._map.has(name);
  }

  reset() {
    this._map.clear();
  }
}

export const container = new Container();

/**
 * Build path service object. All fields are absolute paths.
 *
 * Work-directory priority: SDD_FORGE_WORK_DIR env > config.agent.workDir > .tmp
 */
function buildPaths(root, config) {
  const agentWorkDir = resolveWorkDir(root, config);
  return Object.freeze({
    root,
    srcRoot: sourceRoot(),
    sddDir: sddDir(root),
    outputDir: sddOutputDir(root),
    agentWorkDir,
    logDir: path.join(agentWorkDir, "logs"),
    configPath: sddConfigPath(root),
  });
}

/**
 * Initialize the module-level container. Called once from src/sdd-forge.js.
 * Subsequent dispatchers and commands import `container` directly.
 *
 * Best-effort initialization: if config is absent (setup not run yet, help-only
 * invocation, etc.), an empty config object is registered and Logger init is
 * skipped so that commands that do not require config (help, setup, etc.) can
 * still start. Commands that require config detect its absence downstream.
 *
 * @param {Object} [opts]
 * @param {string} [opts.entryCommand] - Full argv string for Logger metadata
 */
export function initContainer(opts = {}) {
  // Idempotent: if already initialized (e.g. by sdd-forge.js before a
  // dispatcher was imported), do not re-run initialization. This lets
  // each dispatcher safely call initContainer() at its top to support
  // standalone execution (direct `node src/flow.js` invocation in tests)
  // without violating R1's one-time-initialization invariant.
  if (container.has("config")) return;

  const root = repoRoot();
  let config = {};
  let configLoaded = false;
  try {
    config = loadConfig(root);
    configLoaded = true;
  } catch (err) {
    if (err?.code !== "ERR_MISSING_FILE") {
      process.stderr.write(`[sdd-forge] config load failed: ${err?.message}\n`);
    }
  }

  const paths = buildPaths(root, config);

  const logger = Logger.getInstance();
  if (configLoaded) {
    logger.init(root, config, { entryCommand: opts.entryCommand });
    logger.event("config-loaded", { path: paths.configPath, keys: Object.keys(config) });
  }

  container.register("root", root);
  container.register("config", config);
  container.register("paths", paths);
  container.register("logger", logger);
  const inWorktree = isInsideWorktree(root);
  const mainRoot = inWorktree ? getMainRepoPath(root) : root;
  container.register("inWorktree", inWorktree);
  container.register("mainRoot", mainRoot);
  const flowManager = new FlowManager({ root, mainRoot, inWorktree });
  container.register("flowManager", flowManager);
  const registry = new ProviderRegistry(config?.agent?.providers || {});
  container.register("agent", new Agent({ config, paths, registry, logger }));
  container.register("i18n", translate());
  container.register("lang", config?.lang);
}
