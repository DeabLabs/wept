import { desc, eq } from "drizzle-orm";
import type { DbType, SDbType } from ".";
import { user, userOpenAiKey } from "../schema";

type User = typeof user.$inferSelect;

export class UserQueries {
  constructor(private db: DbType | SDbType) {}

  getUser = async (userId: string) => {
    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  updateUser = async (userId: string, args: Omit<Partial<User>, "id">) => {
    const result = await this.db
      .update(user)
      .set(args)
      .where(eq(user.id, userId))
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  /** @todo encrypt openaikey before storing it */
  addOpenAiKey = async (userId: string, openAiKey: string) => {
    const result = await this.db
      .insert(userOpenAiKey)
      .values({
        userId,
        key: openAiKey,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  deleteLatestOpenAiKey = async (userId: string) => {
    const latest = await this.db
      .select()
      .from(userOpenAiKey)
      .where(eq(userOpenAiKey.userId, userId))
      .orderBy(desc(userOpenAiKey.updatedAt))
      .limit(1);

    if (!latest.length) {
      return null;
    }

    const result = await this.db
      .delete(userOpenAiKey)
      .where(eq(userOpenAiKey.id, latest[0].id))
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  upsertLatestOpenAiKey = async (userId: string, openAiKey: string) => {
    const latest = await this.db
      .select()
      .from(userOpenAiKey)
      .where(eq(userOpenAiKey.userId, userId))
      .orderBy(desc(userOpenAiKey.updatedAt))
      .limit(1);

    if (!latest.length) {
      return this.addOpenAiKey(userId, openAiKey);
    }

    const result = await this.db
      .update(userOpenAiKey)
      .set({
        key: openAiKey,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userOpenAiKey.id, latest[0].id))
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  hasOpenAiKey = async (userId: string) => {
    const result = await this.db
      .select()
      .from(userOpenAiKey)
      .where(eq(userOpenAiKey.userId, userId))
      .limit(1);

    if (!result.length) {
      return null;
    }

    return !!result[0].key;
  };
}
