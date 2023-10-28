import { and, eq } from "drizzle-orm";
import type { DbType, SDbType } from ".";
import { temporaryTokens } from "../schema";
import { addHours, getCurrentDateInUTC, isBefore } from "../dates";

export class TemporaryTokensQueries {
  constructor(private db: DbType | SDbType) {}

  async validateAndConsumeToken(key: string, value: string) {
    const row = await this.db
      .select()
      .from(temporaryTokens)
      .where(and(eq(temporaryTokens.id, key), eq(temporaryTokens.value, value)))
      .limit(1);

    if (!row.length) {
      return null;
    }

    const token = row[0];

    if (isBefore(token.expiresAt, getCurrentDateInUTC())) {
      return null;
    }

    await this.db
      .delete(temporaryTokens)
      .where(
        and(eq(temporaryTokens.id, key), eq(temporaryTokens.value, value))
      );

    return token;
  }

  async deleteToken(key: string) {
    await this.db
      .delete(temporaryTokens)
      .where(and(eq(temporaryTokens.id, key)));
  }

  async createToken(key: string, value: string) {
    await this.deleteToken(key);
    const expiresAt = addHours(getCurrentDateInUTC(), 1);

    const row = await this.db
      .insert(temporaryTokens)
      .values({
        id: key,
        value,
        expiresAt,
      })
      .returning();

    return row[0] || null;
  }
}
