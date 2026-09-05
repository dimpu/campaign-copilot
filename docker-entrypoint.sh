#!/usr/bin/env sh
set -e

DB_PATH="${DATABASE_URL#file:}"
# Resolve relative to /app
if [ "${DB_PATH#\/}" = "$DB_PATH" ]; then
  DB_PATH="/app/$DB_PATH"
fi

# Run migrations if DB doesn't exist yet
if [ ! -f "$DB_PATH" ]; then
  echo "⚡ No database found at $DB_PATH — running migrations + seed..."
  bunx drizzle-kit push
  bun run db:seed
  echo "✅ Database ready."
else
  echo "✅ Database found at $DB_PATH — skipping seed."
fi

# Start the standalone Next.js server (Node, not Bun)
exec node server.js
