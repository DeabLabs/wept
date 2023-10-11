import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = env;

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) throw redirect(302, '/');

  return {
    availableAuthProviders: {
      github: !!GITHUB_CLIENT_ID && !!GITHUB_CLIENT_SECRET,
      discord: !!DISCORD_CLIENT_ID && !!DISCORD_CLIENT_SECRET
    }
  };
};
