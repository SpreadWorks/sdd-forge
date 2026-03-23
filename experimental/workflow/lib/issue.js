import { execFileSync } from "node:child_process";

export function createIssue({ title, body, labels = [], repo, project }) {
  const args = ["issue", "create", "--title", title, "--body", body];
  if (repo) args.push("--repo", repo);
  if (project) args.push("--project", project);
  for (const label of labels) {
    args.push("--label", label);
  }
  const out = execFileSync("gh", args, { encoding: "utf8" });
  return out.trim();
}
