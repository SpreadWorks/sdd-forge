<!-- {%extends%} -->

<!-- {%block "routing"%} -->
### Routing Configuration

<!-- {{text({prompt: "Describe the Symfony routing approach. Include the roles of #[Route] attributes and config/routes.yaml.", mode: "deep"})}} -->
<!-- {{/text}} -->

<!-- {{data("symfony.routes.list", {labels: "Method|Path|Controller|Name"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-list"%} -->
### Controller List

<!-- {{data("symfony.controllers.list", {labels: "Controller|File|Primary Responsibility"})}} -->
<!-- {{/data}} -->

### Controller-Action List

<!-- {{data("symfony.controllers.actions", {labels: "Controller|Action"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-deps"%} -->
### DI Dependencies

<!-- {{data("symfony.controllers.di", {labels: "Controller|Dependency Service"})}} -->
<!-- {{/data}} -->

### Doctrine Relations

<!-- {{data("symfony.entities.relations", {labels: "Entity|Relations"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "components"%} -->
### Console Commands

<!-- {{data("symfony.commands.list", {labels: "Command|File|Description"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
