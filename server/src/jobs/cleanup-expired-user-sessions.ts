import { pool } from '../database/pool.js';

export async function cleanupExpiredUserSessions() {
  try {
    await pool.query(`
      DELETE FROM user_sessions
      WHERE expires_at < NOW()
    `);
  } catch (error) {
    throw new Error('Failed to clean up expired user sessions', {
      cause: error,
    });
  }
}
