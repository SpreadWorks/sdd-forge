import { execFileSync } from "node:child_process";
import { WorkflowCommand } from "../base-command.js";
import {
  searchItems,
  updateDraftIssue,
  convertDraftToIssue,
  getRepositoryId,
  getProjectMeta,
  setItemStatus,
} from "../graphql.js";
import { findItem, parseJsonResponse } from "../board-helpers.js";
import { assertJapaneseDraft, assertJapaneseDraftField, stripHashPrefix } from "../validation.js";
import { callAgentWithLog, ensureAgentWorkDir, resolveAgent } from "../../../../src/lib/agent.js";

const COMMAND_ID = "experimental.workflow.publish";
const PUBLISH_TIMEOUT_MS = 60_000;
const PUBLISH_RETRY_COUNT = 2;

export default class PublishCommand extends WorkflowCommand {
  async execute(ctx) {
    const { boardConfig, config, root } = ctx;
    const hash = ctx.hash;
    const labels = ctx.labels || (ctx.label ? [ctx.label] : []);

    if (!hash) throw new Error("hash is required");

    // 1. Fetch draft
    const { nodes } = searchItems(boardConfig.owner, boardConfig.project, hash);
    const item = findItem(nodes, hash);
    if (!item) throw new Error(`hash "${hash}" not found`);
    if (item.content?.number) {
      throw new Error(`already published as issue #${item.content.number}`);
    }

    const sourceLang = config.experimental?.workflow?.languages?.source ?? config.lang;
    const publishLang = config.experimental?.workflow?.languages?.publish ?? config.lang;

    const c = item.content;
    const sourceTitle = stripHashPrefix(c.title || "");
    const sourceBody = c.body || "";

    let issueTitle;
    let issueBody;

    if (sourceLang === publishLang) {
      // Same language: publish as-is
      issueTitle = `${hash}: ${sourceTitle}`;
      issueBody = sourceBody;
    } else {
      // Different language: translate
      assertJapaneseDraft(sourceTitle, sourceBody, { allowEmptyBody: true });

      const prompt = `Translate the following ${sourceLang} GitHub issue title and body to ${publishLang}. Output ONLY valid JSON with "title" and "body" keys. Do not include any other text.

Title: ${sourceTitle}

Body:
${sourceBody || "(empty)"}`;

      const agent = resolveAgent(config, COMMAND_ID);
      if (!agent) {
        throw new Error(`no agent configured for ${COMMAND_ID}`);
      }
      ensureAgentWorkDir(agent, root);

      const translated = this.callTranslator(agent, prompt, root);
      const result = parseJsonResponse(translated);
      issueTitle = `${hash}: ${result.title}`;
      assertJapaneseDraftField("draft title", sourceTitle);
      issueBody = `${result.body}

---

<details>
<summary>${sourceLang}</summary>

${sourceTitle}

${sourceBody}

</details>`;
    }

    // Update draft to publish-language content
    const draftId = c.draftId;
    updateDraftIssue(draftId, { title: issueTitle, body: issueBody });

    // Convert draft to issue
    const [repoOwner, repoName] = boardConfig.repo.split("/");
    const repositoryId = getRepositoryId(repoOwner, repoName);
    const converted = convertDraftToIssue(item.id, repositoryId);
    const issueNumber = converted.content?.number;
    const issueUrl = converted.content?.url;

    // Apply labels
    if (labels.length > 0 && issueNumber) {
      execFileSync(
        "gh",
        [
          "issue",
          "edit",
          String(issueNumber),
          ...labels.flatMap((l) => ["--add-label", l]),
          "--repo",
          boardConfig.repo,
        ],
        { encoding: "utf8", timeout: 30_000 },
      );
    }

    // Move status to Todo
    const meta = getProjectMeta(boardConfig.owner, boardConfig.project);
    const todoOption = meta.statusField.options.find((o) => o.name === "Todo");
    if (todoOption) {
      setItemStatus(meta.projectId, item.id, meta.statusField.id, todoOption.id);
    }

    return {
      hash,
      issueNumber,
      issueUrl,
      labels,
      statusUpdated: todoOption ? "Todo" : null,
    };
  }

  callTranslator(agent, prompt, root) {
    let lastErr = null;
    for (let attempt = 0; attempt <= PUBLISH_RETRY_COUNT; attempt++) {
      try {
        return callAgentWithLog(agent, prompt, PUBLISH_TIMEOUT_MS, root);
      } catch (err) {
        lastErr = err;
        if (attempt < PUBLISH_RETRY_COUNT) continue;
      }
    }
    throw new Error(`translator agent failed after ${PUBLISH_RETRY_COUNT + 1} attempts: ${lastErr?.message}`);
  }
}
