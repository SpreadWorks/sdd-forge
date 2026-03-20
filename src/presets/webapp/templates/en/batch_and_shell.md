<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# Batch & Console Commands

<!-- {%block "description"%} -->
## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of commands and whether scheduled execution is used."})}} -->
<!-- {{/text}} -->

## Content
<!-- {%/block%} -->

<!-- {%block "command-list"%} -->
### Command List

<!-- {{data("webapp.shells.list", {labels: "Command|File|Purpose"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "command-deps"%} -->
### Command Dependencies

<!-- {{text({prompt: "Describe the class dependencies loaded by each command.", mode: "deep"})}} -->
<!-- {{/text}} -->

<!-- {{data("webapp.shells.deps", {labels: "Command|Dependency|Type"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "command-flow"%} -->
### Command Execution Flow

<!-- {{data("webapp.shells.flow", {labels: "Command|Process Summary|Email|File Ops|Transaction"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "schedule"%} -->
### Scheduled Execution

<!-- {{text({prompt: "Describe the scheduled execution configuration."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
