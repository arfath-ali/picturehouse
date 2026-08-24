import { pool } from './pool.js';

export async function initializeUserSessionsTable() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await pool.query(`CREATE TABLE IF NOT EXISTS user_sessions(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

    console.log('✅ User sessions table is ready');
  } catch (error) {
    throw new Error('Failed to set up user sessions table', {
      cause: error,
    });
  }
}
