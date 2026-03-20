/**
 * PipelinesSource — CI/CD pipelines DataSource.
 *
 * Scans GitHub Actions workflow YAML files and provides
 * pipeline metadata as {{data}} directives.
 *
 * Available methods:
 *   pipelines.list("Name|File|Triggers|Jobs")
 *   pipelines.jobs("Pipeline|Job|Runner|Steps|Dependencies")
 *   pipelines.env("Pipeline|Secrets|Env Vars")
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { parseWorkflow } from "../scan/workflows.js";

export default class PipelinesSource extends Scannable(DataSource) {
  match(file) {
    return /\.github\/workflows\/.*\.ya?ml$/.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;

    const pipelines = [];
    for (const f of files) {
      const content = fs.readFileSync(f.absPath, "utf8");
      const pipeline = parseWorkflow(content, f.relPath);
      pipelines.push(pipeline);
    }

    const totalJobs = pipelines.reduce((s, p) => s + p.jobs.length, 0);
    return {
      pipelines,
      summary: { total: pipelines.length, totalJobs },
    };
  }

  /** Pipeline summary table. */
  list(analysis, labels) {
    const items = analysis.pipelines?.pipelines || [];
    if (items.length === 0) return null;
    const rows = this.toRows(items, (p) => [
      p.name,
      p.file,
      p.triggers.join(", ") || "—",
      p.jobs.length,
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Job detail table across all pipelines. */
  jobs(analysis, labels) {
    const items = analysis.pipelines?.pipelines || [];
    if (items.length === 0) return null;
    const rows = [];
    for (const p of items) {
      for (const j of p.jobs) {
        rows.push([
          p.name,
          j.id,
          j.runner || "—",
          j.steps,
          j.dependencies.join(", ") || "—",
        ]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Secrets and environment variables table. */
  env(analysis, labels) {
    const items = analysis.pipelines?.pipelines || [];
    if (items.length === 0) return null;
    const rows = [];
    for (const p of items) {
      if (p.secrets.length === 0 && p.envVars.length === 0) continue;
      rows.push([
        p.name,
        p.secrets.join(", ") || "—",
        p.envVars.join(", ") || "—",
      ]);
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}
