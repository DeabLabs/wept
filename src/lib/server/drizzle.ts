import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  config();
}

export const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
