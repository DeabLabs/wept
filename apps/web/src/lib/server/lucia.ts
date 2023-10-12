// src/lib/server/lucia.ts
import { lucia } from 'lucia';
import { discord, github } from '@lucia-auth/oauth/providers';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { postgres } from '@lucia-auth/adapter-postgresql';
import { eq } from 'drizzle-orm';
import { postgresClient, db } from '$lib/server/queries';
import { Schema } from 'database';

import 'lucia/polyfill/node';

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, HOST } =
  env;

const getCallbackUri = (provider: string) => `/login/${provider}/callback`;

export const auth = lucia({
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  adapter: postgres(postgresClient, {
    user: 'User',
    key: 'Key',
    session: 'Session'
  }),
  getUserAttributes: (user) => {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };
  }
});

export const githubAuth = github(auth, {
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET
});

export const discordAuth = discord(auth, {
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: `${HOST}${getCallbackUri('discord')}`
});

export const upgradeUser = async (
  userId: string,
  attributes: Partial<Lucia.DatabaseUserAttributes>
) => {
  const userUpdate = await db
    .update(Schema.user)
    .set(attributes)
    .where(eq(Schema.user.id, userId))
    .returning();

  if (!userUpdate.length) {
    return null;
  }

  return userUpdate[0];
};

export type Auth = typeof auth;
