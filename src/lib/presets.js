/**
 * sdd-forge/lib/presets.js
 *
 * Auto-discovers presets from src/presets/{key}/preset.json.
 * All consumers derive their preset data from this single source.
 *
 * Preset hierarchy uses `parent` field for variable-length inheritance chains.
 * Legacy `arch` field is supported for backward compatibility.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRESETS_DIR = path.resolve(__dirname, "..", "presets");

/**
 * Discover all presets by scanning src/presets/{key}/preset.json.
 * Each preset gets: { key, dir, parent, arch, lang, axis, label, aliases, scan, type, isArch, chapters }.
 *
 * `parent` is the primary hierarchy field. `arch` is derived for backward compatibility.
 */
function discoverPresets() {
  if (!fs.existsSync(PRESETS_DIR)) return [];

  return fs.readdirSync(PRESETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifestPath = path.join(PRESETS_DIR, d.name, "preset.json");
      if (!fs.existsSync(manifestPath)) return null;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      // parent field (new) takes precedence over arch (legacy)
      const parent = manifest.parent || null;

      // Derive arch for backward compatibility:
      // - base has no parent → arch = "base"
      // - presets with parent "base" that have children → they ARE arch-level (cli, webapp, library)
      // - leaf presets → arch = first non-lang ancestor, or parent
      const arch = manifest.arch || parent || (d.name === "base" ? "base" : null);

      // isArch: true for structural presets (base, cli, webapp, library) and lang presets (php, node)
      const isArch = !parent || parent === "base";

      // Type path: arch-level presets use their key, leaf presets use parent/key
      // For parent-chain presets, find the nearest arch ancestor for type path
      let type;
      if (isArch) {
        type = d.name;
      } else {
        // Walk up to find the arch-level ancestor for type path
        type = `${parent}/${d.name}`;
      }

      return {
        key: d.name,
        type,
        dir: path.join(PRESETS_DIR, d.name),
        parent,
        arch,
        lang: manifest.lang || null,
        axis: manifest.axis || null,
        label: manifest.label,
        aliases: manifest.aliases || [],
        scan: manifest.scan || {},
        chapters: manifest.chapters || [],
        isArch,
      };
    })
    .filter(Boolean);
}

export const PRESETS = discoverPresets();

/**
 * Resolve the full parent chain for a preset, from root (base) to the given leaf.
 *
 * @param {string} leafKey - Preset key (e.g. "cakephp2", "node-cli", "webapp")
 * @returns {Object[]} Array of preset objects, ordered root → leaf (e.g. [base, webapp, cakephp2])
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
 * Resolve the lang-layer preset for a given leaf preset.
 * Returns the lang preset if the leaf or any ancestor declares a `lang` field.
 *
 * @param {string} leafKey - Preset key
 * @returns {Object|null} Lang preset object, or null if no lang layer
 */
export function resolveLangPreset(leafKey) {
  const chain = resolveChain(leafKey);

  // Check from leaf to root for a lang declaration
  for (let i = chain.length - 1; i >= 0; i--) {
    const langKey = chain[i].lang;
    if (langKey) {
      // Don't return if lang preset is already in the chain
      if (chain.some((p) => p.key === langKey)) return null;
      const langPreset = PRESETS.find((p) => p.key === langKey);
      return langPreset || null;
    }
  }
  return null;
}

/**
 * Resolve the parent chain for a type path, with fallback for unknown presets.
 * Unlike resolveChain(), this never throws — it falls back to segment-based
 * resolution and always includes base.
 *
 * @param {string} typePath - Type path (e.g. "webapp/cakephp2", "node", "cli/node-cli")
 * @returns {Object[]} Array of preset objects, ordered root → leaf
 */
export function resolveChainSafe(typePath) {
  const leaf = typePath.split("/").pop();
  try {
    return resolveChain(leaf);
  } catch (_) {
    const segments = typePath.split("/").filter(Boolean);
    const chain = segments.map((seg) => PRESETS.find((p) => p.key === seg)).filter(Boolean);
    // Ensure base is at the front
    if (!chain.some((p) => p.key === "base")) {
      const base = PRESETS.find((p) => p.key === "base");
      if (base) chain.unshift(base);
    }
    // Deduplicate
    const seen = new Set();
    return chain.filter((p) => { if (seen.has(p.key)) return false; seen.add(p.key); return true; });
  }
}

/**
 * Return presets belonging to the given architecture.
 * Backward compatible: uses parent field to determine hierarchy.
 *
 * @param {string} arch - "webapp" | "cli" | "library"
 */
export function presetsForArch(arch) {
  return PRESETS.filter((p) => p.parent === arch && !p.isArch);
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
 * Build a TYPE_ALIASES-compatible object mapping aliases → canonical type paths.
 * Excludes arch-level presets (base, webapp, cli, library, php, node).
 *
 * @returns {Record<string, string>}
 */
export function buildTypeAliases() {
  const aliases = {};
  for (const p of PRESETS) {
    if (p.isArch) continue;
    aliases[p.key] = p.type;
    for (const alias of p.aliases) {
      aliases[alias] = p.type;
    }
  }
  return aliases;
}
