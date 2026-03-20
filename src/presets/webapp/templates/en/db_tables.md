<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# DB Table Definitions

<!-- {%block "description"%} -->
## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of tables and FK relationships."})}} -->
<!-- {{/text}} -->

## Content
<!-- {%/block%} -->

<!-- {%block "table-list"%} -->
### Table List

<!-- {{data("webapp.tables.list", {labels: "Table|DB|Primary Purpose"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "fk"%} -->
### Foreign Key Relationships (FK)

<!-- {{data("webapp.tables.fk", {labels: "Parent Table|Child Table|FK Column|Notes"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "indexes"%} -->
### Indexes

Index definitions should be verified directly from the DB schema.
<!-- {%/block%} -->
<!-- {%/block%} -->
