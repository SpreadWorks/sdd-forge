/**
 * CI workflow YAML parser for GitHub Actions.
 *
 * Regex + indent-based simple parser (no external dependencies).
 * Extracts pipeline metadata from .github/workflows/*.yml files.
 */

import fs from "fs";
import path from "path";

/**
 * Parse a single GitHub Actions workflow YAML file.
 *
 * @param {string} content - YAML file content
 * @param {string} fileName - File name (for fallback name)
 * @returns {Object} Parsed pipeline data
 */
export function parseWorkflow(content, fileName) {
  const result = {
    file: fileName,
    name: fileName,
    platform: "github-actions",
    triggers: [],
    jobs: [],
    envVars: [],
    secrets: [],
  };

  if (!content || !content.trim()) return result;

  const lines = content.split("\n");

  // Extract workflow name
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  // Extract triggers from `on:` section
  result.triggers = parseTriggers(lines);

  // Extract jobs
  result.jobs = parseJobs(lines);

  // Extract secrets and env var references from entire file
  result.secrets = extractRefs(content, /\$\{\{\s*secrets\.(\w+)\s*\}\}/g);
  result.envVars = extractRefs(content, /\$\{\{\s*env\.(\w+)\s*\}\}/g);

  return result;
}

/**
 * Parse the `on:` trigger section.
 *
 * @param {string[]} lines
 * @returns {string[]} Trigger descriptions
 */
function parseTriggers(lines) {
  const triggers = [];
  let inOn = false;
  let onIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Detect `on:` at top level
    if (/^on\s*:/.test(trimmed)) {
      inOn = true;
      onIndent = 0;

      // Inline form: `on: push` or `on: [push, pull_request]`
      const inlineMatch = trimmed.match(/^on\s*:\s*(.+)$/);
      if (inlineMatch) {
        const val = inlineMatch[1].trim();
        if (val.startsWith("[")) {
          // Array form: [push, pull_request]
          const items = val.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
          triggers.push(...items);
          inOn = false;
        } else if (!val.endsWith(":")) {
          triggers.push(val);
          inOn = false;
        }
      }
      continue;
    }

    if (!inOn) continue;

    // End of `on:` section: next top-level key
    if (/^\S/.test(line) && !line.startsWith("#")) {
      inOn = false;
      continue;
    }

    // Trigger event (indented key)
    const eventMatch = trimmed.match(/^\s{2}(\w[\w-]*)\s*:/);
    if (eventMatch) {
      const event = eventMatch[1];
      // Check for branches filter on the next lines
      const branches = extractBranches(lines, i + 1);
      if (branches) {
        triggers.push(`${event} (${branches})`);
      } else {
        triggers.push(event);
      }
    }

    // Schedule cron
    const cronMatch = trimmed.match(/^\s+-\s*cron\s*:\s*["']?(.+?)["']?\s*$/);
    if (cronMatch) {
      // Already captured "schedule" as event, add cron detail
      const scheduleIdx = triggers.indexOf("schedule");
      if (scheduleIdx >= 0) {
        triggers[scheduleIdx] = `schedule (${cronMatch[1]})`;
      }
    }
  }

  return triggers;
}

/**
 * Extract branch names from `branches:` sub-key.
 *
 * @param {string[]} lines
 * @param {number} startIdx
 * @returns {string|null}
 */
function extractBranches(lines, startIdx) {
  for (let i = startIdx; i < Math.min(startIdx + 5, lines.length); i++) {
    const trimmed = lines[i].trim();

    // branches: [main, develop]
    const inlineMatch = trimmed.match(/^branches\s*:\s*\[(.+)\]/);
    if (inlineMatch) {
      return inlineMatch[1].replace(/['"]/g, "").split(",").map((s) => s.trim()).join(", ");
    }

    // branches: followed by list items
    if (/^branches\s*:\s*$/.test(trimmed)) {
      const branchList = [];
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const item = lines[j].trim();
        if (item.startsWith("- ")) {
          branchList.push(item.slice(2).trim().replace(/['"]/g, ""));
        } else {
          break;
        }
      }
      return branchList.length > 0 ? branchList.join(", ") : null;
    }

    // Next key at same or lower indent — stop searching
    if (/^\s{2}\w/.test(lines[i]) && !/^\s{4}/.test(lines[i])) break;
  }
  return null;
}

/**
 * Parse the `jobs:` section.
 *
 * @param {string[]} lines
 * @returns {Object[]} Job definitions
 */
function parseJobs(lines) {
  const jobs = [];
  let inJobs = false;
  let currentJob = null;
  let inSteps = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Detect `jobs:` at top level
    if (/^jobs\s*:\s*$/.test(trimmed)) {
      inJobs = true;
      continue;
    }

    if (!inJobs) continue;

    // End of jobs section: next top-level key
    if (/^\S/.test(line) && !line.startsWith("#")) {
      if (currentJob) jobs.push(currentJob);
      break;
    }

    // Job ID (2-space indent)
    const jobMatch = trimmed.match(/^  (\w[\w-]*)\s*:\s*$/);
    if (jobMatch) {
      if (currentJob) jobs.push(currentJob);
      currentJob = { id: jobMatch[1], runner: "", steps: 0, dependencies: [] };
      inSteps = false;
      continue;
    }

    if (!currentJob) continue;

    // runs-on
    const runsOnMatch = trimmed.match(/^\s+runs-on\s*:\s*(.+)$/);
    if (runsOnMatch) {
      currentJob.runner = runsOnMatch[1].trim().replace(/^["']|["']$/g, "");
      continue;
    }

    // steps: section start
    if (/^\s+steps\s*:\s*$/.test(trimmed)) {
      inSteps = true;
      continue;
    }

    // Step entry (list item under steps)
    if (inSteps && /^\s+-\s/.test(line)) {
      currentJob.steps++;

      // uses: action
      const usesMatch = trimmed.match(/^\s*-?\s*uses\s*:\s*(.+)$/);
      if (usesMatch) {
        currentJob.dependencies.push(usesMatch[1].trim().replace(/^["']|["']$/g, ""));
      }
    }

    // `uses:` on its own line within a step (not as list item prefix)
    if (inSteps && !line.trim().startsWith("-") && /^\s+uses\s*:\s*(.+)$/.test(trimmed)) {
      const m = trimmed.match(/^\s+uses\s*:\s*(.+)$/);
      if (m) {
        currentJob.dependencies.push(m[1].trim().replace(/^["']|["']$/g, ""));
      }
    }
  }

  // Push last job
  if (currentJob) jobs.push(currentJob);

  // Deduplicate dependencies
  for (const job of jobs) {
    job.dependencies = [...new Set(job.dependencies)];
  }

  return jobs;
}

/**
 * Extract unique references matching a pattern from content.
 *
 * @param {string} content
 * @param {RegExp} regex - Must have global flag
 * @returns {string[]}
 */
function extractRefs(content, regex) {
  const refs = new Set();
  let m;
  while ((m = regex.exec(content)) !== null) {
    refs.add(m[1]);
  }
  return [...refs].sort();
}

/**
 * Scan .github/workflows/ directory for workflow files.
 *
 * @param {string} root - Project root directory
 * @returns {{ pipelines: Object[], summary: { total: number, totalJobs: number } }}
 */
export function scanWorkflows(root) {
  const wfDir = path.join(root, ".github", "workflows");
  const pipelines = [];

  if (fs.existsSync(wfDir)) {
    const files = fs.readdirSync(wfDir)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .sort();

    for (const file of files) {
      const content = fs.readFileSync(path.join(wfDir, file), "utf8");
      const pipeline = parseWorkflow(content, `.github/workflows/${file}`);
      pipelines.push(pipeline);
    }
  }

  const totalJobs = pipelines.reduce((s, p) => s + p.jobs.length, 0);
  return {
    pipelines,
    summary: { total: pipelines.length, totalJobs },
  };
}
