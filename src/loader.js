/**
 * src/loader.js — Node.js ESM module loader hook
 *
 * Registered at sdd-forge startup via module.register().
 * Resolves 'sdd-forge/<subpath>' specifiers to the corresponding
 * file inside this package's src/ directory, enabling external presets
 * and .sdd-forge/data/ overrides to import sdd-forge base classes
 * regardless of where they are located on disk.
 *
 * Example:
 *   import { DataSource } from 'sdd-forge/api';
 *   // resolves to <pkg>/src/api.js
 *
 * Requires Node.js >= 18.19.0 (stable module.register() API).
 */

const SDDFORGE_PREFIX = "sdd-forge/";

/**
 * ESM loader hook — resolve phase.
 *
 * @param {string} specifier - the import specifier
 * @param {object} context   - resolution context
 * @param {Function} nextResolve - next resolver in chain
 * @returns {{ url: string, shortCircuit: boolean }}
 */
export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(SDDFORGE_PREFIX)) {
    const subpath = specifier.slice(SDDFORGE_PREFIX.length);
    return {
      url: new URL(`./${subpath}.js`, import.meta.url).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
