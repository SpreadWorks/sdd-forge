# 04. Development Guide

## Description

<!-- @block: description -->
<!-- {{text: Write a 1-2 sentence overview of this chapter. Include development environment setup and testing configuration.}} -->
<!-- {{/text}} -->
<!-- @endblock -->

## Content

<!-- @block: setup -->
### Environment Setup

<!-- {{text: Describe the local development environment setup procedure.}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: dev-workflow -->
### Local Development Workflow

<!-- {{text: Describe the local development procedure (start → code → test → verify).}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: sdd-tools -->
### SDD Tools

| Command | Description |
| --- | --- |
| `sdd-forge spec --title "..."` | Initialize spec (create feature branch + spec.md) |
| `sdd-forge gate --spec ...` | Spec gate (check unresolved items) |
| `sdd-forge init` | Initialize docs (generate docs/ from templates) |
| `sdd-forge review` | Review docs (structure, content, coverage check) |
| `sdd-forge forge --prompt "..."` | Iteratively improve docs |
| `sdd-forge flow --request "..."` | Run SDD flow automatically |
<!-- @endblock -->

<!-- @block: testing -->
### Testing

<!-- {{text: Describe the test framework and how to run tests.}} -->
<!-- {{/text}} -->
<!-- @endblock -->
