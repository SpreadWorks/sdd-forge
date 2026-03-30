#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { loadBoardConfig } from "./lib/config.js";
import { prefixTitle, extractId } from "./lib/hash.js";
import { searchItems, listItems, getProjectMeta, setItemStatus, updateDraftIssue, addIssueToProject, deleteProjectItem, getIssueNodeId } from "./lib/graphql.js";
import { createIssue } from "./lib/issue.js";
import { assertJapaneseDraft, assertJapaneseDraftField, stripHashPrefix } from "./lib/validation.js";

function parseJsonResponse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    if (lines.length >= 3 && lines.at(-1) === "```") {
      return JSON.parse(lines.slice(1, -1).join("\n"));
    }
  }
  return JSON.parse(trimmed);
}

function findItem(nodes, hash) {
  return nodes.find((n) => {
    const title = n.content?.title || "";
    return title.startsWith(`${hash}: `);
  });
}

function formatItem(node) {
  const c = node.content || {};
  const status = node.fieldValueByName?.name || "—";
  const id = extractId(c.title || "") || "—";
  return `[${id}] (${status}) ${c.title || "(no title)"}`;
}

// --- subcommands ---

function cmdSearch(config, args) {
  const queryText = args.join(" ");
  if (!queryText) {
    console.error("Usage: board.js search <text>");
    process.exit(1);
  }
  const { nodes, totalCount } = searchItems(config.owner, config.project, queryText);
  console.log(`${totalCount} 件ヒット:\n`);
  for (const node of nodes) {
    console.log(formatItem(node));
    if (node.content?.body) {
      const preview = node.content.body.split("\n").slice(0, 3).join("\n");
      console.log(`  ${preview}\n`);
    }
  }
}

function cmdAdd(config, args) {
  let status = "Todo";
  let body = null;
  const titleParts = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--status") {
      status = args[++i];
    } else if (args[i] === "--body") {
      body = args[++i];
    } else {
      titleParts.push(args[i]);
    }
  }
  const rawTitle = titleParts.join(" ");
  if (!rawTitle) {
    console.error("Usage: board.js add <title> [--status Todo|Ideas] [--body <text>]");
    process.exit(1);
  }
  assertJapaneseDraft(rawTitle, body, { allowEmptyBody: true });

  const title = prefixTitle(rawTitle);

  // create draft via gh CLI
  const ghArgs = [
    "project", "item-create", String(config.project),
    "--owner", config.owner,
    "--title", title,
    "--format", "json",
  ];
  if (body) ghArgs.push("--body", body);
  const out = execFileSync("gh", ghArgs, { encoding: "utf8" });
  const created = JSON.parse(out);
  console.log(`作成: ${title}`);

  // set status
  const meta = getProjectMeta(config.owner, config.project);
  const option = meta.statusField.options.find((o) => o.name === status);
  if (option) {
    setItemStatus(meta.projectId, created.id, meta.statusField.id, option.id);
    console.log(`ステータス: ${status}`);
  } else {
    console.error(`ステータス "${status}" が見つかりません。選択肢: ${meta.statusField.options.map((o) => o.name).join(", ")}`);
  }
}

function cmdList(config, args) {
  const statusFlag = args.indexOf("--status");
  let filterStatus = null;
  if (statusFlag !== -1) {
    filterStatus = args[statusFlag + 1];
  }

  const { nodes, totalCount } = listItems(config.owner, config.project);
  let filtered = nodes;
  if (filterStatus) {
    filtered = nodes.filter((n) => n.fieldValueByName?.name === filterStatus);
  }

  console.log(`${filtered.length} 件${filterStatus ? ` (${filterStatus})` : ""} / 全 ${totalCount} 件:\n`);
  for (const node of filtered) {
    console.log(formatItem(node));
  }
}

function cmdShow(config, args) {
  const hash = args[0];
  if (!hash) {
    console.error("Usage: board.js show <hash>");
    process.exit(1);
  }

  const { nodes } = searchItems(config.owner, config.project, hash);
  const item = findItem(nodes, hash);
  if (!item) {
    console.error(`ハッシュ "${hash}" に一致するアイテムが見つかりません`);
    process.exit(1);
  }

  const c = item.content || {};
  const status = item.fieldValueByName?.name || "—";
  console.log(`タイトル: ${c.title}`);
  console.log(`ステータス: ${status}`);
  if (c.number) console.log(`Issue: #${c.number} ${c.url}`);
  if (c.body) console.log(`\n${c.body}`);
}

function cmdUpdate(config, args) {
  let hash = null;
  let status = null;
  let body = null;
  let title = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--status") {
      status = args[++i];
    } else if (args[i] === "--body") {
      body = args[++i];
    } else if (args[i] === "--title") {
      title = args[++i];
    } else if (!hash) {
      hash = args[i];
    }
  }

  if (!hash) {
    console.error("Usage: board.js update <hash> [--status Done] [--body <text>] [--title <text>]");
    process.exit(1);
  }

  const { nodes } = searchItems(config.owner, config.project, hash);
  const item = findItem(nodes, hash);
  if (!item) {
    console.error(`ハッシュ "${hash}" に一致するアイテムが見つかりません`);
    process.exit(1);
  }

  // update draft title/body
  if (title !== null || body !== null) {
    const draftId = item.content?.draftId;
    if (!draftId) {
      console.error("Issue に変換済みのアイテムのタイトル・本文は更新できません");
      process.exit(1);
    }
    const currentTitle = stripHashPrefix(item.content?.title || "");
    const nextTitle = title !== null ? title : currentTitle;
    const nextBody = body !== null ? body : item.content?.body;
    assertJapaneseDraft(nextTitle, nextBody, { allowEmptyBody: true });
    const newTitle = title !== null ? `${hash}: ${title}` : undefined;
    updateDraftIssue(draftId, { title: newTitle, body: body ?? undefined });
    if (title !== null) console.log(`タイトル更新: ${newTitle}`);
    if (body !== null) console.log("本文更新済み");
  }

  // update status
  if (status !== null) {
    const meta = getProjectMeta(config.owner, config.project);
    const option = meta.statusField.options.find((o) => o.name === status);
    if (!option) {
      console.error(`ステータス "${status}" が見つかりません。選択肢: ${meta.statusField.options.map((o) => o.name).join(", ")}`);
      process.exit(1);
    }
    setItemStatus(meta.projectId, item.id, meta.statusField.id, option.id);
    console.log(`ステータス: ${status}`);
  }

  if (title === null && body === null && status === null) {
    console.error("更新する項目を指定してください: --status, --body, --title");
    process.exit(1);
  }
}

function cmdToIssue(config, args) {
  const labelFlag = args.indexOf("--label");
  let labels = [];
  let hash = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--label") {
      labels.push(args[++i]);
    } else if (!hash) {
      hash = args[i];
    }
  }

  if (!hash) {
    console.error("Usage: board.js to-issue <hash> [--label enhancement] [--label bug]");
    process.exit(1);
  }

  // 1. Draft を取得
  const { nodes } = searchItems(config.owner, config.project, hash);
  const item = findItem(nodes, hash);
  if (!item) {
    console.error(`ハッシュ "${hash}" に一致するアイテムが見つかりません`);
    process.exit(1);
  }
  if (item.content?.number) {
    console.error(`既に Issue #${item.content.number} として登録済みです`);
    process.exit(1);
  }

  const c = item.content;
  console.log(`Draft: ${c.title}\n`);
  assertJapaneseDraft(stripHashPrefix(c.title || ""), c.body, { allowEmptyBody: true });

  // 2. claude で英訳
  const prompt = `Translate the following Japanese GitHub issue title and body to English. Output ONLY valid JSON with "title" and "body" keys. Do not include any other text.

Title: ${stripHashPrefix(c.title || "")}

Body:
${c.body || "(empty)"}`;

  const translated = execFileSync("claude", ["-p", prompt, "--output-format", "json"], {
    encoding: "utf8",
    timeout: 60000,
  });
  const parsed = JSON.parse(translated);
  const result = parseJsonResponse(parsed.result);
  const enTitle = result.title;
  const enBody = result.body;
  assertJapaneseDraftField("Draft タイトル", stripHashPrefix(c.title || ""));

  console.log(`英訳タイトル: ${enTitle}`);
  console.log(`英訳本文:\n${enBody}\n`);

  // 3. Issue 作成
  const url = createIssue({
    title: enTitle,
    body: enBody,
    labels,
    repo: config.repo,
  });

  console.log(`Issue 作成: ${url}`);

  // 4. Issue をプロジェクトに追加し、Draft を削除して紐付け
  const issueNumber = parseInt(url.match(/\/issues\/(\d+)/)?.[1], 10);
  if (issueNumber) {
    const { projectId } = getProjectMeta(config.owner, config.project);
    const issueNodeId = getIssueNodeId(config.repo, issueNumber);
    const newItemId = addIssueToProject(projectId, issueNodeId);

    // Draft のステータスを引き継ぐ
    const draftStatus = item.fieldValueByName?.name;
    if (draftStatus) {
      const { statusField } = getProjectMeta(config.owner, config.project);
      const option = statusField.options.find((o) => o.name === draftStatus);
      if (option) {
        setItemStatus(projectId, newItemId, statusField.id, option.id);
      }
    }

    // 元の Draft を削除
    deleteProjectItem(projectId, item.id);
    console.log(`プロジェクトに Issue #${issueNumber} を追加し、Draft を削除しました`);
  }
}

// --- main ---

function main() {
  const [subcommand, ...args] = process.argv.slice(2);

  if (!subcommand || subcommand === "--help") {
    console.log(`Usage: board.js <command> [args]

Commands:
  search <text>                     ボード内をテキスト検索
  add <title> [--status Todo|Ideas] [--body <text>]
                                    ハッシュID付きで Draft 作成
  list [--status <status>]          アイテム一覧（ステータスフィルタ可）
  show <hash>                       ハッシュIDで詳細表示
  update <hash> [--status <s>] [--body <text>] [--title <text>]
                                    アイテムを更新
  to-issue <hash> [--label <l>]     Draft を英訳して Issue 化`);
    process.exit(0);
  }

  const config = loadBoardConfig();

  const commands = { search: cmdSearch, add: cmdAdd, list: cmdList, show: cmdShow, update: cmdUpdate, "to-issue": cmdToIssue };
  const fn = commands[subcommand];
  if (!fn) {
    console.error(`Unknown command: ${subcommand}`);
    process.exit(1);
  }
  fn(config, args);
}

main();
