// Database connection — auto-detects local pg vs Neon serverless
// - Local PostgreSQL: uses standard pg driver (no SSL required)
// - Neon cloud: uses @neondatabase/serverless with HTTP transport

import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

export { schema };

let _db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg> | null = null;

function isNeonUrl(url: string): boolean {
  return url.includes('neon.tech') || url.includes('neon.database') || url.includes('neondb');
}

export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (_db) return _db;

  const url = process.env.DATABASE_URL;

  try {
    if (isNeonUrl(url)) {
      // Neon cloud — use HTTP-based serverless driver
      const sql = neon(url);
      _db = drizzleNeon(sql, { schema });
    } else {
      // Local PostgreSQL (or any standard TCP connection)
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: url,
        ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      });
      _db = drizzlePg(pool, { schema });
    }
    return _db;
  } catch (err) {
    console.error('DB connection failed:', err);
    return null;
  }
}

// Proxy — safely returns null ops when DB not configured
export const db = new Proxy({} as ReturnType<typeof drizzlePg>, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) return () => Promise.resolve(null);
    return (instance as any)[prop];
  },
});
