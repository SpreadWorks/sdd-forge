<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the operational stack exposed by the analyzed JavaScript data sources, including CakePHP 2.x and GitHub Actions workflow analysis. The available version information identifies CakePHP 2.x, while the CI/CD workflow parser reports pipeline structure, triggers, jobs, secrets, and environment variables from workflow YAML files.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Programming language | JavaScript | Not specified |
| Framework | CakePHP | 2.x |
| CI/CD | GitHub Actions | Not specified |
| Container-related configuration | Docker | Not specified |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The provided analysis does not describe a package manager or lockfile-based dependency strategy.

Within operations, dependency information is captured from GitHub Actions workflow files. The pipeline parser extracts `uses` references from job steps, removes duplicates, and presents them as part of the job details for each workflow.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment-related information is derived from GitHub Actions workflow definitions under `.github/workflows/*.yml`.

The pipeline data source scans workflow files, parses workflow names and triggers, reads branch filters and cron schedules when present, and summarizes each workflow's jobs, referenced secrets, and environment variables. Docker-based deployment details are not currently provided by the CakePHP 2.x Docker data source, because that source is implemented as a stub and always returns `null`.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operations are documented through two analysis paths.

For CI/CD, workflow files are parsed into pipeline lists, job tables, and a table of referenced secrets and environment variables. This makes the operational view centered on workflow triggers, job execution targets, step counts, and external references used in automation.

For Docker-related operations in the CakePHP 2.x preset, no runtime data is currently available because the Docker data source is present only as an extension point and does not return analyzed results.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
