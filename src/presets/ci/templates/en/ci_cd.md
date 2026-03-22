<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# CI/CD

<!-- {%block "description"%} -->
## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this project's CI/CD setup. Include the platforms used and primary purposes (testing, deployment, etc.)."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "pipelines"%} -->
<!-- {{data("ci.pipelines.list", {header: "## Pipelines\n", labels: "Name|File|Triggers|Jobs", ignoreError: true})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "jobs"%} -->
<!-- {{data("ci.pipelines.jobs", {header: "## Job Details\n", labels: "Pipeline|Job|Runner|Steps|Dependencies", ignoreError: true})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "env"%} -->
<!-- {{data("ci.pipelines.env", {header: "## Secrets & Environment Variables\n", labels: "Pipeline|Secrets|Env Vars", ignoreError: true})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%/block%} -->
