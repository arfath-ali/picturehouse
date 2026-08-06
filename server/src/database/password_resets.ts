import { pool } from './pool.js';

export async function initializePasswordResetsTable() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await pool.query(`CREATE TABLE IF NOT EXISTS password_resets(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        reset_password_token VARCHAR(256),
        reset_password_link_expires_at TIMESTAMPTZ
    )`);

    console.log('✅ Password resets table is ready');
  } catch (error) {
    throw new Error('Failed to set up password resets table', {
      cause: error,
    });
  }
}
