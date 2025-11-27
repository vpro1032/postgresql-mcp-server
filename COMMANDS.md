# Command Reference

Complete reference for all PostgreSQL MCP Server commands.

## Query Tools

### execute_query

Execute a raw SQL query with optional parameter binding.

**Parameters:**
- `query` (string, required): SQL query to execute. Use $1, $2, etc. for parameters
- `params` (array, optional): Array of parameters to bind to the query

**Example:**
```json
{
  "query": "SELECT * FROM users WHERE age > $1 AND city = $2",
  "params": [25, "New York"]
}
```

**Response:**
```json
{
  "rowCount": 10,
  "rows": [...],
  "fields": [...]
}
```

---

### execute_transaction

Execute multiple SQL queries in a transaction. All queries succeed or all fail.

**Parameters:**
- `queries` (array, required): Array of query objects, each with:
  - `query` (string): SQL query
  - `params` (array, optional): Query parameters

**Example:**
```json
{
  "queries": [
    {
      "query": "INSERT INTO accounts (name, balance) VALUES ($1, $2)",
      "params": ["Alice", 1000]
    },
    {
      "query": "UPDATE accounts SET balance = balance - $1 WHERE name = $2",
      "params": [100, "Bob"]
    }
  ]
}
```

---

### explain_query

Get the execution plan for a SQL query using EXPLAIN or EXPLAIN ANALYZE.

**Parameters:**
- `query` (string, required): SQL query to explain
- `analyze` (boolean, optional): Whether to actually execute the query (EXPLAIN ANALYZE). Default: false

**Example:**
```json
{
  "query": "SELECT * FROM users WHERE age > 25",
  "analyze": true
}
```

---

## Schema Tools

### list_databases

List all databases in the PostgreSQL server.

**Parameters:** None

**Response:**
```json
{
  "databases": [
    { "datname": "postgres", "size": "8 MB" },
    { "datname": "myapp", "size": "150 MB" }
  ]
}
```

---

### list_schemas

List all schemas in the current database (excludes system schemas).

**Parameters:** None

**Response:**
```json
{
  "schemas": [
    { "schema_name": "public" },
    { "schema_name": "analytics" }
  ]
}
```

---

### list_tables

List all tables in a schema.

**Parameters:**
- `schema` (string, optional): Schema name. Default: "public"

**Example:**
```json
{
  "schema": "public"
}
```

**Response:**
```json
{
  "schema": "public",
  "tables": [
    { "table_name": "users", "size": "1024 kB" },
    { "table_name": "orders", "size": "2048 kB" }
  ]
}
```

---

### describe_table

Get detailed information about a table including columns, types, and constraints.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"

**Example:**
```json
{
  "table": "users",
  "schema": "public"
}
```

**Response:**
```json
{
  "schema": "public",
  "table": "users",
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO",
      "column_default": "nextval('users_id_seq'::regclass)"
    }
  ],
  "constraints": [...]
}
```

---

### list_indexes

List all indexes for a table.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"

**Example:**
```json
{
  "table": "users",
  "schema": "public"
}
```

---

### list_views

List all views in a schema.

**Parameters:**
- `schema` (string, optional): Schema name. Default: "public"

---

### list_functions

List all functions/procedures in a schema.

**Parameters:**
- `schema` (string, optional): Schema name. Default: "public"

**Response:**
```json
{
  "schema": "public",
  "functions": [
    {
      "routine_name": "calculate_total",
      "routine_type": "FUNCTION",
      "return_type": "numeric"
    }
  ]
}
```

---

### get_table_size

Get size information and row count for a table.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"

**Response:**
```json
{
  "schema": "public",
  "table": "users",
  "total_size": "1536 kB",
  "table_size": "1024 kB",
  "indexes_size": "512 kB",
  "row_count": "1500"
}
```

---

## Data Tools

### insert_data

Insert a single row into a table.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"
- `data` (object, required): Column-value pairs to insert
- `returning` (string, optional): Columns to return. Default: "*"

**Example:**
```json
{
  "table": "users",
  "data": {
    "name": "Alice",
    "email": "alice@example.com",
    "age": 30
  },
  "returning": "id, name"
}
```

---

### update_data

Update rows in a table with a WHERE clause.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"
- `data` (object, required): Column-value pairs to update
- `where` (string, required): WHERE clause (without WHERE keyword)
- `whereParams` (array, optional): Parameters for WHERE clause
- `returning` (string, optional): Columns to return. Default: "*"

**Example:**
```json
{
  "table": "users",
  "data": {
    "age": 31
  },
  "where": "email = $1",
  "whereParams": ["alice@example.com"],
  "returning": "*"
}
```

---

### delete_data

Delete rows from a table with a WHERE clause.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"
- `where` (string, required): WHERE clause (without WHERE keyword)
- `whereParams` (array, optional): Parameters for WHERE clause
- `returning` (string, optional): Columns to return

**Example:**
```json
{
  "table": "users",
  "where": "age < $1",
  "whereParams": [18]
}
```

---

### bulk_insert

Insert multiple rows into a table from a JSON array.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"
- `data` (array, required): Array of objects to insert

**Example:**
```json
{
  "table": "users",
  "data": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 },
    { "name": "Charlie", "age": 35 }
  ]
}
```

---

### export_table

Export table data as JSON with optional filtering.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"
- `where` (string, optional): WHERE clause (without WHERE keyword)
- `whereParams` (array, optional): Parameters for WHERE clause
- `limit` (number, optional): Maximum number of rows to export

**Example:**
```json
{
  "table": "users",
  "where": "age > $1",
  "whereParams": [25],
  "limit": 100
}
```

---

## Admin Tools

### get_database_stats

Get comprehensive database statistics.

**Parameters:** None

**Response:**
```json
{
  "database": {
    "name": "postgres",
    "size": "150 MB"
  },
  "tables": {
    "count": 25
  },
  "connections": {
    "total_connections": "5",
    "active_connections": "2",
    "idle_connections": "3"
  }
}
```

---

### list_active_connections

List all active database connections.

**Parameters:** None

**Response:**
```json
{
  "connections": [
    {
      "pid": 1234,
      "usename": "postgres",
      "application_name": "psql",
      "client_addr": "172.18.0.1",
      "state": "active",
      "query": "SELECT * FROM users"
    }
  ],
  "count": 1
}
```

---

### terminate_connection

Terminate a specific database connection by PID.

**Parameters:**
- `pid` (number, required): Process ID of the connection to terminate

**Example:**
```json
{
  "pid": 1234
}
```

---

### vacuum_table

Run VACUUM on a table to reclaim storage and update statistics.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"
- `full` (boolean, optional): Perform VACUUM FULL (more thorough but locks table). Default: false
- `analyze` (boolean, optional): Also run ANALYZE to update statistics. Default: true

**Example:**
```json
{
  "table": "users",
  "full": false,
  "analyze": true
}
```

---

### analyze_table

Run ANALYZE on a table to update query planner statistics.

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"

**Example:**
```json
{
  "table": "users"
}
```

---

### check_table_bloat

Check for table bloat (wasted space from dead tuples).

**Parameters:**
- `table` (string, required): Table name
- `schema` (string, optional): Schema name. Default: "public"

**Response:**
```json
{
  "table": "users",
  "schema": "public",
  "stats": {
    "total_size": "1536 kB",
    "n_dead_tup": "150",
    "n_live_tup": "1500",
    "dead_tuple_percent": "9.09"
  }
}
```

---

## Notes

- All commands support parameter binding to prevent SQL injection
- Schema parameter defaults to "public" when not specified
- Use `returning` parameter to get inserted/updated/deleted rows back
- Transaction commands ensure atomicity across multiple operations
