<!-- @extends -->

<!-- @block: dependencies -->
### PHP Dependencies (composer.json)

<!-- {{data: laravel.config.composer("Package|Version|Purpose")}} -->
<!-- {{/data}} -->

### docker-compose.yml Configuration

<!-- {{data: laravel.docker.list("Service|Container|Port|Image")}} -->
<!-- {{/data}} -->

### Middleware

<!-- {{data: laravel.config.middleware("Class|File|Purpose")}} -->
<!-- {{/data}} -->

### Service Providers

<!-- {{data: laravel.config.providers("Provider|File|register|boot")}} -->
<!-- {{/data}} -->

### Configuration Files

<!-- {{data: laravel.config.files("File|Key Settings")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: deploy -->
### Deployment Flow

<!-- {{text: Describe the Laravel project deployment procedure. Include php artisan commands (migrate, config:cache, route:cache, etc.).}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: operations -->
### Operations Flow

<!-- {{text: Describe the Laravel project operations procedures. Include queue workers, scheduler, logging, etc.}} -->
<!-- {{/text}} -->
<!-- @endblock -->
