import { pool } from './pool.db.js';

export async function syncWatchlistSchema() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS watchlist(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        tmdb_id TEXT NOT NULL,

        title TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        imdb_id TEXT,
        
        added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

        UNIQUE (user_id, tmdb_id)
        )`);
    console.log('✅ Watchlist schema synchronized');
  } catch (error) {
    console.error('❌ Error setting up watchlist table: ', error);
    process.exit(1);
  }
}
