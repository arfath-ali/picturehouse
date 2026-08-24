import { pool } from './pool.js';

export async function initializeUsersTable() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users(
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            google_id VARCHAR(255) UNIQUE,

            avatar_url TEXT,
            full_name VARCHAR(256),
            username VARCHAR(30) UNIQUE NOT NULL,
            email VARCHAR(256) UNIQUE NOT NULL,
            password VARCHAR(256),

            is_verified BOOLEAN DEFAULT FALSE,
            otp VARCHAR(64),
            otp_expires_at TIMESTAMPTZ,

            watchlist_sort_preference TEXT DEFAULT 'recently-added',

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);

    console.log('✅ Users table verified');
  } catch (error) {
    throw new Error('Failed to set up users table', {
      cause: error,
    });
  }
}
