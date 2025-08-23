import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

async function checkDatabase() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool);
    
    // Check if invitations table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('invitations', 'user_invitations');
    `);
    
    console.log('Existing invitation-related tables:', result.rows);
    
    // Check existing enums
    const enumResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typname LIKE '%status%';
    `);
    
    console.log('Existing status enums:', enumResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
}

checkDatabase();
