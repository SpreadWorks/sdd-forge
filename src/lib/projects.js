/**
 * src/lib/projects.js
 *
 * projects.json の CRUD ユーティリティ。
 * projects.json は process.cwd() に配置する。
 */

import fs from "fs";
import path from "path";

function projectsFilePath() {
  return path.join(process.cwd(), ".sdd-forge", "projects.json");
}

/**
 * プロジェクトの作業ルートを返す。
 * projects.json に workRoot が指定されていればそれを使用し、
 * なければ path（ソースルート）を返す。
 *
 * @param {string} name - プロジェクト名
 * @returns {string} 作業ルートの絶対パス
 */
export function workRootFor(name) {
  const data = loadProjects();
  if (!data) {
    throw new Error("projects.json not found.");
  }
  const project = data.projects[name];
  if (!project) {
    throw new Error(`Project '${name}' not found in projects.json`);
  }
  return project.workRoot || project.path;
}

/**
 * projects.json を読み込む。存在しなければ null を返す。
 */
export function loadProjects() {
  const file = projectsFilePath();
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveProjects(data) {
  fs.writeFileSync(projectsFilePath(), JSON.stringify(data, null, 2) + "\n");
}

/**
 * プロジェクトを追加する。
 *
 * @param {string} name
 * @param {string} projectPath - ソースコードの絶対パス
 * @param {Object} [options]
 * @param {string} [options.workRoot] - 出力先パス（省略時は projectPath と同じ）
 * @param {boolean} [options.setDefault] - デフォルトに設定するか
 * @returns {Object} 更新後の projects データ
 */
export function addProject(name, projectPath, options = {}) {
  const data = loadProjects() || { projects: {} };
  if (data.projects[name]) {
    throw new Error(`Project '${name}' already exists.`);
  }

  const resolved = path.resolve(projectPath);
  const entry = { path: resolved };

  // workRoot が path と異なる場合のみ記録
  if (options.workRoot) {
    const resolvedWork = path.resolve(options.workRoot);
    if (resolvedWork !== resolved) {
      entry.workRoot = resolvedWork;
    }
  }

  data.projects[name] = entry;

  // 初回追加時 or 明示的に指定された場合、デフォルトに設定
  const isFirst = Object.keys(data.projects).length === 1;
  if (isFirst || options.setDefault) {
    data.default = name;
  }

  saveProjects(data);
  return data;
}

/**
 * デフォルトプロジェクトを変更する。
 *
 * @param {string} name
 */
export function setDefault(name) {
  const data = loadProjects();
  if (!data) {
    throw new Error("projects.json not found. Run: sdd-forge setup");
  }
  if (!data.projects[name]) {
    throw new Error(`Project '${name}' not found.`);
  }
  data.default = name;
  saveProjects(data);
}

/**
 * プロジェクトを解決する。
 * name 指定があれば優先、なければ default を使用。
 * projects.json がなければ null を返す（既存動作にフォールバック）。
 *
 * @param {string|undefined} name
 * @returns {{ name: string, path: string } | null}
 */
export function resolveProject(name) {
  const data = loadProjects();
  if (!data) return null;

  const key = name || data.default;
  if (!key) {
    throw new Error("No default project set. Use: sdd-forge default <name>");
  }

  const project = data.projects[key];
  if (!project) {
    throw new Error(`Project '${key}' not found in projects.json`);
  }

  return { name: key, path: project.path };
}
