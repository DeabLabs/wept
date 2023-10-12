import { drizzle as dPg } from "drizzle-orm/postgres-js";
import { drizzle as sPg } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export const getServerlessDb = (c: Parameters<typeof sPg>[0]) =>
  sPg(c, { schema });

export const getDb = (c: Parameters<typeof dPg>[0]) => dPg(c, { schema });
