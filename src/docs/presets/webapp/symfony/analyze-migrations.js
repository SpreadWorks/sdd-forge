/**
 * Symfony Doctrine マイグレーション解析器。
 * migrations/ 配下の PHP ファイルを解析し、
 * テーブル名・カラム操作を抽出する。
 */

import fs from "fs";
import path from "path";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ tables: Object[], summary: { total: number, totalColumns: number } }}
 */
export function analyzeMigrations(sourceRoot) {
  const migrationsDir = path.join(sourceRoot, "migrations");
  if (!fs.existsSync(migrationsDir)) return { tables: [], summary: { total: 0, totalColumns: 0 } };

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".php"))
    .sort();

  const tableMap = new Map();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    parseMigration(content, file, tableMap);
  }

  const tables = [...tableMap.values()];
  const totalColumns = tables.reduce((s, t) => s + t.columns.length, 0);

  return { tables, summary: { total: tables.length, totalColumns } };
}

function parseMigration(content, fileName, tableMap) {
  // Doctrine Migration の SQL パターン
  // $this->addSql('CREATE TABLE xxx (...)');
  const createTableRegex = /\$this->addSql\s*\(\s*['"]CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi;
  let m;
  while ((m = createTableRegex.exec(content)) !== null) {
    const tableName = m[1];
    const body = m[2];

    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, columns: [], foreignKeys: [], migrationFiles: [] });
    }
    const entry = tableMap.get(tableName);
    entry.migrationFiles.push(fileName);
    parseCreateTableSql(body, entry);
  }

  // ALTER TABLE パターン
  const alterRegex = /\$this->addSql\s*\(\s*['"]ALTER TABLE\s+(\w+)\s+(.*?)['"]\s*\)/gi;
  while ((m = alterRegex.exec(content)) !== null) {
    const tableName = m[1];
    const alterBody = m[2];

    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, columns: [], foreignKeys: [], migrationFiles: [] });
    }
    const entry = tableMap.get(tableName);
    if (!entry.migrationFiles.includes(fileName)) entry.migrationFiles.push(fileName);
    parseAlterTable(alterBody, entry);
  }

  // Doctrine DBAL Schema API パターン
  // $table = $schema->createTable('xxx');
  const dbalCreateRegex = /\$schema->createTable\s*\(\s*['"](\w+)['"]\s*\)/g;
  while ((m = dbalCreateRegex.exec(content)) !== null) {
    const tableName = m[1];
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, columns: [], foreignKeys: [], migrationFiles: [] });
    }
    const entry = tableMap.get(tableName);
    entry.migrationFiles.push(fileName);
  }

  // $table->addColumn('name', 'string', ['length' => 255])
  const addColRegex = /->addColumn\s*\(\s*['"](\w+)['"]\s*,\s*['"](\w+)['"]\s*(?:,\s*\[([^\]]*)\])?\)/g;
  while ((m = addColRegex.exec(content)) !== null) {
    // Find which table this belongs to - use the most recent table
    const lastTable = [...tableMap.values()].pop();
    if (lastTable) {
      const opts = m[3] || "";
      const nullable = /['"]notnull['"]\s*=>\s*false/.test(opts);
      const lengthMatch = opts.match(/['"]length['"]\s*=>\s*(\d+)/);
      lastTable.columns.push({
        name: m[1],
        type: m[2],
        nullable,
        length: lengthMatch ? parseInt(lengthMatch[1]) : null,
      });
    }
  }
}

function parseCreateTableSql(body, entry) {
  // SQL カラム定義: column_name TYPE [NOT NULL] [DEFAULT xxx]
  const parts = body.split(",");
  for (const part of parts) {
    const trimmed = part.trim();

    // PRIMARY KEY, CONSTRAINT, INDEX は飛ばす
    if (/^(?:PRIMARY KEY|CONSTRAINT|INDEX|UNIQUE|FOREIGN KEY)/i.test(trimmed)) {
      // FOREIGN KEY 解析
      const fkMatch = trimmed.match(/FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/i);
      if (fkMatch) {
        entry.foreignKeys.push({ column: fkMatch[1], references: fkMatch[3], on: fkMatch[2] });
      }
      continue;
    }

    // column_name TYPE ...
    const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\(\d+(?:,\s*\d+)?\))?)/);
    if (colMatch) {
      const name = colMatch[1];
      const type = colMatch[2].replace(/\(.*\)/, "");
      const nullable = !/NOT NULL/i.test(trimmed);
      const defaultMatch = trimmed.match(/DEFAULT\s+(\S+)/i);
      entry.columns.push({
        name,
        type: type.toUpperCase(),
        nullable,
        default: defaultMatch ? defaultMatch[1] : null,
      });
    }
  }
}

function parseAlterTable(alterBody, entry) {
  // ADD column_name TYPE
  const addColMatch = alterBody.match(/ADD\s+(\w+)\s+(\w+(?:\(\d+\))?)/i);
  if (addColMatch) {
    const type = addColMatch[2].replace(/\(.*\)/, "");
    entry.columns.push({
      name: addColMatch[1],
      type: type.toUpperCase(),
      nullable: !/NOT NULL/i.test(alterBody),
      default: null,
    });
  }

  // ADD CONSTRAINT ... FOREIGN KEY (col) REFERENCES table(col)
  const fkMatch = alterBody.match(/FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/i);
  if (fkMatch) {
    entry.foreignKeys.push({ column: fkMatch[1], references: fkMatch[3], on: fkMatch[2] });
  }
}
