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

  // Route::resource / Route::apiResource
  const resourceRegex = /Route::(?:api)?[Rr]esource\s*\(\s*['"]([^'"]+)['"]\s*,\s*([\w\\:]+)/g;
  while ((m = resourceRegex.exec(content)) !== null) {
    const uri = m[1];
    const controller = m[2].replace(/::class$/, "").split("\\").pop();
    const isApi = m[0].includes("apiResource");
    const actions = isApi
      ? ["index", "store", "show", "update", "destroy"]
      : ["index", "create", "store", "show", "edit", "update", "destroy"];

    for (const action of actions) {
      routes.push({
        httpMethod: resourceMethod(action),
        uri: routeType === "api" ? `/api/${uri}` : `/${uri}`,
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
