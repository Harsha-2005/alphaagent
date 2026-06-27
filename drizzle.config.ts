import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const url = process.env.DATABASE_URL || '';
const isNeon = url.includes('neon.tech') || url.includes('neondb');

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
    ...(isNeon ? {} : { ssl: false }),
  },
} satisfies Config;
