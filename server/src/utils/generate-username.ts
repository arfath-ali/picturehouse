import { pool } from '../database/pool.js';
import type { GoogleUserProfile } from '../types/google-auth.js';

export async function generateUniqueUsername(profile: GoogleUserProfile) {
  const emailPrefix = profile?.email ? profile.email.split('@')[0] : '';

  const rawName =
    profile?.given_name ||
    profile?.name ||
    profile?.family_name ||
    emailPrefix ||
    'user';

  let base = rawName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (base.length < 3) {
    base = base.padEnd(3, '0');
  }

  base = base.slice(0, 26);

  const { rows } = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [base],
  );

  if (rows.length === 0) return base;

  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${base}_${randomSuffix}`;
}
