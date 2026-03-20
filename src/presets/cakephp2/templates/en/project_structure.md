<!-- {%extends%} -->

<!-- {%block "directory-tree"%} -->
### Directory Structure

<!-- {{text({prompt: "Output the project directory listing in tree format."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "directory-roles"%} -->
### Directory Responsibilities

<!-- {{text({prompt: "Describe the responsibilities of main directories (Config/Console/Controller/Model/View/Lib/Plugin) with file counts in table format."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "libraries"%} -->
### Common Libraries (Lib/)

<!-- {{data("cakephp2.libs.list", {labels: "Class|File|Responsibility"})}} -->
<!-- {{/data}} -->

### View Layer

#### Helpers

<!-- {{data("cakephp2.views.helpers", {labels: "Helper|Extends|Responsibility"})}} -->
<!-- {{/data}} -->

#### Layouts

<!-- {{data("cakephp2.views.layouts", {labels: "File|Purpose"})}} -->
<!-- {{/data}} -->

#### Elements

<!-- {{data("cakephp2.views.elements", {labels: "File|Purpose"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
