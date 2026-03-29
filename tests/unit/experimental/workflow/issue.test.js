import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createIssue } from "../../../../experimental/workflow/lib/issue.js";

describe("createIssue", () => {
  it("does not include --project when project is omitted", () => {
    const calls = [];
    const exec = (command, args, options) => {
      calls.push({ command, args, options });
      return "https://github.com/example/repo/issues/1\n";
    };

    const url = createIssue({
      title: "Example title",
      body: "Example body",
      labels: ["enhancement"],
      repo: "example/repo",
    }, exec);

    assert.equal(url, "https://github.com/example/repo/issues/1");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].command, "gh");
    assert.deepEqual(calls[0].args, [
      "issue", "create",
      "--title", "Example title",
      "--body", "Example body",
      "--repo", "example/repo",
      "--label", "enhancement",
    ]);
  });

  it("includes --project only when explicitly requested", () => {
    const calls = [];
    const exec = (command, args) => {
      calls.push({ command, args });
      return "https://github.com/example/repo/issues/2\n";
    };

    createIssue({
      title: "Example title",
      body: "Example body",
      repo: "example/repo",
      project: "repo-project",
    }, exec);

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].args, [
      "issue", "create",
      "--title", "Example title",
      "--body", "Example body",
      "--repo", "example/repo",
      "--project", "repo-project",
    ]);
  });
});
