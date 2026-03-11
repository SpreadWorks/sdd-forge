<!-- {{data: docs.langSwitcher("relative")}} -->
<!-- {{/data}} -->
# 01. Tool Overview and Architecture

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases.}} -->
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text: Describe the problem this CLI tool solves and its target users. The two main features are: (1) automated documentation generation based on source code analysis ({{data}}/{{text}} directives), and (2) Spec-Driven Development workflow (spec → gate → implement → forge → review).}} -->
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text[mode=deep]: Generate a mermaid flowchart showing the tool's overall architecture. Include the 3-layer dispatch structure (sdd-forge.js → docs.js/spec.js → individual commands) and flow.js (direct execution command). Show the flow from input (source code) → processing (scan/data/text) → output (docs/, README.md) and AI agent integration. Output only the mermaid code block.}} -->
<!-- {{/text}} -->

### Key Concepts

<!-- {{text: Explain the key concepts and terminology needed to understand this tool in table format. Required items: {{data}} directives, {{text}} directives, analysis.json, presets, spec.md, gate check, SDD flow, forge, review, flow state (.sdd-forge/current-spec).}} -->
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text: Describe the typical steps from installation to first output in step format. Steps: npm install → sdd-forge setup → sdd-forge build (runs scan/init/data/text/readme/agents/translate in sequence) → sdd-forge review → start SDD flow.}} -->
<!-- {{/text}} -->
