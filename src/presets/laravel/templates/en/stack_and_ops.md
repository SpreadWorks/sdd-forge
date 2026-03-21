<!-- {%extends%} -->

<!-- {%block "dependencies"%} -->
### PHP Dependencies (composer.json)

<!-- {{data("laravel.config.composer", {labels: "Package|Version|Purpose"})}} -->
<!-- {{/data}} -->

### docker-compose.yml Configuration

<!-- {{text({prompt: "Describe the docker-compose.yml service configuration in table format. Include service name, container name, ports, and image."})}} -->
<!-- {{/text}} -->

### Middleware

<!-- {{data("laravel.config.middleware", {labels: "Class|File|Purpose"})}} -->
<!-- {{/data}} -->

### Service Providers

<!-- {{data("laravel.config.providers", {labels: "Provider|File|register|boot"})}} -->
<!-- {{/data}} -->

### Configuration Files

<!-- {{data("laravel.config.files", {labels: "File|Key Settings"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "deploy"%} -->
### Deployment Flow

<!-- {{text({prompt: "Describe the Laravel project deployment procedure. Include php artisan commands (migrate, config:cache, route:cache, etc.)."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "operations"%} -->
### Operations Flow

<!-- {{text({prompt: "Describe the Laravel project operations procedures. Include queue workers, scheduler, logging, etc."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
