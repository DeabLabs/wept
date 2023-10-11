import { dev } from '$app/environment';
import { discordAuth } from '$lib/server/lucia.js';

export const GET = async ({ cookies }) => {
  const [url, state] = await discordAuth.getAuthorizationUrl();
  // store state
  cookies.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: !dev,
    path: '/',
    maxAge: 60 * 60
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString()
    }
  });
};
