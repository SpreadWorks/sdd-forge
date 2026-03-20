<!-- @extends: layout -->
<!-- @block: content -->
# CI/CD

<!-- @block: description -->
## Description

<!-- {{text: Write a 1-2 sentence overview of this project's CI/CD setup. Include the platforms used and primary purposes (testing, deployment, etc.).}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: pipelines -->
## Pipelines

<!-- {{data: ci.pipelines.list("Name|File|Triggers|Jobs")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: jobs -->
## Job Details

<!-- {{data: ci.pipelines.jobs("Pipeline|Job|Runner|Steps|Dependencies")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: env -->
## Secrets & Environment Variables

<!-- {{data: ci.pipelines.env("Pipeline|Secrets|Env Vars")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @endblock -->
