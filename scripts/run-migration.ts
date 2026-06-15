/**
 * Run a SQL migration against the Supabase Postgres database.
 *
 * NOTE: DDL (CREATE TABLE / POLICY / FUNCTION) cannot go through the anon or
 * service_role keys — those are PostgREST/Auth JWTs and PostgREST has no
 * "run arbitrary SQL" endpoint. You need a DIRECT Postgres connection.
 *
 * Get the connection string from Supabase:
 *   Project Settings → Database → Connection string → URI
 * (use the "Session pooler" URI if your network is IPv4-only), then add it to
 * .env as:
 *   DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
 *
 * Usage:
 *   npm run migrate -- supabase/migrations/004_teacher_multi_class.sql
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Client } from "pg";

async function run() {
  const conn = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!conn) {
    console.error(
      "Missing DATABASE_URL in .env.\n\n" +
        "Get it from Supabase → Project Settings → Database → Connection string (URI),\n" +
        "then add to .env:\n" +
        "  DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres\n" +
        "(use the Session pooler URI if your network is IPv4-only)",
    );
    process.exit(1);
  }

  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run migrate -- <path/to/migration.sql>");
    process.exit(1);
  }

  const sql = readFileSync(file, "utf8");
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    process.stdout.write(`→ applying ${file} ... `);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
      console.log("ok");
    } catch (e) {
      await client.query("ROLLBACK");
      console.log("FAILED (rolled back)");
      throw e;
    }
    console.log("✓ Migration applied");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("\nMigration error:", err?.message || err);
  process.exit(1);
});
