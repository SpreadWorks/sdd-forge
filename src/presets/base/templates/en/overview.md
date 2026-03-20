<!-- @extends: layout -->
<!-- @block: content -->
# System Overview

<!-- {{data[ignoreError=true]: monorepo.monorepo.apps("overview")}} -->
<!-- {{/data}} -->

<!-- {{text: Write a 1-2 sentence overview of this project.}} -->
<!-- {{/text}} -->

<!-- @block: description -->
## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the project's architecture and whether it integrates with external systems.}} -->
<!-- {{/text}} -->

## Content
<!-- @endblock -->

<!-- @block: architecture -->
### Architecture Diagram

<!-- {{text: Generate a mermaid flowchart showing the project architecture. Include data flows between major components. Output only the mermaid code block.}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: components -->
### Component Responsibilities

<!-- {{text[mode=deep]: Describe the major components with their location, responsibilities, and I/O in table format.}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: external -->
### External Integrations

<!-- {{text: If there are external system integrations, describe their purpose and connection method in table format.}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: environments -->
### Environment Differences

<!-- {{text: Describe the configuration differences across environments (local/staging/production).}} -->
<!-- {{/text}} -->
<!-- @endblock -->
<!-- @endblock -->
