/**
 * Laravel ルート解析器。
 * routes/web.php, routes/api.php を解析し、
 * URI・HTTPメソッド・コントローラ・ミドルウェアを抽出する。
 */

import fs from "fs";
import path from "path";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ routes: Object[], summary: { total: number, apiRoutes: number, webRoutes: number } }}
 */
export function analyzeRoutes(sourceRoot) {
  const routeFiles = [
    { file: "routes/web.php", routeType: "web" },
    { file: "routes/api.php", routeType: "api" },
  ];

  const routes = [];

  for (const { file, routeType } of routeFiles) {
    const filePath = path.join(sourceRoot, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    routes.push(...parseRouteFile(content, routeType));
  }

  const apiRoutes = routes.filter((r) => r.routeType === "api").length;
  const webRoutes = routes.filter((r) => r.routeType === "web").length;

  return { routes, summary: { total: routes.length, apiRoutes, webRoutes } };
}

function parseRouteFile(content, routeType) {
  const routes = [];

  // Route::get('/path', [Controller::class, 'method'])
  // Route::post('/path', 'Controller@method')
  // Route::any(...), Route::match(...), Route::put, Route::patch, Route::delete
  const methods = "get|post|put|patch|delete|any|options";
  const routeRegex = new RegExp(
    `Route::(?:${methods})\\s*\\(\\s*['"]([^'"]+)['"]\\s*,\\s*(.+?)\\s*\\)`,
    "g",
  );

  let m;
  while ((m = routeRegex.exec(content)) !== null) {
    const httpMethod = m[0].match(/Route::(\w+)/)[1].toUpperCase();
    const uri = m[1];
    const handler = m[2];
    const parsed = parseHandler(handler);

    routes.push({
      httpMethod: httpMethod === "ANY" ? "*" : httpMethod,
      uri: routeType === "api" ? `/api${uri}` : uri,
      controller: parsed.controller,
      action: parsed.action,
      routeType,
    });
  }

  // Route::resource / Route::apiResource (with optional ->only() / ->except())
  const resourceRegex = /Route::(?:api)?[Rr]esource\s*\(\s*['"]([^'"]+)['"]\s*,\s*([\w\\:]+)\s*\)([^\n;]*)/g;
  while ((m = resourceRegex.exec(content)) !== null) {
    const resourceName = m[1];
    const controller = m[2].replace(/::class$/, "").split("\\").pop();
    const chain = m[3];
    const isApi = m[0].includes("apiResource");
    const allActions = isApi
      ? ["index", "store", "show", "update", "destroy"]
      : ["index", "create", "store", "show", "edit", "update", "destroy"];
    const actions = filterResourceActions(allActions, chain);

    const baseUri = buildResourceUri(resourceName, routeType);

    for (const action of actions) {
      routes.push({
        httpMethod: resourceMethod(action),
        uri: resourceActionUri(baseUri, resourceName, action),
        controller,
        action,
        routeType,
      });
    }
  }

  return routes;
}

function parseHandler(handler) {
  // [UserController::class, 'index']
  const arrayMatch = handler.match(/\[\s*([\w\\:]+)\s*,\s*['"](\w+)['"]\s*\]/);
  if (arrayMatch) {
    const controller = arrayMatch[1].replace(/::class$/, "").split("\\").pop();
    return { controller, action: arrayMatch[2] };
  }

  // 'UserController@index'
  const strMatch = handler.match(/['"](\w+)@(\w+)['"]/);
  if (strMatch) {
    return { controller: strMatch[1], action: strMatch[2] };
  }

  // クロージャや単一アクションコントローラ
  const classMatch = handler.match(/([\w\\]+)::class/);
  if (classMatch) {
    return { controller: classMatch[1].split("\\").pop(), action: "__invoke" };
  }

  return { controller: "", action: "" };
}

function parseStringList(str) {
  const items = [];
  const re = /['"](\w+)['"]/g;
  let match;
  while ((match = re.exec(str)) !== null) items.push(match[1]);
  return items;
}

function filterResourceActions(actions, chain) {
  const onlyMatch = chain.match(/->only\s*\(\s*\[([^\]]*)\]\s*\)/);
  if (onlyMatch) {
    const allowed = parseStringList(onlyMatch[1]);
    return actions.filter((a) => allowed.includes(a));
  }
  const exceptMatch = chain.match(/->except\s*\(\s*\[([^\]]*)\]\s*\)/);
  if (exceptMatch) {
    const excluded = parseStringList(exceptMatch[1]);
    return actions.filter((a) => !excluded.includes(a));
  }
  return actions;
}

function singularize(name) {
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("ses") || name.endsWith("xes") || name.endsWith("zes") ||
      name.endsWith("shes") || name.endsWith("ches")) return name.slice(0, -2);
  if (name.endsWith("s")) return name.slice(0, -1);
  return name;
}

function buildResourceUri(resourceName, routeType) {
  const segments = resourceName.split(".");
  const parts = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    parts.push(seg);
    if (i < segments.length - 1) {
      parts.push(`{${singularize(seg)}}`);
    }
  }
  const base = "/" + parts.join("/");
  return routeType === "api" ? `/api${base}` : base;
}

function resourceActionUri(baseUri, resourceName, action) {
  const lastSegment = resourceName.split(".").pop();
  const param = singularize(lastSegment);
  const needsParam = ["show", "edit", "update", "destroy"].includes(action);
  const suffix = needsParam ? `/{${param}}` : "";
  const editSuffix = action === "edit" ? "/edit" : "";
  return baseUri + suffix + editSuffix;
}

function resourceMethod(action) {
  const map = {
    index: "GET",
    create: "GET",
    store: "POST",
    show: "GET",
    edit: "GET",
    update: "PUT",
    destroy: "DELETE",
  };
  return map[action] || "GET";
}
