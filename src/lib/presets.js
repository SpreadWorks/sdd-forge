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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
 * Resolve the full parent chain for a preset, from root (base) to the given leaf.
 *
 * @param {string} leafKey - Preset key (e.g. "cakephp2", "node-cli", "webapp")
 * @returns {Object[]} Array of preset objects, ordered root → leaf (e.g. [base, webapp, php-webapp, cakephp2])
 * @throws {Error} If preset not found or circular reference detected
 */
export function resolveChain(leafKey) {
  const preset = PRESETS.find((p) => p.key === leafKey);
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
 * @returns {Object[][]} Array of chains, each chain is root → leaf ordered
 */
export function resolveMultiChains(types) {
  const typeList = Array.isArray(types) ? types : [types];

  // Deduplicate identical entries first
  const unique = [...new Set(typeList)];

  // Resolve each type into its full chain
  const chains = unique.map((t) => resolveChain(t));

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
 * @returns {Object[]} Array of preset objects, ordered root → leaf
 */
export function resolveChainSafe(presetKey) {
  try {
    return resolveChain(presetKey);
  } catch (_) {
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
