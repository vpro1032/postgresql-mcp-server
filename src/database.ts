import pg from 'pg';

const { Pool } = pg;

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}

export class DatabaseConnection {
    private pool: pg.Pool;

    constructor(config: DatabaseConfig) {
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            max: config.max || 20,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
        });

        // Handle pool errors silently (logging would interfere with STDIO)
        this.pool.on('error', (err) => {
            // Errors will be caught and thrown in query methods
        });
    }

    async query(text: string, params?: any[]): Promise<pg.QueryResult> {
        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    getPool(): pg.Pool {
        return this.pool;
    }
}
