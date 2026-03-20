<!-- @extends: layout -->
<!-- @block: content -->
# Project Structure

<!-- {{data[ignoreError=true]: monorepo.monorepo.apps("project_structure")}} -->
<!-- {{/data}} -->

<!-- @block: description -->
## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles.}} -->
<!-- {{/text}} -->

## Content
<!-- @endblock -->

<!-- @block: directory-tree -->
### Directory Layout

<!-- {{data: base.structure.tree()}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: directory-roles -->
### Directory Responsibilities

<!-- {{data: base.structure.directories("Directory|Files|Role")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: libraries -->
### Shared Libraries

<!-- {{data: base.libs.list("Class|File|Responsibility")}} -->
<!-- {{/data}} -->
<!-- @endblock -->
<!-- @endblock -->
