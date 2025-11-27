import { DatabaseConnection } from '../database.js';

export function createDataTools(db: DatabaseConnection) {
    return {
        insert_data: {
            description: 'Insert a single row into a table',
            inputSchema: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'Table name',
                    },
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                    data: {
                        type: 'object',
                        description: 'Column-value pairs to insert',
                    },
                    returning: {
                        type: 'string',
                        description: 'Columns to return (e.g., "*" or "id, name")',
                        default: '*',
                    },
                },
                required: ['table', 'data'],
            },
            handler: async (args: {
                table: string;
                schema?: string;
                data: Record<string, any>;
                returning?: string;
            }) => {
                const schema = args.schema || 'public';
                const columns = Object.keys(args.data);
                const values = Object.values(args.data);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                const returning = args.returning || '*';

                const query = `
          INSERT INTO ${schema}.${args.table} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING ${returning}
        `;

                const result = await db.query(query, values);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    inserted: result.rowCount,
                                    returning: result.rows,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        update_data: {
            description: 'Update rows in a table with a WHERE clause',
            inputSchema: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'Table name',
                    },
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                    data: {
                        type: 'object',
                        description: 'Column-value pairs to update',
                    },
                    where: {
                        type: 'string',
                        description: 'WHERE clause (without WHERE keyword)',
                    },
                    whereParams: {
                        type: 'array',
                        description: 'Parameters for WHERE clause',
                        items: {
                            type: ['string', 'number', 'boolean', 'null'],
                        },
                    },
                    returning: {
                        type: 'string',
                        description: 'Columns to return (e.g., "*" or "id, name")',
                        default: '*',
                    },
                },
                required: ['table', 'data', 'where'],
            },
            handler: async (args: {
                table: string;
                schema?: string;
                data: Record<string, any>;
                where: string;
                whereParams?: any[];
                returning?: string;
            }) => {
                const schema = args.schema || 'public';
                const columns = Object.keys(args.data);
                const values = Object.values(args.data);
                const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
                const returning = args.returning || '*';

                // Adjust WHERE parameter placeholders
                const allParams = [...values, ...(args.whereParams || [])];
                const whereClause = args.where;

                const query = `
          UPDATE ${schema}.${args.table}
          SET ${setClause}
          WHERE ${whereClause}
          RETURNING ${returning}
        `;

                const result = await db.query(query, allParams);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    updated: result.rowCount,
                                    returning: result.rows,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        delete_data: {
            description: 'Delete rows from a table with a WHERE clause',
            inputSchema: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'Table name',
                    },
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                    where: {
                        type: 'string',
                        description: 'WHERE clause (without WHERE keyword)',
                    },
                    whereParams: {
                        type: 'array',
                        description: 'Parameters for WHERE clause',
                        items: {
                            type: ['string', 'number', 'boolean', 'null'],
                        },
                    },
                    returning: {
                        type: 'string',
                        description: 'Columns to return (e.g., "*" or "id, name")',
                    },
                },
                required: ['table', 'where'],
            },
            handler: async (args: {
                table: string;
                schema?: string;
                where: string;
                whereParams?: any[];
                returning?: string;
            }) => {
                const schema = args.schema || 'public';
                const returning = args.returning ? `RETURNING ${args.returning}` : '';

                const query = `
          DELETE FROM ${schema}.${args.table}
          WHERE ${args.where}
          ${returning}
        `;

                const result = await db.query(query, args.whereParams);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    deleted: result.rowCount,
                                    ...(args.returning && { returning: result.rows }),
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        bulk_insert: {
            description: 'Insert multiple rows into a table from a JSON array',
            inputSchema: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'Table name',
                    },
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                    data: {
                        type: 'array',
                        description: 'Array of objects to insert',
                        items: {
                            type: 'object',
                        },
                    },
                },
                required: ['table', 'data'],
            },
            handler: async (args: {
                table: string;
                schema?: string;
                data: Record<string, any>[];
            }) => {
                if (!args.data || args.data.length === 0) {
                    throw new Error('Data array cannot be empty');
                }

                const schema = args.schema || 'public';
                const columns = Object.keys(args.data[0]);

                const result = await db.transaction(async (client) => {
                    let insertedCount = 0;

                    for (const row of args.data) {
                        const values = columns.map((col) => row[col]);
                        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                        const query = `
              INSERT INTO ${schema}.${args.table} (${columns.join(', ')})
              VALUES (${placeholders})
            `;

                        const res = await client.query(query, values);
                        insertedCount += res.rowCount || 0;
                    }

                    return insertedCount;
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    inserted: result,
                                    rows: args.data.length,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        export_table: {
            description: 'Export table data as JSON with optional filtering',
            inputSchema: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'Table name',
                    },
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                    where: {
                        type: 'string',
                        description: 'Optional WHERE clause (without WHERE keyword)',
                    },
                    whereParams: {
                        type: 'array',
                        description: 'Parameters for WHERE clause',
                        items: {
                            type: ['string', 'number', 'boolean', 'null'],
                        },
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of rows to export',
                    },
                },
                required: ['table'],
            },
            handler: async (args: {
                table: string;
                schema?: string;
                where?: string;
                whereParams?: any[];
                limit?: number;
            }) => {
                const schema = args.schema || 'public';
                let query = `SELECT * FROM ${schema}.${args.table}`;

                if (args.where) {
                    query += ` WHERE ${args.where}`;
                }

                if (args.limit) {
                    query += ` LIMIT ${args.limit}`;
                }

                const result = await db.query(query, args.whereParams);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    table: args.table,
                                    schema,
                                    rowCount: result.rowCount,
                                    data: result.rows,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },
    };
}
