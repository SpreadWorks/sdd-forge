/**
 * sdd-forge/lib/presets.js
 *
 * Auto-discovers presets from src/presets/{key}/preset.json.
 * All consumers derive their preset data from this single source.
 *
 * Preset hierarchy uses `parent` field for single-inheritance chains.
 * Multiple presets can be combined via type arrays in config.json.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createLogger } from "./progress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger("presets");
export const PRESETS_DIR = path.resolve(__dirname, "..", "presets");

/**
 * Discover all presets by scanning src/presets/{key}/preset.json.
 * Each preset gets: { key, dir, parent, label, aliases, scan, chapters }.
 */
function discoverPresets() {
  if (!fs.existsSync(PRESETS_DIR)) return [];

  return fs.readdirSync(PRESETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifestPath = path.join(PRESETS_DIR, d.name, "preset.json");
      if (!fs.existsSync(manifestPath)) return null;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      return {
        key: d.name,
        dir: path.join(PRESETS_DIR, d.name),
        parent: manifest.parent || null,
        label: manifest.label,
        aliases: manifest.aliases || [],
        scan: manifest.scan || {},
        chapters: manifest.chapters || [],
      };
    })
    .filter(Boolean);
}

export const PRESETS = discoverPresets();

/**
 * Build a project-local preset object from .sdd-forge/presets/<key>/.
 * Returns null if the directory does not exist.
 *
 * When preset.json is absent:
 * - If a built-in preset with the same key exists, inherit its settings (parent, scan,
 *   chapters) but use the project dir for DataSource loading.
 * - Otherwise, return a bare preset (no parent).
 *
 * @param {string} key
 * @param {string} root - project root (parent of .sdd-forge/)
 * @returns {Object|null}
 */
function resolveProjectPreset(key, root) {
  const projectDir = path.join(root, ".sdd-forge", "presets", key);
  if (!fs.existsSync(projectDir)) return null;

  const manifestPath = path.join(projectDir, "preset.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return {
      key,
      dir: projectDir,
      parent: manifest.parent || null,
      label: manifest.label || key,
      aliases: manifest.aliases || [],
      scan: manifest.scan || {},
      chapters: manifest.chapters || [],
    };
  }

  // preset.json omitted — inherit built-in settings if available
  const builtin = PRESETS.find((p) => p.key === key);
  if (builtin) {
    return { ...builtin, dir: projectDir };
  }

  // Bare preset: no parent, DataSource-only
  return { key, dir: projectDir, parent: null, label: key, aliases: [], scan: {}, chapters: [] };
}

/**
 * Resolve the full parent chain for a preset, from root (base) to the given leaf.
 *
 * When `projectRoot` is provided, `.sdd-forge/presets/<leafKey>/` is checked first.
 * If found, it takes precedence over the built-in preset of the same name.
 * Parent chain resolution always uses built-in presets (project presets are leaf-only).
 *
 * @param {string} leafKey - Preset key (e.g. "cakephp2", "node-cli", "webapp")
 * @param {string} [projectRoot] - Project root directory for .sdd-forge/presets/ lookup
 * @returns {Object[]} Array of preset objects, ordered root → leaf (e.g. [base, webapp, php-webapp, cakephp2])
 * @throws {Error} If preset not found or circular reference detected
 */
export function resolveChain(leafKey, projectRoot) {
  const preset = (projectRoot && resolveProjectPreset(leafKey, projectRoot))
    || PRESETS.find((p) => p.key === leafKey);
  if (!preset) {
    throw new Error(`Preset not found: ${leafKey}`);
  }

  const chain = [preset];
  const visited = new Set([leafKey]);
  let current = preset;

  while (current.parent) {
    if (visited.has(current.parent)) {
      throw new Error(`Circular parent reference detected: ${current.key} → ${current.parent}`);
    }
    const parentPreset = PRESETS.find((p) => p.key === current.parent);
    if (!parentPreset) {
      throw new Error(`Parent preset not found: ${current.parent} (referenced by ${current.key})`);
    }
    visited.add(current.parent);
    chain.unshift(parentPreset);
    current = parentPreset;
  }

  return chain;
}

/**
 * Resolve multiple type entries into independent chains.
 * Handles parent-child dedup: if both parent and child are in the list,
 * only the child's chain is kept (parent is already included).
 *
 * @param {string|string[]} types - Single preset name or array of preset names
 * @param {string} [projectRoot] - Project root directory for .sdd-forge/presets/ lookup
 * @returns {Object[][]} Array of chains, each chain is root → leaf ordered
 */
export function resolveMultiChains(types, projectRoot) {
  const typeList = Array.isArray(types) ? types : [types];

  // Deduplicate identical entries first
  const unique = [...new Set(typeList)];

  // Resolve each type into its full chain
  const chains = unique.map((t) => resolveChain(t, projectRoot));

  // Dedup: if one chain's leaf is an ancestor of another chain, keep only the longer one
  const result = [];
  for (let i = 0; i < chains.length; i++) {
    const leafKey = chains[i][chains[i].length - 1].key;
    let isSubset = false;

    for (let j = 0; j < chains.length; j++) {
      if (i === j) continue;
      if (chains[j].some((p) => p.key === leafKey) && chains[j].length > chains[i].length) {
        isSubset = true;
        break;
      }
    }

    if (!isSubset) {
      result.push(chains[i]);
    }
  }

  return result;
}

/**
 * Resolve the parent chain for a preset, with fallback for unknown presets.
 * Unlike resolveChain(), this never throws.
 *
 * @param {string} presetKey - Preset key (e.g. "cakephp2", "node-cli")
 * @param {string} [projectRoot] - Project root directory for .sdd-forge/presets/ lookup
 * @returns {Object[]} Array of preset objects, ordered root → leaf
 */
export function resolveChainSafe(presetKey, projectRoot) {
  try {
    return resolveChain(presetKey, projectRoot);
  } catch (err) {
    logger.verbose(`resolveChain failed for "${presetKey}": ${err.message}`);
    if (projectRoot) {
      const local = resolveProjectPreset(presetKey, projectRoot);
      if (local) return [local];
    }
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (preset) return [preset];
    const base = PRESETS.find((p) => p.key === "base");
    return base ? [base] : [];
  }
}

/**
 * Look up a preset by its leaf key (e.g. "cakephp2", "laravel").
 *
 * @param {string} leaf
 */
export function presetByLeaf(leaf) {
  return PRESETS.find((p) => p.key === leaf);
}

/**
 * Return presets whose parent is the given key.
 *
 * @param {string} parentKey - Parent preset key (e.g. "webapp", "cli")
 */
export function presetsForArch(parentKey) {
  return PRESETS.filter((p) => p.parent === parentKey);
}
