import { pool } from '../database/pool.js';

export async function cleanupExpiredResetTokens() {
  try {
    await pool.query(`
      DELETE FROM password_resets
      WHERE reset_password_link_expires_at < NOW()
    `);
  } catch (error) {
    throw new Error('Failed to clean up expired reset tokens', {
      cause: error,
    });
  }
}
