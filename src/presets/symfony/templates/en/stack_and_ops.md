<!-- @extends -->

<!-- @block: dependencies -->
### PHP Dependencies (composer.json)

<!-- {{data: config.composer("Package|Version|Purpose")}} -->
<!-- {{/data}} -->

### Symfony Bundles

<!-- {{data: config.bundles("Bundle|Fully Qualified Name|Purpose")}} -->
<!-- {{/data}} -->

### Configuration Files (config/packages/)

<!-- {{data: config.packages("File|Key Settings")}} -->
<!-- {{/data}} -->

### Service Configuration

<!-- {{data: config.services("autowire|autoconfigure")}} -->
<!-- {{/data}} -->

### docker-compose.yml Configuration

<!-- {{data: docker.list("Service|Container|Port|Image")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: deploy -->
### Deployment Flow

<!-- {{text: Describe the Symfony project deployment procedure. Include bin/console commands (doctrine:migrations:migrate, cache:clear, assets:install, etc.).}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: operations -->
### Operations Flow

<!-- {{text: Describe the Symfony project operations procedures. Include Messenger workers, scheduler, logging (Monolog), etc.}} -->
<!-- {{/text}} -->
<!-- @endblock -->
