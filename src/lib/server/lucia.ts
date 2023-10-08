// src/lib/server/lucia.ts
import { lucia } from 'lucia';
import { discord, github } from '@lucia-auth/oauth/providers';
import { prisma } from '@lucia-auth/adapter-prisma';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';
import { client } from '$lib/server/prisma';
import { env } from '$env/dynamic/private';
import 'lucia/polyfill/node';

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, HOST } =
  env;

const getCallbackUri = (provider: string) => `/login/${provider}/callback`;

export const auth = lucia({
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  adapter: prisma(client),
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
  const user = await client.user.update({
    where: {
      id: userId
    },
    data: attributes
  });
  return user;
};

export type Auth = typeof auth;
