# <!-- {{data("cli.project.name")}} --><!-- {{/data}} -->

<!-- {{data("cli.docs.langSwitcher", {labels: "absolute"})}} -->
<!-- {{/data}} -->

<!-- {{text({prompt: "Write a 1-2 sentence overview of this project."})}} -->
<!-- {{/text}} -->

<!-- {%block "quickstart"%} -->
## Quick Start

### Installation

<pre>
# npm
npm install -g <!-- {{data("cli.project.name")}} --><!-- {{/data}} -->

# yarn
yarn global add <!-- {{data("cli.project.name")}} --><!-- {{/data}} -->

# pnpm
pnpm add -g <!-- {{data("cli.project.name")}} --><!-- {{/data}} -->
</pre>

### Basic Commands

<pre>
<!-- {{data("cli.project.name")}} --><!-- {{/data}} --> help
</pre>
<!-- {%/block%} -->

<!-- {%block "docs"%} -->
## Documentation

<!-- {{data("cli.docs.chapters", {labels: "Chapter|Description"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
