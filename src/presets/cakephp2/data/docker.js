/**
 * DockerSource — Docker configuration DataSource.
 *
 * CakePHP-only category: extends DataSource directly (no scan needed).
 *
 * Available methods (called via @data directives):
 *   docker.list("...")
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class CakephpDockerSource extends DataSource {
  /** Docker container list (not applicable for this preset). */
  list(analysis, labels) {
    return null;
  }
}
