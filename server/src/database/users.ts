import { pool } from './pool.js';

export async function initializeUsersTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY,
            watchlist_sort_preference TEXT DEFAULT 'recently-added'
        )`);

    await pool.query(`
      INSERT INTO users (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Users table ready');
  } catch (error) {
    throw new Error('Failed to set up users table', {
      cause: error,
    });
  }
}
