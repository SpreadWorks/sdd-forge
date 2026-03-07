/**
 * src/docs/lib/data-source-loader.js
 *
 * Shared DataSource loader used by both scan.js and resolver-factory.js.
 */

import fs from "fs";
import path from "path";
import { createLogger } from "../../lib/progress.js";

const logger = createLogger("datasource");

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
  if (!fs.existsSync(dataDir)) return sources;

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const name = path.basename(file, ".js");
    try {
      const mod = await import(path.join(dataDir, file));
      const Source = mod.default;
      if (typeof Source === "function") {
        const instance = new Source();
        if (onInstance && onInstance(instance, name) === false) continue;
        sources.set(name, instance);
      }
    } catch (err) {
      logger.verbose(`failed to load DataSource ${name}: ${err.message}`);
    }
  }
  return sources;
}
