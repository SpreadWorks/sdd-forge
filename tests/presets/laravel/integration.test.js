import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/scan.js");

describe("Laravel scan integration", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("scans a Laravel project with --stdout", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "webapp/laravel",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });

    // Minimal Laravel project structure
    writeFile(tmp, "artisan", "#!/usr/bin/env php\n");
    writeFile(tmp, "composer.json", JSON.stringify({
      require: { "laravel/framework": "^11.0" },
    }));
    writeFile(tmp, ".env.example", "APP_NAME=TestApp\nAPP_ENV=local\n");
    writeFile(tmp, "app/Http/Controllers/Controller.php", `<?php
namespace App\\Http\\Controllers;
class Controller {}
`);
    writeFile(tmp, "app/Http/Controllers/UserController.php", `<?php
namespace App\\Http\\Controllers;
class UserController extends Controller {
    public function index() {}
    public function show(\$id) {}
}
`);
    writeFile(tmp, "app/Models/User.php", `<?php
namespace App\\Models;
use Illuminate\\Database\\Eloquent\\Model;
class User extends Model {
    protected \$fillable = ['name', 'email'];
    public function posts() {
        return \$this->hasMany(Post::class);
    }
}
`);
    writeFile(tmp, "routes/web.php", `<?php
Route::get('/', [HomeController::class, 'index']);
Route::get('/users', [UserController::class, 'index']);
`);
    writeFile(tmp, "routes/api.php", `<?php
Route::get('/users', [UserController::class, 'index']);
`);
    writeFile(tmp, "database/migrations/2024_01_01_create_users.php", `<?php
Schema::create('users', function (Blueprint \$table) {
    \$table->id();
    \$table->string('name');
    \$table->string('email')->unique();
    \$table->timestamps();
});
`);

    const result = execFileSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const analysis = JSON.parse(result);
    assert.ok(analysis.analyzedAt);

    // DataSource results should be at top level (no extras)
    assert.equal(analysis.extras, undefined, "extras should not exist");
    assert.ok(analysis.controllers?.laravelControllers, "should have laravelControllers");
    assert.ok(analysis.models?.laravelModels, "should have laravelModels");
    assert.ok(analysis.routes?.laravelRoutes, "should have laravelRoutes");
    assert.ok(analysis.tables?.migrations, "should have migrations");
    assert.ok(analysis.config?.composerDeps, "should have composerDeps");
    assert.ok(analysis.config?.envKeys, "should have envKeys");
  });

  it("type alias 'laravel' resolves correctly", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "laravel",
      docs: { languages: ["ja"], defaultLanguage: "ja" },
    });
    writeFile(tmp, "artisan", "#!/usr/bin/env php\n");
    writeFile(tmp, "composer.json", "{}");

    const result = execFileSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const analysis = JSON.parse(result);
    assert.ok(analysis.analyzedAt);
  });
});
