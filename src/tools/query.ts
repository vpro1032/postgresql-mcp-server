import { DatabaseConnection } from '../database.js';

export function createQueryTools(db: DatabaseConnection) {
    return {
        execute_query: {
            description: 'Execute a raw SQL query with optional parameter binding. Returns query results.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'SQL query to execute. Use $1, $2, etc. for parameters.',
                    },
                    params: {
                        type: 'array',
                        description: 'Optional array of parameters to bind to the query',
                        items: {
                            type: ['string', 'number', 'boolean', 'null'],
                        },
                    },
                },
                required: ['query'],
            },
            handler: async (args: { query: string; params?: any[] }) => {
                try {
                    const result = await db.query(args.query, args.params);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        rowCount: result.rowCount,
                                        rows: result.rows,
                                        fields: result.fields.map((f) => ({
                                            name: f.name,
                                            dataTypeID: f.dataTypeID,
                                        })),
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                } catch (error: any) {
                    throw new Error(`Query execution failed: ${error.message}`);
                }
            },
        },

        execute_transaction: {
            description: 'Execute multiple SQL queries in a transaction. All queries succeed or all fail.',
            inputSchema: {
                type: 'object',
                properties: {
                    queries: {
                        type: 'array',
                        description: 'Array of SQL queries to execute in transaction',
                        items: {
                            type: 'object',
                            properties: {
                                query: { type: 'string' },
                                params: {
                                    type: 'array',
                                    items: { type: ['string', 'number', 'boolean', 'null'] },
                                },
                            },
                            required: ['query'],
                        },
                    },
                },
                required: ['queries'],
            },
            handler: async (args: { queries: Array<{ query: string; params?: any[] }> }) => {
                try {
                    const results = await db.transaction(async (client) => {
                        const queryResults = [];
                        for (const { query, params } of args.queries) {
                            const result = await client.query(query, params);
                            queryResults.push({
                                rowCount: result.rowCount,
                                rows: result.rows,
                            });
                        }
                        return queryResults;
                    });

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        results,
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                } catch (error: any) {
                    throw new Error(`Transaction failed: ${error.message}`);
                }
            },
        },

        explain_query: {
            description: 'Get the execution plan for a SQL query using EXPLAIN ANALYZE',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'SQL query to explain',
                    },
                    analyze: {
                        type: 'boolean',
                        description: 'Whether to actually execute the query (EXPLAIN ANALYZE)',
                        default: false,
                    },
                },
                required: ['query'],
            },
            handler: async (args: { query: string; analyze?: boolean }) => {
                try {
                    const explainQuery = args.analyze
                        ? `EXPLAIN ANALYZE ${args.query}`
                        : `EXPLAIN ${args.query}`;
                    const result = await db.query(explainQuery);

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        plan: result.rows,
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                } catch (error: any) {
                    throw new Error(`EXPLAIN failed: ${error.message}`);
                }
            },
        },
    };
}
