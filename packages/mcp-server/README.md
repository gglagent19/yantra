# Yantra MCP Server

Model Context Protocol server for Yantra.

This package is a thin MCP wrapper over the existing Yantra REST API. It does
not talk to the database directly and it does not reimplement business logic.

## Authentication

The server reads its configuration from environment variables:

- `YANTRA_API_URL` - Yantra base URL, for example `http://localhost:3100`
- `YANTRA_API_KEY` - bearer token used for `/api` requests
- `YANTRA_COMPANY_ID` - optional default company for company-scoped tools
- `YANTRA_AGENT_ID` - optional default agent for checkout helpers
- `YANTRA_RUN_ID` - optional run id forwarded on mutating requests

## Usage

```sh
npx -y @yantra/mcp-server
```

Or locally in this repo:

```sh
pnpm --filter @yantra/mcp-server build
node packages/mcp-server/dist/stdio.js
```

## Tool Surface

Read tools:

- `yantraMe`
- `yantraInboxLite`
- `yantraListAgents`
- `yantraGetAgent`
- `yantraListIssues`
- `yantraGetIssue`
- `yantraGetHeartbeatContext`
- `yantraListComments`
- `yantraGetComment`
- `yantraListIssueApprovals`
- `yantraListDocuments`
- `yantraGetDocument`
- `yantraListDocumentRevisions`
- `yantraListProjects`
- `yantraGetProject`
- `yantraListGoals`
- `yantraGetGoal`
- `yantraListApprovals`
- `yantraGetApproval`
- `yantraGetApprovalIssues`
- `yantraListApprovalComments`

Write tools:

- `yantraCreateIssue`
- `yantraUpdateIssue`
- `yantraCheckoutIssue`
- `yantraReleaseIssue`
- `yantraAddComment`
- `yantraUpsertIssueDocument`
- `yantraRestoreIssueDocumentRevision`
- `yantraCreateApproval`
- `yantraLinkIssueApproval`
- `yantraUnlinkIssueApproval`
- `yantraApprovalDecision`
- `yantraAddApprovalComment`

Escape hatch:

- `yantraApiRequest`

`yantraApiRequest` is limited to paths under `/api` and JSON bodies. It is
meant for endpoints that do not yet have a dedicated MCP tool.
