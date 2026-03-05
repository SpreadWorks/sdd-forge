/**
 * sdd-forge/lib/presets.js
 *
 * Auto-discovers presets from src/presets/{key}/preset.json.
 * All consumers derive their preset data from this single source.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRESETS_DIR = path.resolve(__dirname, "..", "presets");

/**
 * Discover all presets by scanning src/presets/{key}/preset.json.
 * Each preset gets: { key, dir, arch, label, aliases, scan, type, isArch }.
 * Arch-layer presets (base, webapp, cli, library) have isArch=true.
 */
function discoverPresets() {
  if (!fs.existsSync(PRESETS_DIR)) return [];

  return fs.readdirSync(PRESETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifestPath = path.join(PRESETS_DIR, d.name, "preset.json");
      if (!fs.existsSync(manifestPath)) return null;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const isArch = manifest.arch === d.name || d.name === "base";
      return {
        key: d.name,
        type: isArch ? d.name : `${manifest.arch}/${d.name}`,
        dir: path.join(PRESETS_DIR, d.name),
        arch: manifest.arch,
        label: manifest.label,
        aliases: manifest.aliases || [],
        scan: manifest.scan || {},
        isArch,
      };
    })
    .filter(Boolean);
}

export const PRESETS = discoverPresets();

/**
 * Return presets belonging to the given architecture.
 *
 * @param {string} arch - "webapp" | "cli" | "library"
 */
export function presetsForArch(arch) {
  return PRESETS.filter((p) => p.arch === arch && !p.isArch);
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
 * Excludes arch-layer presets (base, webapp, cli, library).
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
