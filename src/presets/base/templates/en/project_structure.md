<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

<!-- {%block "description"%} -->
## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->
<!-- {{/text}} -->

## Content
<!-- {%/block%} -->

<!-- {%block "directory-tree"%} -->
### Directory Layout

<!-- {{data: base.structure.tree()}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "directory-roles"%} -->
### Directory Responsibilities

<!-- {{data("base.structure.directories", {labels: "Directory|Files|Role"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "libraries"%} -->
### Shared Libraries

<!-- {{text({prompt: "List the shared libraries (class name, file, responsibility) in table format."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
