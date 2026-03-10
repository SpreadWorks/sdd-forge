#!/usr/bin/env node
/**
 * tools/analyzers/analyze-models.js
 *
 * app/Model/*.php + app/Model/Logic/*.php を走査し、
 * テーブル名・DB設定・リレーション・バリデーション等を抽出する。
 */

import fs from "fs";
import path from "path";
import { getFileStats } from "../../../docs/lib/scanner.js";
import {
  stripBlockComments,
  extractArrayBody,
  extractTopLevelKeys,
  extractQuotedStrings,
  camelToSnake,
  pluralize,
} from "../../../docs/lib/php-array-parser.js";

const RELATION_TYPES = [
  "belongsTo",
  "hasMany",
  "hasOne",
  "hasAndBelongsToMany",
];

function extractStringProperty(src, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:var|public|protected|private)\\s+\\$${escaped}\\s*=\\s*['"]([^'"]+)['"]`,
  );
  const m = re.exec(src);
  return m ? m[1] : null;
}

function inferTableName(className) {
  const snake = camelToSnake(className);
  return pluralize(snake);
}

export function analyzeModels(appDir) {
  const dirs = [
    { dir: path.join(appDir, "Model"), isLogic: false },
    { dir: path.join(appDir, "Model", "Logic"), isLogic: true },
  ];

  const models = [];

  for (const { dir, isLogic } of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".php") && f !== "AppModel.php");

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const raw = fs.readFileSync(filePath, "utf8");
      const src = stripBlockComments(raw);

      const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
      if (!classMatch) continue;

      const className = classMatch[1];
      const parentClass = classMatch[2];

      const useTable = extractStringProperty(src, "useTable");
      const useDbConfig = extractStringProperty(src, "useDbConfig");
      const primaryKey = extractStringProperty(src, "primaryKey");
      const displayField = extractStringProperty(src, "displayField");

      const relations = {};
      for (const relType of RELATION_TYPES) {
        const body = extractArrayBody(src, relType);
        if (body) {
          relations[relType] = extractTopLevelKeys(body);
        }
      }

      const validateBody = extractArrayBody(src, "validate");
      const validateFields = validateBody
        ? extractTopLevelKeys(validateBody)
        : [];

      const actsAsBody = extractArrayBody(src, "actsAs");
      const actsAs = actsAsBody ? extractQuotedStrings(actsAsBody) : [];

      const tableName = useTable || inferTableName(className);
      const isFe = className.startsWith("Fe");

      models.push({
        file: path.relative(path.resolve(appDir, ".."), filePath),
        className,
        parentClass,
        isLogic,
        isFe,
        useTable: useTable || null,
        useDbConfig: useDbConfig || null,
        primaryKey: primaryKey || null,
        displayField: displayField || null,
        tableName,
        relations,
        validateFields,
        actsAs,
        ...getFileStats(filePath),
      });
    }
  }

  models.sort((a, b) => a.className.localeCompare(b.className));

  const dbGroups = {};
  for (const m of models) {
    const db = m.useDbConfig || "default";
    if (!dbGroups[db]) dbGroups[db] = [];
    dbGroups[db].push(m.className);
  }

  return {
    models,
    summary: {
      total: models.length,
      feModels: models.filter((m) => m.isFe).length,
      logicModels: models.filter((m) => m.isLogic).length,
      dbGroups,
    },
  };
}
