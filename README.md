# PostgreSQL MCP Server

A Docker-based [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides comprehensive PostgreSQL database interaction capabilities. This server enables AI assistants and other MCP clients to query, inspect, and manage PostgreSQL databases through a standardized interface.

## ❤️ Support This MCP Server

If you find this **Postgres MCP Server** useful and want to support ongoing development, improvements, and new MCP integrations, consider becoming a member on Patreon.

Your support helps me:

- Build more high-quality MCP servers  
- Maintain and enhance existing features  
- Add documentation, examples, and real-world use cases  
- Prioritize feature requests from supporters  

👉 **Become a supporter on Patreon:**  
[https://www.patreon.com/posts/postgres-mcp-145222791](https://patreon.com/Roger3333?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)

Thank you for helping power open MCP development! 🚀

## Features

### 🔍 **Query Execution**
- Execute raw SQL queries with parameter binding
- Run multiple queries in transactions
- Get query execution plans with EXPLAIN/EXPLAIN ANALYZE

### 📊 **Schema Inspection**
- List databases, schemas, tables, views, and functions
- Describe table structure with columns, types, and constraints
- View indexes and their definitions
- Get table size and row count statistics

### 📝 **Data Manipulation**
- Insert single or multiple rows
- Update and delete with WHERE clauses
- Bulk insert from JSON arrays
- Export table data as JSON

### ⚙️ **Database Administration**
- View database statistics and connection info
- List and terminate active connections
- Run VACUUM and ANALYZE operations
- Check for table bloat

## Quick Start

### Prerequisites
- Docker and Docker Compose
- An MCP client (e.g., Claude Desktop, VS Code with MCP extension)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd postgresql-mcp-server
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Verify the server is running**
   ```bash
   docker-compose logs mcp-server
   ```

### Configuration

The server is configured via environment variables. See [`.env.example`](.env.example) for all available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | PostgreSQL host | `postgres` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `postgres` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_MAX_CONNECTIONS` | Max connection pool size | `20` |

### Using with MCP Clients

#### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "docker",
      "args": ["exec", "-i", "postgresql-mcp-server", "node", "dist/index.js"]
    }
  }
}
```

#### VS Code MCP Extension

Add to your VS Code MCP settings:

```json
{
  "mcp.servers": {
    "postgresql": {
      "command": "docker",
      "args": ["exec", "-i", "postgresql-mcp-server", "node", "dist/index.js"]
    }
  }
}
```

## Available Commands

The server provides **20+ commands** across 4 categories. See [COMMANDS.md](COMMANDS.md) for detailed documentation.

### Query Tools
- `execute_query` - Execute SQL queries with parameter binding
- `execute_transaction` - Run multiple queries in a transaction
- `explain_query` - Get query execution plans

### Schema Tools
- `list_databases` - List all databases
- `list_schemas` - List schemas in current database
- `list_tables` - List tables in a schema
- `describe_table` - Get table structure and constraints
- `list_indexes` - List indexes for a table
- `list_views` - List views in a schema
- `list_functions` - List stored functions/procedures
- `get_table_size` - Get table size and row count

### Data Tools
- `insert_data` - Insert a single row
- `update_data` - Update rows with WHERE clause
- `delete_data` - Delete rows with WHERE clause
- `bulk_insert` - Insert multiple rows from JSON
- `export_table` - Export table data as JSON

### Admin Tools
- `get_database_stats` - Get database statistics
- `list_active_connections` - Show active connections
- `terminate_connection` - Terminate a connection by PID
- `vacuum_table` - Run VACUUM on a table
- `analyze_table` - Run ANALYZE on a table
- `check_table_bloat` - Check for table bloat

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally (requires PostgreSQL)
npm start
```

### Project Structure

```
postgresql-mcp-server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── database.ts        # Database connection manager
│   └── tools/
│       ├── query.ts       # Query execution tools
│       ├── schema.ts      # Schema inspection tools
│       ├── data.ts        # Data manipulation tools
│       └── admin.ts       # Administrative tools
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker Compose configuration
└── package.json           # Node.js dependencies
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f mcp-server

# Rebuild after code changes
docker-compose up -d --build

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres
```

## Security Considerations

- **Credentials**: Never commit `.env` files with real credentials
- **Network**: The MCP server and PostgreSQL communicate over a private Docker network
- **Permissions**: The server runs as a non-root user in the container
- **SQL Injection**: Always use parameterized queries (the tools support parameter binding)

## Troubleshooting

### Server won't connect to PostgreSQL
- Check that PostgreSQL is healthy: `docker-compose ps`
- Verify environment variables in `.env`
- Check logs: `docker-compose logs postgres`

### MCP client can't connect to server
- Ensure the container is running: `docker ps`
- Verify the command in your MCP client configuration
- Check server logs: `docker-compose logs mcp-server`

### Permission denied errors
- Ensure your database user has appropriate permissions
- Check PostgreSQL logs for authentication errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MCP SDK for TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
