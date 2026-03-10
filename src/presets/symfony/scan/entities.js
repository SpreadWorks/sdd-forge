/**
 * Symfony Doctrine エンティティ解析器。
 * src/Entity/ 配下の PHP ファイルを解析し、
 * クラス名・テーブル名・カラム・リレーション・リポジトリを抽出する。
 */

import fs from "fs";
import path from "path";
import { findFiles, camelToSnake } from "../../../docs/lib/scanner.js";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ entities: Object[], summary: { total: number } }}
 */
export function analyzeEntities(sourceRoot) {
  const baseDir = path.join(sourceRoot, "src", "Entity");
  if (!fs.existsSync(baseDir)) return { entities: [], summary: { total: 0 } };

  const files = findFiles(baseDir, "*.php", [], true);
  const entities = [];
  for (const f of files) {
    const content = fs.readFileSync(f.absPath, "utf8");
    if (/#\[ORM\\Entity/.test(content) || /#\[ORM\\Table/.test(content)) {
      entities.push({
        ...parseEntity(f.absPath, f.relPath),
        lines: f.lines, hash: f.hash, mtime: f.mtime,
      });
    }
  }

  return { entities, summary: { total: entities.length } };
}


function parseEntity(filePath, relPath) {
  const content = fs.readFileSync(filePath, "utf8");

  // クラス名
  const classMatch = content.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, ".php");

  // #[ORM\Table(name: 'xxx')] or #[ORM\Entity(repositoryClass: Xxx::class)]
  const tableMatch = content.match(/#\[ORM\\Table\s*\(\s*name:\s*['"](\w+)['"]/);
  const tableName = tableMatch ? tableMatch[1] : camelToSnake(className);

  const repoMatch = content.match(/#\[ORM\\Entity\s*\(\s*repositoryClass:\s*([\w\\]+)(?:::class)?/);
  const repositoryClass = repoMatch ? repoMatch[1].split("\\").pop() : "";

  // カラム (#[ORM\Column] attributes)
  const columns = extractColumns(content);

  // リレーション
  const relations = extractRelations(content);

  return {
    file: path.join("src/Entity", relPath),
    className,
    tableName,
    repositoryClass,
    columns,
    relations,
  };
}

function extractColumns(content) {
  const columns = [];
  const lines = content.split("\n");

  // Collect attribute lines above each property declaration
  const attrBuffer = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Accumulate #[ORM\...] attribute lines
    if (/^\s*#\[ORM\\/.test(line)) {
      attrBuffer.push(trimmed);
      continue;
    }

    // Property declaration
    const propMatch = trimmed.match(/^(?:private|protected|public)\s+(\??\w+)\s+\$(\w+)/);
    if (propMatch) {
      const attrBlock = attrBuffer.join("\n");
      const phpType = propMatch[1];
      const propName = propMatch[2];

      const hasColumn = /#\[ORM\\Column/.test(attrBlock);
      const hasId = /#\[ORM\\Id\b/.test(attrBlock);

      if (hasColumn || hasId) {
        const typeMatch = attrBlock.match(/#\[ORM\\Column\s*\([^)]*type:\s*['"](\w+)['"]/);
        const type = typeMatch ? typeMatch[1] : phpType.replace(/^\?/, "") || "string";

        const lengthMatch = attrBlock.match(/#\[ORM\\Column\s*\([^)]*length:\s*(\d+)/);
        const length = lengthMatch ? parseInt(lengthMatch[1]) : null;

        const nullable = /#\[ORM\\Column\s*\([^)]*nullable:\s*true/.test(attrBlock) || phpType.startsWith("?");

        columns.push({ name: propName, type, length, nullable, id: hasId });
      }

      attrBuffer.length = 0;
      continue;
    }

    // Non-attribute, non-property line — reset buffer
    if (trimmed && !trimmed.startsWith("#[")) {
      attrBuffer.length = 0;
    }
  }

  return columns;
}

function extractRelations(content) {
  const relations = {};
  const relTypes = [
    "OneToMany", "ManyToOne", "OneToOne", "ManyToMany",
  ];

  for (const relType of relTypes) {
    const regex = new RegExp(
      `#\\[ORM\\\\${relType}\\s*\\(([^)]*?)\\)\\][\\s\\S]*?(?:private|protected|public)\\s+\\??\\w+\\s+\\$(\\w+)`,
      "g",
    );
    let m;
    while ((m = regex.exec(content)) !== null) {
      const attrContent = m[1];
      const propName = m[2];

      // targetEntity: Xxx::class or Xxx::class
      const targetMatch = attrContent.match(/targetEntity:\s*([\w\\]+?)(?:::class)?(?:[,\s)]|$)/);
      const target = targetMatch ? targetMatch[1].split("\\").pop() : "";

      if (!relations[relType]) relations[relType] = [];
      relations[relType].push({ property: propName, target });
    }
  }

  return relations;
}
