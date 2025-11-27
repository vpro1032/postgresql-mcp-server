#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseConnection } from './database.js';
import { createQueryTools } from './tools/query.js';
import { createSchemaTools } from './tools/schema.js';
import { createDataTools } from './tools/data.js';
import { createAdminTools } from './tools/admin.js';

// Load environment variables
const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '10000'),
};

const serverName = process.env.MCP_SERVER_NAME || 'postgresql-mcp-server';

// Initialize database connection
const db = new DatabaseConnection(config);

// Create MCP server
const server = new Server(
    {
        name: serverName,
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Combine all tools
const allTools = {
    ...createQueryTools(db),
    ...createSchemaTools(db),
    ...createDataTools(db),
    ...createAdminTools(db),
};

// Register list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: Object.entries(allTools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});

// Register call_tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = allTools[toolName as keyof typeof allTools];

    if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
        return await tool.handler(request.params.arguments as any || {});
    } catch (error: any) {
        throw new Error(`Tool execution failed: ${error.message}`);
    }
});

// Start server
async function main() {
    try {
        // Test database connection
        await db.query('SELECT 1');

        const transport = new StdioServerTransport();
        await server.connect(transport);
    } catch (error) {
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await db.close();
    process.exit(0);
});

main();
