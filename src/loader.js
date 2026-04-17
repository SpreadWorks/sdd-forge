/**
 * src/loader.js — Node.js ESM module loader hook
 *
 * Registered at sdd-forge startup via module.register().
 *
 * Resolves `sdd-forge/*` specifiers into concrete file URLs so external
 * presets and `.sdd-forge/data/` overrides can import sdd-forge resources
 * regardless of where they live on disk.
 *
 * Two resolution modes:
 *
 * 1. `sdd-forge/presets/<name>/<subpath>` — 3-tier preset cross-import.
 *    Searched in order: project (`<projectRoot>/.sdd-forge/presets/`),
 *    user (`<userHome>/.sdd-forge/presets/`), builtin (`<pkg>/src/presets/`).
 *    First hit wins. Results are cached in-memory for the process lifetime.
 *    If no tier has the file, resolution falls through to nextResolve so
 *    Node emits its standard "Cannot find module" error.
 *
 * 2. `sdd-forge/<subpath>` (non-preset) — resolves directly to
 *    `<pkg>/src/<subpath>.js`, preserving the original behavior for
 *    `sdd-forge/api` and other public subpaths.
 *
 * Project and user tiers require context that the loader worker cannot
 * discover on its own. They are injected by the parent via
 * `register(..., { data: { projectRoot, userHome } })`, which Node forwards
 * to the exported `initialize()` hook.
 *
 * Requires Node.js >= 18.19.0 (stable module.register() API).
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SDDFORGE_PREFIX = "sdd-forge/";
const PRESETS_PREFIX = "sdd-forge/presets/";
const LOADER_DIR = path.dirname(fileURLToPath(import.meta.url));
const BUILTIN_PRESETS_DIR = path.join(LOADER_DIR, "presets");

// Bound the cache to avoid unbounded growth if a long-running process
// resolves a pathological number of distinct preset specifiers. In practice
// sdd-forge is short-lived and resolves well under this many unique imports.
const MAX_CACHE_SIZE = 1024;

let projectRoot = null;
let userHome = null;
const cache = new Map();

/**
 * Called by Node once after register(). Receives { projectRoot, userHome }
 * forwarded via register()'s `data` option. Either value may be null.
 *
 * @param {{ projectRoot?: string|null, userHome?: string|null }} data
 */
export function initialize(data) {
  projectRoot = data && typeof data.projectRoot === "string" ? data.projectRoot : null;
  userHome = data && typeof data.userHome === "string" ? data.userHome : null;
  cache.clear();
}

/**
 * ESM loader hook — resolve phase.
 *
 * @param {string} specifier
 * @param {object} context
 * @param {Function} nextResolve
 * @returns {{ url: string, shortCircuit: boolean }}
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(PRESETS_PREFIX)) {
    const cached = cache.get(specifier);
    if (cached) return cached;

    const rel = specifier.slice(PRESETS_PREFIX.length) + ".js";
    for (const base of presetSearchTiers()) {
      const candidate = path.join(base, rel);
      if (await fileExists(candidate)) {
        const hit = {
          url: pathToFileURL(candidate).href,
          shortCircuit: true,
        };
        rememberResolution(specifier, hit);
        return hit;
      }
    }
    return nextResolve(specifier, context);
  }

  if (specifier.startsWith(SDDFORGE_PREFIX)) {
    const subpath = specifier.slice(SDDFORGE_PREFIX.length);
    return {
      url: new URL(`./${subpath}.js`, import.meta.url).href,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}

async function fileExists(p) {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch (err) {
    // ENOENT/ENOTDIR are the expected "tier miss" case; anything else is
    // a real filesystem problem (permission denied, I/O error, etc.) that
    // should surface rather than be swallowed.
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return false;
    throw err;
  }
}

function rememberResolution(specifier, hit) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict the oldest entry (Map preserves insertion order).
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(specifier, hit);
}

function presetSearchTiers() {
  const tiers = [];
  if (projectRoot) tiers.push(path.join(projectRoot, ".sdd-forge", "presets"));
  if (userHome) tiers.push(path.join(userHome, ".sdd-forge", "presets"));
  tiers.push(BUILTIN_PRESETS_DIR);
  return tiers;
}

/** Test-only: reset module state between tests. */
export function __resetForTest() {
  projectRoot = null;
  userHome = null;
  cache.clear();
}
