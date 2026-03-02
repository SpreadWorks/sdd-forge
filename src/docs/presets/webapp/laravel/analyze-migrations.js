/**
 * Laravel マイグレーション解析器。
 * database/migrations/ 配下の PHP ファイルを解析し、
 * テーブル名・カラム・インデックス・外部キーを抽出する。
 */

import fs from "fs";
import path from "path";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ tables: Object[], summary: { total: number, totalColumns: number } }}
 */
export function analyzeMigrations(sourceRoot) {
  const migrationsDir = path.join(sourceRoot, "database", "migrations");
  if (!fs.existsSync(migrationsDir)) return { tables: [], summary: { total: 0, totalColumns: 0 } };

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".php"))
    .sort();

  // テーブルごとの状態を蓄積（複数マイグレーションで同一テーブルを変更）
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
  // Schema::create('table_name', function (Blueprint $table) { ... })
  const createRegex = /Schema::create\s*\(\s*['"](\w+)['"]\s*,\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\)/g;
  let m;
  while ((m = createRegex.exec(content)) !== null) {
    const tableName = m[1];
    const body = m[2];
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, columns: [], indexes: [], foreignKeys: [], migrationFiles: [] });
    }
    const entry = tableMap.get(tableName);
    entry.migrationFiles.push(fileName);
    parseBlueprint(body, entry);
  }

  // Schema::table('table_name', function ...) — alter
  const tableRegex = /Schema::table\s*\(\s*['"](\w+)['"]\s*,\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\)/g;
  while ((m = tableRegex.exec(content)) !== null) {
    const tableName = m[1];
    const body = m[2];
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, columns: [], indexes: [], foreignKeys: [], migrationFiles: [] });
    }
    const entry = tableMap.get(tableName);
    entry.migrationFiles.push(fileName);
    parseBlueprint(body, entry);
  }
}

function parseBlueprint(body, entry) {
  // カラム定義: $table->type('name') or $table->type('name', ...)
  const colRegex = /\$table->(\w+)\(\s*['"](\w+)['"](?:\s*,\s*([^)]*))?\)/g;
  const columnTypes = new Set([
    "bigIncrements", "increments", "id",
    "string", "char", "text", "mediumText", "longText",
    "integer", "tinyInteger", "smallInteger", "mediumInteger", "bigInteger",
    "unsignedBigInteger", "unsignedInteger", "unsignedTinyInteger", "unsignedSmallInteger", "unsignedMediumInteger",
    "float", "double", "decimal", "unsignedDecimal",
    "boolean",
    "date", "dateTime", "dateTimeTz", "time", "timeTz", "timestamp", "timestampTz",
    "year",
    "binary",
    "enum", "set",
    "json", "jsonb",
    "uuid", "ulid",
    "ipAddress", "macAddress",
    "foreignId", "foreignUuid",
    "morphs", "nullableMorphs", "uuidMorphs", "nullableUuidMorphs",
    "rememberToken", "softDeletes", "softDeletesTz",
  ]);

  let m;
  while ((m = colRegex.exec(body)) !== null) {
    const type = m[1];
    const name = m[2];
    if (columnTypes.has(type)) {
      // 修飾子チェック（nullable, default 等）
      const lineEnd = body.indexOf(";", m.index);
      const line = body.slice(m.index, lineEnd > -1 ? lineEnd : undefined);
      const nullable = /->nullable\b/.test(line);
      const hasDefault = line.match(/->default\(\s*(.+?)\s*\)/);

      entry.columns.push({
        name,
        type,
        nullable,
        default: hasDefault ? hasDefault[1] : null,
      });
    }
  }

  // 引数なしのカラムメソッド: $table->id(), $table->timestamps(), etc.
  const noArgRegex = /\$table->(id|timestamps|timestampsTz|softDeletes|softDeletesTz|rememberToken)\s*\(\s*\)/g;
  while ((m = noArgRegex.exec(body)) !== null) {
    const type = m[1];
    if (type === "id") {
      entry.columns.push({ name: "id", type: "bigIncrements", nullable: false, default: null });
    } else if (type === "timestamps" || type === "timestampsTz") {
      entry.columns.push({ name: "created_at", type: "timestamp", nullable: true, default: null });
      entry.columns.push({ name: "updated_at", type: "timestamp", nullable: true, default: null });
    } else if (type === "softDeletes" || type === "softDeletesTz") {
      entry.columns.push({ name: "deleted_at", type: "timestamp", nullable: true, default: null });
    } else if (type === "rememberToken") {
      entry.columns.push({ name: "remember_token", type: "string", nullable: true, default: null });
    }
  }

  // インデックス: $table->index('col') / $table->unique('col') / $table->primary('col')
  const indexRegex = /\$table->(index|unique|primary)\(\s*(?:\[([^\]]*)\]|['"](\w+)['"])/g;
  while ((m = indexRegex.exec(body)) !== null) {
    const indexType = m[1];
    const cols = m[2]
      ? m[2].match(/['"](\w+)['"]/g)?.map((c) => c.replace(/['"]/g, "")) || []
      : [m[3]];
    entry.indexes.push({ type: indexType, columns: cols });
  }

  // 外部キー: $table->foreign('col')->references('id')->on('table')
  const fkRegex = /\$table->foreign\(\s*['"](\w+)['"]\s*\)->references\(\s*['"](\w+)['"]\s*\)->on\(\s*['"](\w+)['"]\s*\)/g;
  while ((m = fkRegex.exec(body)) !== null) {
    entry.foreignKeys.push({ column: m[1], references: m[2], on: m[3] });
  }

  // foreignId の暗黙 FK: $table->foreignId('user_id')->constrained()
  const foreignIdRegex = /\$table->foreignId\(\s*['"](\w+)['"]\s*\)[^;]*->constrained\(\s*(?:['"](\w+)['"])?\s*\)/g;
  while ((m = foreignIdRegex.exec(body)) !== null) {
    const col = m[1];
    const table = m[2] || col.replace(/_id$/, "") + "s";
    entry.foreignKeys.push({ column: col, references: "id", on: table });
  }
}
