/**
 * DockerSource — Docker configuration DataSource.
 *
 * Available methods (called via @data directives):
 *   docker.list("...")
 */

import { DataSource } from "../../../docs/lib/data-source.js";

class DockerSource extends DataSource {
  scan() {
    return {};
  }

  /** Docker container list (not applicable for this preset). */
  list(analysis, labels) {
    return null;
  }
}

export default new DockerSource();
