import { pool } from './pool.js';

export async function initializeWatchlistTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS watchlist(
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            images JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
            )`);
    console.log('✅ Watchlist table ready');
  } catch (error) {
    throw new Error('Failed to set up watchlist table', {
      cause: error,
    });
  }
}
