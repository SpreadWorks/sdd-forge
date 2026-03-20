<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# Database Architecture

<!-- {%block "description"%} -->
## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of databases, purpose of each DB, and connection switching method."})}} -->
<!-- {{/text}} -->

## Content
<!-- {%/block%} -->

<!-- {%block "db-list"%} -->
### Database List

<!-- {{text({prompt: "Describe the purpose and connection configuration of each database in table format.", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "db-switching"%} -->
### DB Connection Switching

<!-- {{text({prompt: "Describe the database connection switching approach.", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "db-env"%} -->
### Environment-Specific Connection Settings

<!-- {{data("webapp.config.db", {labels: "Environment|DB Host|Notes"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "er-diagram"%} -->
### ER Diagram (Key Tables)

<!-- {{data("webapp.models.er")}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
