import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to connect to Supabase.");
}

const connectionString = process.env.DATABASE_URL.replace(
  "Azim@4_5_6_7",
  encodeURIComponent("Azim@4_5_6_7"),
);

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected PostgreSQL pool error:", err);
});

const roleMap = {
  admin: "super_admin",
  manager: "team_manager",
};

export function normalizeRole(role) {
  return roleMap[role] || role || "audience";
}

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function verifyDatabaseConnection() {
  const row = await queryOne("SELECT NOW() AS now");
  console.log(`[DB] Connected to Supabase. Server time: ${row.now}`);
}

export async function runMigrations() {
  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS is_wicket_keeper BOOLEAN DEFAULT FALSE NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE match_state
    ADD COLUMN IF NOT EXISTS live_data JSONB DEFAULT '{}'::jsonb NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE match_state
    ADD COLUMN IF NOT EXISTS revision INT DEFAULT 0 NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE ball_commentary
    ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}'::jsonb NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE ball_commentary
    ADD COLUMN IF NOT EXISTS state_before JSONB;
  `);

  await pool.query(`
    ALTER TABLE ball_commentary
    ADD COLUMN IF NOT EXISTS state_after JSONB;
  `);
}
