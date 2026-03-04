/**
 * sdd-forge/lib/presets.js
 *
 * Central registry for all framework presets.
 * All consumers derive their preset data from this single source.
 */

export const PRESETS = [
  {
    key: "cakephp2",
    type: "webapp/cakephp2",
    arch: "webapp",
    label: "CakePHP 2.x",
    aliases: ["php-mvc"],
  },
  {
    key: "laravel",
    type: "webapp/laravel",
    arch: "webapp",
    label: "Laravel 8+",
    aliases: [],
  },
  {
    key: "symfony",
    type: "webapp/symfony",
    arch: "webapp",
    label: "Symfony 5+",
    aliases: [],
  },
  {
    key: "node-cli",
    type: "cli/node-cli",
    arch: "cli",
    label: "Node.js CLI",
    aliases: [],
  },
];

/**
 * Return presets belonging to the given architecture.
 *
 * @param {string} arch - "webapp" | "cli" | "library"
 * @returns {typeof PRESETS}
 */
export function presetsForArch(arch) {
  return PRESETS.filter((p) => p.arch === arch);
}

/**
 * Look up a preset by its leaf key (e.g. "cakephp2", "laravel").
 *
 * @param {string} leaf
 * @returns {typeof PRESETS[number] | undefined}
 */
export function presetByLeaf(leaf) {
  return PRESETS.find((p) => p.key === leaf);
}

/**
 * Build a TYPE_ALIASES-compatible object mapping aliases → canonical type paths.
 *
 * @returns {Record<string, string>}
 */
export function buildTypeAliases() {
  const aliases = {};
  for (const p of PRESETS) {
    // Map leaf key to full type path (e.g. "laravel" → "webapp/laravel")
    aliases[p.key] = p.type;
    // Map explicit aliases (e.g. "php-mvc" → "webapp/cakephp2")
    for (const alias of p.aliases) {
      aliases[alias] = p.type;
    }
  }
  return aliases;
}
