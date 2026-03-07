/**
 * Laravel Eloquent モデル解析器。
 * app/Models/ 配下の PHP ファイルを解析し、
 * テーブル名・リレーション・キャスト・スコープ・アクセサを抽出する。
 */

import fs from "fs";
import path from "path";
import { findFiles, camelToSnake, pluralize } from "../../../docs/lib/scanner.js";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ models: Object[], summary: { total: number } }}
 */
export function analyzeModels(sourceRoot) {
  // Laravel 8+ は app/Models/、それ以前は app/ 直下
  let baseDir = path.join(sourceRoot, "app", "Models");
  if (!fs.existsSync(baseDir)) {
    baseDir = path.join(sourceRoot, "app");
  }
  if (!fs.existsSync(baseDir)) return { models: [], summary: { total: 0 } };

  const files = findFiles(baseDir, "*.php", [], true);
  const models = [];
  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    if (/extends\s+Model\b/.test(content) || /use\s+HasFactory\b/.test(content)) {
      models.push(parseModel(f.absPath, f.relPath, baseDir));
    }
  }

  return { models, summary: { total: models.length } };
}


function parseModel(filePath, relPath, baseDir) {
  const content = fs.readFileSync(filePath, "utf8");

  // クラス名
  const classMatch = content.match(/class\s+(\w+)\s+extends\s+(\w+)/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, ".php");
  const parentClass = classMatch ? classMatch[2] : "";

  // $table プロパティ
  const tableMatch = content.match(/protected\s+\$table\s*=\s*['"]([^'"]+)['"]/);
  const tableName = tableMatch ? tableMatch[1] : pluralize(camelToSnake(className));

  // $fillable
  const fillable = extractArrayProp(content, "fillable");

  // $guarded
  const guarded = extractArrayProp(content, "guarded");

  // $casts
  const casts = extractAssocProp(content, "casts");

  // $hidden
  const hidden = extractArrayProp(content, "hidden");

  // リレーション
  const relations = extractRelations(content);

  // スコープ
  const scopes = [];
  const scopeRegex = /public\s+function\s+scope(\w+)\s*\(/g;
  let m;
  while ((m = scopeRegex.exec(content)) !== null) {
    scopes.push(m[1]);
  }

  // アクセサ（Laravel 9+ Attribute 形式 + 旧形式）
  const accessors = [];
  // 旧形式: getXxxAttribute
  const oldAccRegex = /public\s+function\s+get(\w+)Attribute\s*\(/g;
  while ((m = oldAccRegex.exec(content)) !== null) {
    accessors.push(m[1]);
  }
  // 新形式: Attribute::make の前にある protected function xxx()
  const newAccRegex = /protected\s+function\s+(\w+)\s*\(\)\s*:\s*Attribute\b/g;
  while ((m = newAccRegex.exec(content)) !== null) {
    accessors.push(m[1]);
  }

  // ファイルパス（app/Models/... 形式に正規化）
  const isInModelsDir = baseDir.endsWith(path.join("app", "Models"));
  const filePrefix = isInModelsDir ? "app/Models" : "app";

  return {
    file: path.join(filePrefix, relPath),
    className,
    parentClass,
    tableName,
    fillable,
    guarded,
    casts,
    hidden,
    relations,
    scopes,
    accessors,
  };
}

function extractArrayProp(content, propName) {
  const regex = new RegExp(
    `protected\\s+\\$${propName}\\s*=\\s*\\[([^\\]]*?)\\]`,
    "s",
  );
  const match = content.match(regex);
  if (!match) return [];
  const items = [];
  const itemRegex = /['"]([^'"]+)['"]/g;
  let m;
  while ((m = itemRegex.exec(match[1])) !== null) {
    items.push(m[1]);
  }
  return items;
}

function extractAssocProp(content, propName) {
  const regex = new RegExp(
    `protected\\s+\\$${propName}\\s*=\\s*\\[([^\\]]*?)\\]`,
    "s",
  );
  const match = content.match(regex);
  if (!match) return {};
  const result = {};
  const pairRegex = /['"]([^'"]+)['"]\s*=>\s*['"]?([^'",\]\s]+)['"]?/g;
  let m;
  while ((m = pairRegex.exec(match[1])) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

function extractRelations(content) {
  const relations = {};
  const relTypes = ["hasOne", "hasMany", "belongsTo", "belongsToMany", "morphTo", "morphMany", "morphOne", "morphToMany"];

  for (const relType of relTypes) {
    const regex = new RegExp(
      `public\\s+function\\s+(\\w+)\\s*\\([^)]*\\)\\s*(?::\\s*\\w+)?\\s*\\{[^}]*\\$this->${relType}\\(\\s*([\\w\\\\:]+)`,
      "g",
    );
    let m;
    while ((m = regex.exec(content)) !== null) {
      if (!relations[relType]) relations[relType] = [];
      // クラス名を取得（User::class → User、App\Models\User → User）
      const target = m[2].replace(/::class$/, "").split("\\").pop();
      relations[relType].push({ method: m[1], model: target });
    }
  }

  return relations;
}
