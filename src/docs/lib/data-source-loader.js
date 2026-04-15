/**
 * src/docs/lib/data-source-loader.js
 *
 * Shared DataSource loader used by both scan.js and resolver-factory.js.
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const MAX_DATA_SOURCE_FILES = 1000;

/**
 * Load DataSource classes from a directory and instantiate them.
 *
 * @param {string} dataDir   - data/ directory absolute path
 * @param {Object} [opts]    - Options
 * @param {Map<string, Object>} [opts.existing] - Inherited DataSource map (parent preset)
 * @param {function} [opts.onInstance] - Called with (instance, name) after instantiation.
 *   Return false to skip adding this source. Use for init() or filter logic.
 * @returns {Promise<Map<string, Object>>} name → DataSource instance
 */
export async function loadDataSources(dataDir, opts) {
  const { existing, onInstance } = opts || {};
  const sources = new Map(existing || []);
  let entries;
  try {
    entries = await fs.promises.readdir(dataDir);
  } catch (err) {
    if (err.code === "ENOENT") return sources;
    throw err;
  }
  const files = entries.filter((f) => f.endsWith(".js"));
  if (files.length > MAX_DATA_SOURCE_FILES) {
    throw new Error(
      `DataSource directory ${dataDir} contains ${files.length} files, exceeding limit ${MAX_DATA_SOURCE_FILES}`,
    );
  }
  for (const file of files) {
    const name = path.basename(file, ".js");
    const filePath = path.join(dataDir, file);
    let mod;
    try {
      mod = await import(pathToFileURL(filePath).href);
    } catch (err) {
      throw new Error(`failed to load DataSource at ${filePath}: ${err.message}`, { cause: err });
    }
    const Source = mod.default;
    if (typeof Source === "function") {
      const instance = new Source();
      instance._sourceFilePath = filePath;
      if (onInstance && onInstance(instance, name) === false) continue;
      sources.set(name, instance);
    }
  }
  return sources;
}
