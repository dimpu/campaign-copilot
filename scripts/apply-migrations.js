/* Applies Drizzle SQL migration files to the SQLite DB via better-sqlite3.
 * Avoids needing drizzle-kit / tsx in the slim production image. */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbUrl = process.env.DATABASE_URL || "file:./data/local.db";
const dbPath = dbUrl.replace(/^file:/, "");
const resolved = path.isAbsolute(dbPath) ? dbPath : path.resolve(dbPath);

const sqlite = new Database(resolved);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const drizzleDir = path.resolve(__dirname, "..", "drizzle");
const sqlFiles = fs
  .readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (sqlFiles.length === 0) {
  console.error("No migration SQL files found in " + drizzleDir);
  process.exit(1);
}

for (const file of sqlFiles) {
  const full = fs.readFileSync(path.join(drizzleDir, file), "utf8");
  console.log("Applying migration: " + file);
  sqlite.exec(full);
}

console.log("Migrations applied to " + resolved);
