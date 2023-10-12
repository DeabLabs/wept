import type { PostgresJsDatabase } from "drizzle-orm/postgres-js/driver.js";
import type { NeonDatabase } from "drizzle-orm/neon-serverless/driver.js";

import type { Schema } from "../index.js";

import { ProjectQueries } from "./projects.js";
import { TopicQueries } from "./topics.js";

export type DbType = PostgresJsDatabase<typeof Schema>;
export type SDbType = NeonDatabase<typeof Schema>;

export class Queries<T extends DbType | SDbType> {
  db: T;
  Project: ProjectQueries;
  Topic: TopicQueries;

  constructor(db: T) {
    this.db = db;
    this.Project = new ProjectQueries(db);
    this.Topic = new TopicQueries(db);
  }
}
