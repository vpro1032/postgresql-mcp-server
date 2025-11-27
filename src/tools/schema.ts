import { DatabaseConnection } from '../database.js';

export function createSchemaTools(db: DatabaseConnection) {
    return {
        list_databases: {
            description: 'List all databases in the PostgreSQL server',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const result = await db.query(`
          SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
          FROM pg_database
          WHERE datistemplate = false
          ORDER BY datname;
        `);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ databases: result.rows }, null, 2),
                        },
                    ],
                };
            },
        },

        list_schemas: {
            description: 'List all schemas in the current database',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const result = await db.query(`
          SELECT schema_name
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
          ORDER BY schema_name;
        `);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ schemas: result.rows }, null, 2),
                        },
                    ],
                };
            },
        },

        list_tables: {
            description: 'List all tables in a schema',
            inputSchema: {
                type: 'object',
                properties: {
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                },
            },
            handler: async (args: { schema?: string }) => {
                const schema = args.schema || 'public';
                const result = await db.query(
                    `
          SELECT 
            table_name,
            pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as size
          FROM information_schema.tables
          WHERE table_schema = $1 AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `,
                    [schema]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ schema, tables: result.rows }, null, 2),
                        },
                    ],
                };
            },
        },

        describe_table: {
            description: 'Get detailed information about a table including columns, types, and constraints',
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
                },
                required: ['table'],
            },
            handler: async (args: { table: string; schema?: string }) => {
                const schema = args.schema || 'public';

                // Get column information
                const columns = await db.query(
                    `
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `,
                    [schema, args.table]
                );

                // Get constraints
                const constraints = await db.query(
                    `
          SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          LEFT JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.table_schema = $1 AND tc.table_name = $2;
        `,
                    [schema, args.table]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    schema,
                                    table: args.table,
                                    columns: columns.rows,
                                    constraints: constraints.rows,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        list_indexes: {
            description: 'List all indexes for a table',
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
                },
                required: ['table'],
            },
            handler: async (args: { table: string; schema?: string }) => {
                const schema = args.schema || 'public';
                const result = await db.query(
                    `
          SELECT
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = $1 AND tablename = $2
          ORDER BY indexname;
        `,
                    [schema, args.table]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    schema,
                                    table: args.table,
                                    indexes: result.rows,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        list_views: {
            description: 'List all views in a schema',
            inputSchema: {
                type: 'object',
                properties: {
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                },
            },
            handler: async (args: { schema?: string }) => {
                const schema = args.schema || 'public';
                const result = await db.query(
                    `
          SELECT 
            table_name as view_name,
            view_definition
          FROM information_schema.views
          WHERE table_schema = $1
          ORDER BY table_name;
        `,
                    [schema]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ schema, views: result.rows }, null, 2),
                        },
                    ],
                };
            },
        },

        list_functions: {
            description: 'List all functions/procedures in a schema',
            inputSchema: {
                type: 'object',
                properties: {
                    schema: {
                        type: 'string',
                        description: 'Schema name (default: public)',
                        default: 'public',
                    },
                },
            },
            handler: async (args: { schema?: string }) => {
                const schema = args.schema || 'public';
                const result = await db.query(
                    `
          SELECT 
            routine_name,
            routine_type,
            data_type as return_type
          FROM information_schema.routines
          WHERE routine_schema = $1
          ORDER BY routine_name;
        `,
                    [schema]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ schema, functions: result.rows }, null, 2),
                        },
                    ],
                };
            },
        },

        get_table_size: {
            description: 'Get size information and row count for a table',
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
                },
                required: ['table'],
            },
            handler: async (args: { table: string; schema?: string }) => {
                const schema = args.schema || 'public';
                const fullTableName = `${schema}.${args.table}`;

                const sizeResult = await db.query(
                    `
          SELECT
            pg_size_pretty(pg_total_relation_size($1)) as total_size,
            pg_size_pretty(pg_relation_size($1)) as table_size,
            pg_size_pretty(pg_total_relation_size($1) - pg_relation_size($1)) as indexes_size
        `,
                    [fullTableName]
                );

                const countResult = await db.query(
                    `SELECT COUNT(*) as row_count FROM ${fullTableName}`
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    schema,
                                    table: args.table,
                                    ...sizeResult.rows[0],
                                    ...countResult.rows[0],
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
