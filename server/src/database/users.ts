import { pool } from './pool.js';

export async function initializeUsersTable() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users(
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(256),
            username VARCHAR(30) UNIQUE NOT NULL,
            email VARCHAR(256) UNIQUE NOT NULL,
            password VARCHAR(256) NOT NULL,
            watchlist_sort_preference TEXT DEFAULT 'recently-added'
        )`);
    console.log('✅ Users table ready');
  } catch (error) {
    throw new Error('Failed to set up users table', {
      cause: error,
    });
  }
}
