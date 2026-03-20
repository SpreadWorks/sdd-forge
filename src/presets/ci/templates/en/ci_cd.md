<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# CI/CD

<!-- {%block "description"%} -->
## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this project's CI/CD setup. Include the platforms used and primary purposes (testing, deployment, etc.)."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "pipelines"%} -->
## Pipelines

<!-- {{data("ci.pipelines.list", {labels: "Name|File|Triggers|Jobs"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "jobs"%} -->
## Job Details

<!-- {{data("ci.pipelines.jobs", {labels: "Pipeline|Job|Runner|Steps|Dependencies"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "env"%} -->
## Secrets & Environment Variables

<!-- {{data("ci.pipelines.env", {labels: "Pipeline|Secrets|Env Vars"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%/block%} -->
