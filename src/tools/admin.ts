import { DatabaseConnection } from '../database.js';

export function createAdminTools(db: DatabaseConnection) {
    return {
        get_database_stats: {
            description: 'Get comprehensive database statistics',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const dbSize = await db.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size;
        `);

                const tableCount = await db.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
        `);

                const connectionStats = await db.query(`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity;
        `);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    database: {
                                        name: (await db.query('SELECT current_database()')).rows[0].current_database,
                                        size: dbSize.rows[0].size,
                                    },
                                    tables: {
                                        count: parseInt(tableCount.rows[0].count),
                                    },
                                    connections: connectionStats.rows[0],
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        list_active_connections: {
            description: 'List all active database connections',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const result = await db.query(`
          SELECT 
            pid,
            usename,
            application_name,
            client_addr,
            state,
            query,
            state_change
          FROM pg_stat_activity
          WHERE pid <> pg_backend_pid()
          ORDER BY state_change DESC;
        `);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    connections: result.rows,
                                    count: result.rowCount,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        terminate_connection: {
            description: 'Terminate a specific database connection by PID',
            inputSchema: {
                type: 'object',
                properties: {
                    pid: {
                        type: 'number',
                        description: 'Process ID of the connection to terminate',
                    },
                },
                required: ['pid'],
            },
            handler: async (args: { pid: number }) => {
                const result = await db.query('SELECT pg_terminate_backend($1)', [args.pid]);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    terminated: result.rows[0].pg_terminate_backend,
                                    pid: args.pid,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        vacuum_table: {
            description: 'Run VACUUM on a table to reclaim storage and update statistics',
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
                    full: {
                        type: 'boolean',
                        description: 'Perform VACUUM FULL (more thorough but locks table)',
                        default: false,
                    },
                    analyze: {
                        type: 'boolean',
                        description: 'Also run ANALYZE to update statistics',
                        default: true,
                    },
                },
                required: ['table'],
            },
            handler: async (args: {
                table: string;
                schema?: string;
                full?: boolean;
                analyze?: boolean;
            }) => {
                const schema = args.schema || 'public';
                const fullTableName = `${schema}.${args.table}`;

                let vacuumCmd = 'VACUUM';
                if (args.full) vacuumCmd += ' FULL';
                if (args.analyze !== false) vacuumCmd += ' ANALYZE';
                vacuumCmd += ` ${fullTableName}`;

                await db.query(vacuumCmd);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    success: true,
                                    table: args.table,
                                    schema,
                                    operation: vacuumCmd,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        analyze_table: {
            description: 'Run ANALYZE on a table to update query planner statistics',
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

                await db.query(`ANALYZE ${fullTableName}`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    success: true,
                                    table: args.table,
                                    schema,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            },
        },

        check_table_bloat: {
            description: 'Check for table bloat (wasted space)',
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
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
            n_dead_tup,
            n_live_tup,
            ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_percent
          FROM pg_stat_user_tables
          WHERE schemaname = $1 AND tablename = $2;
        `,
                    [schema, args.table]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    table: args.table,
                                    schema,
                                    stats: result.rows[0] || {},
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
