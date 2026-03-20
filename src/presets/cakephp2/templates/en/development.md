<!-- {%extends%} -->

<!-- {%block "setup"%} -->
### Docker Setup

```bash
# Initial setup
npm run docker:init

# Start containers
npm run docker:up

# Stop containers
npm run docker:stop
```

### npm scripts (Docker Operations)

<!-- {{text({prompt: "Describe the Docker operation commands defined in package.json in table format."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "dev-workflow"%} -->
### Local Development Workflow

<!-- {{text({prompt: "Describe the local development workflow in a Docker environment (start -> code -> test -> verify)."})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "testing"%} -->
### Test Configuration

<!-- {{text({prompt: "Describe the test framework and test execution methods."})}} -->
<!-- {{/text}} -->

<!-- {{data("cakephp2.tests.list", {labels: "Item|Count|Directory"})}} -->
<!-- {{/data}} -->

### Configuration Constants Reference

#### Scalar Constants

<!-- {{data("cakephp2.config.constants", {labels: "Constant|Value|Description"})}} -->
<!-- {{/data}} -->

#### Selection Constants

<!-- {{data("cakephp2.config.constantsSelect", {labels: "Constant|Choices"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
