/**
 * analyze-base-classes.js
 *
 * AppController / AppModel analyzers.
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../../lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// AppController 解析
// ---------------------------------------------------------------------------
export function analyzeAppController(appDir) {
  const filePath = path.join(appDir, "Controller", "AppController.php");
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);

  const result = {
    components: [],
    helpers: [],
    authConfig: {},
    methods: [],
  };

  // components 配列から Session, Auth, Acl をトップレベルのみ抽出
  // 括弧バランスで第一階層だけ読み取る
  const compSection = src.match(/\$components\s*=\s*array\s*\(/);
  if (compSection) {
    const startIdx = compSection.index + compSection[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < src.length && depth > 0) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")") depth--;
      i++;
    }
    const compBody = src.slice(startIdx, i - 1);

    // トップレベルの要素を分割（depth=0 のカンマで区切る）
    let d = 0;
    let last = 0;
    const segments = [];
    for (let j = 0; j < compBody.length; j++) {
      if (compBody[j] === "(" || compBody[j] === "[") d++;
      else if (compBody[j] === ")" || compBody[j] === "]") d--;
      else if (compBody[j] === "," && d === 0) {
        segments.push(compBody.slice(last, j).trim());
        last = j + 1;
      }
    }
    segments.push(compBody.slice(last).trim());

    for (const seg of segments) {
      if (!seg) continue;
      // 'Session' or 'Auth' => array(...) or 'Acl'
      const nameMatch = seg.match(/^['"](\w+)['"]/);
      if (nameMatch) {
        result.components.push(nameMatch[1]);
      }
    }
  }

  // helpers
  const helperMatch = src.match(/\$helpers\s*=\s*array\s*\(([^)]+)\)/);
  if (helperMatch) {
    const body = helperMatch[1];
    // 'Html' => array('className' => 'MyHtml') パターン
    const helperRe = /['"](\w+)['"]\s*=>\s*array\s*\(\s*['"]className['"]\s*=>\s*['"](\w+)['"]/g;
    let hm;
    while ((hm = helperRe.exec(body)) !== null) {
      result.helpers.push({ name: hm[1], className: hm[2] });
    }
  }

  // Auth 設定を抽出
  const authSection = src.match(/'Auth'\s*=>\s*array\s*\(([\s\S]*?)\),\s*'Acl'/);
  if (authSection) {
    const authBody = authSection[1];
    // authorize
    const authorizeMatch = authBody.match(/['"]authorize['"]\s*=>\s*array\s*\(\s*['"](\w+)['"]/);
    if (authorizeMatch) result.authConfig.authorize = authorizeMatch[1];
    // authenticate
    const authMatch = authBody.match(/['"]authenticate['"]\s*=>\s*array\s*\(\s*['"](\w+)['"]/);
    if (authMatch) result.authConfig.authenticate = authMatch[1];
    // userModel
    const userModelMatch = authBody.match(/['"]userModel['"]\s*=>\s*['"](\w+)['"]/);
    if (userModelMatch) result.authConfig.userModel = userModelMatch[1];
    // username field
    const fieldMatch = authBody.match(/['"]username['"]\s*=>\s*['"](\w+)['"]/);
    if (fieldMatch) result.authConfig.loginField = fieldMatch[1];
    // loginRedirect
    const loginRedirMatch = authBody.match(/['"]loginRedirect['"]\s*=>\s*array\s*\(\s*['"]controller['"]\s*=>\s*['"](\w+)['"]/);
    if (loginRedirMatch) result.authConfig.loginRedirect = loginRedirMatch[1] + "/index";
    // logoutRedirect
    const logoutRedirMatch = authBody.match(/['"]logoutRedirect['"]\s*=>\s*array\s*\(\s*['"]controller['"]\s*=>\s*['"](\w+)['"][^)]*['"]action['"]\s*=>\s*['"](\w+)['"]/);
    if (logoutRedirMatch) result.authConfig.logoutRedirect = logoutRedirMatch[1] + "/" + logoutRedirMatch[2];
  }

  // メソッド一覧
  const fnRe = /(public|protected|private)\s+function\s+(\w+)\s*\(/g;
  let fm;
  while ((fm = fnRe.exec(src)) !== null) {
    result.methods.push({ name: fm[2], visibility: fm[1] });
  }

  return result;
}

// ---------------------------------------------------------------------------
// AppModel 解析
// ---------------------------------------------------------------------------
export function analyzeAppModel(appDir) {
  const filePath = path.join(appDir, "Model", "AppModel.php");
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);

  const result = {
    behaviors: [],
    callbacks: [],
    auditFields: [],
    methods: [],
  };

  // actsAs
  const actsAsMatch = src.match(/\$actsAs\s*=\s*array\s*\(\s*["'](\w+)["']/);
  if (actsAsMatch) result.behaviors.push(actsAsMatch[1]);

  // コールバック
  if (/function\s+beforeSave\s*\(/.test(src)) result.callbacks.push("beforeSave");
  if (/function\s+afterSave\s*\(/.test(src)) result.callbacks.push("afterSave");

  // 監査フィールド
  const auditFields = ["created_by", "created_ts", "updated_by", "updated_ts"];
  for (const field of auditFields) {
    if (src.includes(`'${field}'`)) result.auditFields.push(field);
  }

  // メソッド一覧
  const fnRe = /(public\s+)?function\s+(\w+)\s*\(/g;
  let fm;
  const methodDescs = {
    picureWithSize: "画像横幅バリデーション（パイプ区切り）",
    beforeSave: "自動タイムスタンプ・監査フィールド設定",
    afterSave: "進捗管理更新・FEデータ削除フラグ処理",
    invalidDate: "日付バリデーション",
    sqldump: "SQL デバッグダンプ",
    sql: "SQL テンプレートファイル読み込み・実行",
    escapeQuote: "シングルクォートエスケープ",
    replaseParam: "SQL パラメータ置換",
    updateProcessUpdate: "コンテンツ・タイトル最終更新日時の更新",
    saveAllAtOnce: "500件単位バッチ INSERT",
    bulkInsert: "INSERT ON DUPLICATE KEY UPDATE",
  };

  while ((fm = fnRe.exec(src)) !== null) {
    const name = fm[2];
    if (name === "__construct") continue;
    result.methods.push({
      name,
      description: methodDescs[name] || name,
    });
  }

  return result;
}
