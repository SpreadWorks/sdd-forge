import { execFileSync } from "node:child_process";

function ghGraphQL(query, variables = {}) {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [k, v] of Object.entries(variables)) {
    args.push("-f", `${k}=${v}`);
  }
  const out = execFileSync("gh", args, { encoding: "utf8" });
  const result = JSON.parse(out);
  if (result.errors) {
    throw new Error(result.errors.map((e) => e.message).join(", "));
  }
  return result;
}

const ITEM_FIELDS = `
  id
  fieldValueByName(name: "Status") {
    ... on ProjectV2ItemFieldSingleSelectValue { name }
  }
  content {
    ... on DraftIssue { draftId: id title body }
    ... on Issue { title number url body }
  }
`;

export function searchItems(owner, project, queryText, limit = 20) {
  const q = `
    query {
      organization(login: "${owner}") {
        projectV2(number: ${project}) {
          items(first: ${limit}, query: ${JSON.stringify(queryText)}) {
            totalCount
            nodes { ${ITEM_FIELDS} }
          }
        }
      }
    }`;
  const result = ghGraphQL(q);
  return result.data.organization.projectV2.items;
}

export function listItems(owner, project, limit = 100) {
  const q = `
    query {
      organization(login: "${owner}") {
        projectV2(number: ${project}) {
          items(first: ${limit}) {
            totalCount
            nodes { ${ITEM_FIELDS} }
          }
        }
      }
    }`;
  const result = ghGraphQL(q);
  return result.data.organization.projectV2.items;
}

export function getProjectMeta(owner, project) {
  const q = `
    query {
      organization(login: "${owner}") {
        projectV2(number: ${project}) {
          id
          field(name: "Status") {
            ... on ProjectV2SingleSelectField {
              id
              options { id name }
            }
          }
        }
      }
    }`;
  const result = ghGraphQL(q);
  const p = result.data.organization.projectV2;
  return { projectId: p.id, statusField: p.field };
}

export function updateDraftIssue(draftIssueId, { title, body } = {}) {
  const fields = [];
  if (title !== undefined) fields.push(`title: ${JSON.stringify(title)}`);
  if (body !== undefined) fields.push(`body: ${JSON.stringify(body)}`);
  if (fields.length === 0) return;
  const q = `
    mutation {
      updateProjectV2DraftIssue(input: {
        draftIssueId: "${draftIssueId}"
        ${fields.join("\n        ")}
      }) {
        draftIssue { id }
      }
    }`;
  return ghGraphQL(q);
}

export function setItemStatus(projectId, itemId, fieldId, optionId) {
  const q = `
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${projectId}"
        itemId: "${itemId}"
        fieldId: "${fieldId}"
        value: { singleSelectOptionId: "${optionId}" }
      }) {
        projectV2Item { id }
      }
    }`;
  return ghGraphQL(q);
}
