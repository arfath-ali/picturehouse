import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (error) => {
  console.error('❌ PostgreSQL Pool Background Error:', error);
});

export async function checkDatabaseConnection() {
  try {
    const res = await pool.query('SELECT current_database() AS db_name');
    const dbName = res.rows[0].db_name;
    console.log(`✅ Database connected to [${dbName}]`);
  } catch (error) {
    throw new Error('Failed to connect to the database', {
      cause: error,
    });
  }
}
