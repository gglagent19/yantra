import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { YantraApiClient } from "./client.js";
import { readConfigFromEnv, type YantraMcpConfig } from "./config.js";
import { createToolDefinitions } from "./tools.js";

export function createYantraMcpServer(config: YantraMcpConfig = readConfigFromEnv()) {
  const server = new McpServer({
    name: "yantra",
    version: "0.1.0",
  });

  const client = new YantraApiClient(config);
  const tools = createToolDefinitions(client);
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.schema.shape, tool.execute);
  }

  return {
    server,
    tools,
    client,
  };
}

export async function runServer(config: YantraMcpConfig = readConfigFromEnv()) {
  const { server } = createYantraMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
