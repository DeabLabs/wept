import { DATABASE_URL } from '$env/static/private';
import { Queries as QueryClient, getDb } from 'database';
import postgres from 'postgres';

export const postgresClient = postgres(DATABASE_URL);
export const db = getDb(postgresClient);

export const queries = new QueryClient(db);
