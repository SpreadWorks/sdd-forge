/**
 * src/projects/projects.js
 *
 * projects.json の CRUD ユーティリティ。
 * projects.json と projects/ は process.cwd() に配置する。
 */

import fs from "fs";
import path from "path";

function projectsFilePath() {
  return path.join(process.cwd(), "projects.json");
}

export function workRootFor(name) {
  return path.join(process.cwd(), "projects", name);
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
 * 初回追加時はデフォルトに自動設定する。
 *
 * @param {string} name
 * @param {string} projectPath
 * @returns {Object} 更新後の projects データ
 */
export function addProject(name, projectPath) {
  const data = loadProjects() || { projects: {} };
  if (data.projects[name]) {
    throw new Error(`Project '${name}' already exists.`);
  }
  data.projects[name] = { path: path.resolve(projectPath) };
  if (!data.default) data.default = name;
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
    throw new Error("projects.json not found. Run: sdd-forge add <name> <path>");
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
