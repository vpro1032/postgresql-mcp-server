# Testing PostgreSQL MCP Server with Claude Code

## Quick Setup

### 1. Ensure Docker Containers are Running

```bash
cd /Users/deus/experiments/mcp-servers/postgresql-mcp-server
docker-compose ps
```

You should see both containers running:
- `postgresql-mcp-db` - healthy
- `postgresql-mcp-server` - running

If not running, start them:
```bash
docker-compose up -d
```

### 2. Configure Claude Code MCP Settings

Claude Code uses MCP configuration from: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

Add the PostgreSQL MCP server configuration:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "postgresql-mcp-server",
        "node",
        "dist/index.js"
      ]
    }
  }
}
```

### 3. Restart Claude Code

After updating the MCP settings:
1. Close VS Code completely
2. Reopen VS Code
3. The PostgreSQL MCP server should now be available

### 4. Test the Connection

You can now ask Claude Code to interact with your PostgreSQL database. Try these commands:

**List all tables:**
```
Show me all tables in the database
```

**Describe the users table:**
```
What's the structure of the users table?
```

**Query data:**
```
Execute a query to select all users from the users table
```

**Get database stats:**
```
Show me the database statistics
```

## Available Commands

The MCP server provides 22 commands across 4 categories:

### Query Tools (3)
- `execute_query` - Run SQL queries
- `execute_transaction` - Run multiple queries atomically
- `explain_query` - Get query execution plans

### Schema Tools (8)
- `list_databases` - List all databases
- `list_schemas` - List schemas
- `list_tables` - List tables in a schema
- `describe_table` - Get table structure
- `list_indexes` - View indexes
- `list_views` - List views
- `list_functions` - List functions/procedures
- `get_table_size` - Get size stats

### Data Tools (5)
- `insert_data` - Insert rows
- `update_data` - Update rows
- `delete_data` - Delete rows
- `bulk_insert` - Bulk insert from JSON
- `export_table` - Export as JSON

### Admin Tools (6)
- `get_database_stats` - Database statistics
- `list_active_connections` - Show connections
- `terminate_connection` - Kill a connection
- `vacuum_table` - Reclaim storage
- `analyze_table` - Update statistics
- `check_table_bloat` - Check for bloat

## Test Database

A sample `users` table has been created with test data:

```sql
SELECT * FROM users;
```

| id | name    | email                | age |
|----|---------|---------------------|-----|
| 1  | Alice   | alice@example.com   | 30  |
| 2  | Bob     | bob@example.com     | 25  |
| 3  | Charlie | charlie@example.com | 35  |

## Troubleshooting

### MCP Server Not Showing Up

1. Check the MCP settings file exists and has correct JSON
2. Verify Docker containers are running: `docker-compose ps`
3. Check server logs: `docker-compose logs mcp-server`
4. Restart VS Code completely

### Connection Errors

1. Ensure PostgreSQL is healthy: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify environment variables in `.env`

### Commands Not Working

1. Check server logs for errors: `docker-compose logs mcp-server`
2. Verify the command syntax matches the examples in `COMMANDS.md`
3. Ensure you're using the correct schema (default is "public")
