# Draft: Fix Acceptance Test Fixtures (#12)

## Context
Issue #12 reports multiple problems in acceptance test fixtures:
1. Config bugs: `php` and `node` fixtures reference non-existent preset types
2. CakePHP2 fixture missing files (23 DataSources return null)
3. Laravel fixture gaps (no middleware, no Artisan commands)
4. Webapp template irrelevant chapters for Laravel/Symfony

## Q&A Log

