<!-- {%extends%} -->

<!-- {%block "dependencies"%} -->
### PHP Dependencies (composer.json)

<!-- {{data("symfony.config.composer", {labels: "Package|Version|Purpose"})}} -->
<!-- {{/data}} -->

### Symfony Bundles

<!-- {{data("symfony.config.bundles", {labels: "Bundle|Fully Qualified Name|Purpose"})}} -->
<!-- {{/data}} -->

### Configuration Files (config/packages/)

<!-- {{data("symfony.config.packages", {labels: "File|Key Settings"})}} -->
<!-- {{/data}} -->

### Service Configuration

<!-- {{data("symfony.config.services", {labels: "autowire|autoconfigure"})}} -->
<!-- {{/data}} -->

### docker-compose.yml Configuration

<!-- {{data("symfony.docker.list", {labels: "Service|Container|Port|Image"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "deploy"%} -->
### Deployment Flow

<!-- {{text({prompt: "Describe the Symfony project deployment procedure. Include bin/console commands (doctrine:migrations:migrate, cache:clear, assets:install, etc.)."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "operations"%} -->
### Operations Flow

<!-- {{text({prompt: "Describe the Symfony project operations procedures. Include Messenger workers, scheduler, logging (Monolog), etc."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
