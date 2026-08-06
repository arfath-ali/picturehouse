import { pool } from './pool.js';

export async function initializeWatchlistTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS watchlist(
            id INTEGER NOT NULL,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            images JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),

            PRIMARY KEY(id,user_id,type)
            )`);
    console.log('✅ Watchlist table verified');
  } catch (error) {
    throw new Error('Failed to set up watchlist table', {
      cause: error,
    });
  }
}
