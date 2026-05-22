import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

console.log("Attempting to connect to Supabase database...");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in environment variables!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    console.log("\n1. Testing server connection...");
    const timeRes = await pool.query('SELECT NOW()');
    console.log(`Success! Supabase server time: ${timeRes.rows[0].now}`);

    console.log("\n2. Checking database tables...");
    const tablesRes = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    if (tablesRes.rows.length === 0) {
      console.warn("Connection succeeded, but no tables found in public schema. Did you run the database/schema.sql script in Supabase SQL editor?");
    } else {
      console.log(`Found ${tablesRes.rows.length} tables:`);
      tablesRes.rows.forEach((row) => {
        console.log(`  - ${row.tablename}`);
      });
    }

  } catch (err) {
    console.error("\nDatabase connection verification failed!");
    console.error(err);
  } finally {
    await pool.end();
  }
}

verify();
