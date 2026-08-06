import { pool } from '../database/pool.js';

export async function cleanupUnverifiedUsers() {
  try {
    await pool.query(`
        DELETE FROM users
        WHERE is_verified = FALSE AND created_at < NOW() - INTERVAL '24 hours'
        `);
  } catch (error) {
    throw new Error('Failed to clean up unverified users', {
      cause: error,
    });
  }
}
