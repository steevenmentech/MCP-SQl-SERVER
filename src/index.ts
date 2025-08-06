#!/usr/bin/env node

// External imports
import * as dotenv from "dotenv";
import sql from "mssql";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Internal imports
import { UpdateDataTool } from "./tools/UpdateDataTool.js";
import { InsertDataTool } from "./tools/InsertDataTool.js";
import { ReadDataTool } from "./tools/ReadDataTool.js";
import { CreateTableTool } from "./tools/CreateTableTool.js";
import { CreateIndexTool } from "./tools/CreateIndexTool.js";
import { ListTableTool } from "./tools/ListTableTool.js";
import { DropTableTool } from "./tools/DropTableTool.js";
import { DescribeTableTool } from "./tools/DescribeTableTool.js";

// Load environment variables
dotenv.config();

// Globals
let globalSqlPool: sql.ConnectionPool | null = null;

// SQL config supporting both SQL Server and Windows authentication
export async function createSqlConfig(): Promise<{ config: sql.config }> {
  const trustServerCertificate = process.env.TRUST_SERVER_CERTIFICATE?.toLowerCase() === "true";
  const connectionTimeout = process.env.CONNECTION_TIMEOUT ? parseInt(process.env.CONNECTION_TIMEOUT, 10) : 30;
  const useWindowsAuth = process.env.USE_WINDOWS_AUTH?.toLowerCase() === "true";
  const encrypt = process.env.ENCRYPT?.toLowerCase() === "true" || false;

  const baseConfig: sql.config = {
    server: process.env.SERVER_NAME!,
    database: process.env.DATABASE_NAME!,
    options: {
      encrypt,
      trustServerCertificate,
    },
    connectionTimeout: connectionTimeout * 1000,
  };

  if (useWindowsAuth) {
    // Windows Authentication (Integrated Security)
    return {
      config: {
        ...baseConfig,
        authentication: {
          type: "ntlm",
          options: {
            domain: process.env.DOMAIN || "",
            userName: process.env.USERNAME || "",
            password: process.env.PASSWORD || "",
          },
        },
      },
    };
  } else {
    // SQL Server Authentication
    return {
      config: {
        ...baseConfig,
        user: process.env.USERNAME!,
        password: process.env.PASSWORD!,
      },
    };
  }
}

// Tools
const updateDataTool = new UpdateDataTool();
const insertDataTool = new InsertDataTool();
const readDataTool = new ReadDataTool();
const createTableTool = new CreateTableTool();
const createIndexTool = new CreateIndexTool();
const listTableTool = new ListTableTool();
const dropTableTool = new DropTableTool();
const describeTableTool = new DescribeTableTool();

// MCP server
const server = new Server(
  { name: "mssql-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// READONLY mode
const isReadOnly = process.env.READONLY === "true";

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: isReadOnly
    ? [listTableTool, readDataTool, describeTableTool]
    : [
        insertDataTool,
        readDataTool,
        describeTableTool,
        updateDataTool,
        createTableTool,
        createIndexTool,
        dropTableTool,
        listTableTool,
      ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let result;
    switch (name) {
      case insertDataTool.name:
        result = await insertDataTool.run(args);
        break;
      case readDataTool.name:
        result = await readDataTool.run(args);
        break;
      case updateDataTool.name:
        result = await updateDataTool.run(args);
        break;
      case createTableTool.name:
        result = await createTableTool.run(args);
        break;
      case createIndexTool.name:
        result = await createIndexTool.run(args);
        break;
      case listTableTool.name:
        result = await listTableTool.run(args);
        break;
      case dropTableTool.name:
        result = await dropTableTool.run(args);
        break;
      case describeTableTool.name:
        if (!args || typeof args.tableName !== "string") {
          return {
            content: [{ type: "text", text: `Missing or invalid 'tableName' argument for describe_table tool.` }],
            isError: true,
          };
        }
        result = await describeTableTool.run(args as { tableName: string }); 
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    // Ensure result is serializable
    let responseText;
    try {
      responseText = JSON.stringify(result, null, 2);
    } catch (jsonError) {
      // If result can't be serialized, convert to string
      responseText = String(result);
    }

    return {
      content: [{ type: "text", text: responseText }],
    };
  } catch (error) {
    // Better error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error occurred: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Server startup
async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});

// Ensure SQL connection before every tool use
async function ensureSqlConnection() {
  if (globalSqlPool && globalSqlPool.connected) return;

  try {
    const { config } = await createSqlConfig();
    globalSqlPool = await sql.connect(config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to SQL Server: ${errorMessage}`);
  }
}

function wrapToolRun(tool: { run: (...args: any[]) => Promise<any> }) {
  const originalRun = tool.run.bind(tool);
  tool.run = async function (...args: any[]) {
    await ensureSqlConnection();
    return originalRun(...args);
  };
}

// Apply connection wrapping
[
  insertDataTool,
  readDataTool,
  updateDataTool,
  createTableTool,
  createIndexTool,
  dropTableTool,
  listTableTool,
  describeTableTool,
].forEach(wrapToolRun);