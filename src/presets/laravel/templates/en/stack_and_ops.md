<!-- @extends -->

<!-- @block: dependencies -->
### PHP Dependencies (composer.json)

<!-- {{data: config.composer("Package|Version|Purpose")}} -->
<!-- {{/data}} -->

### docker-compose.yml Configuration

<!-- {{data: docker.list("Service|Container|Port|Image")}} -->
<!-- {{/data}} -->

### Middleware

<!-- {{data: config.middleware("Class|File|Purpose")}} -->
<!-- {{/data}} -->

### Service Providers

<!-- {{data: config.providers("Provider|File|register|boot")}} -->
<!-- {{/data}} -->

### Configuration Files

<!-- {{data: config.files("File|Key Settings")}} -->
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
