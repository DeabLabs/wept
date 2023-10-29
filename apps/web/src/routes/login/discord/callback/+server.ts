import { auth, discordAuth, upgradeUser } from '$lib/server/lucia.js';
import { OAuthRequestError } from '@lucia-auth/oauth';

const makeDiscordAvatarUrl = (id: string, avatarId: string) =>
  `https://cdn.discordapp.com/avatars/${id}/${avatarId}.png`;

export const GET = async ({ url, cookies, locals }) => {
  const storedState = cookies.get('discord_oauth_state');
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  // validate state
  if (!storedState || !state || storedState !== state || !code) {
    return new Response(null, {
      status: 400
    });
  }
  try {
    const { getExistingUser, discordUser, createUser } = await discordAuth.validateCallback(code);

    const getUser = async () => {
      const existingUser = await getExistingUser();

      if (existingUser) {
        if (!existingUser.avatar) {
          await upgradeUser(existingUser.id, {
            avatar: makeDiscordAvatarUrl(discordUser.id, discordUser.avatar)
          });
        }

        return existingUser;
      }
      const user = await createUser({
        attributes: {
          username: discordUser.username,
          email: discordUser.email ?? null,
          avatar: makeDiscordAvatarUrl(discordUser.id, discordUser.avatar)
        }
      });
      return user;
    };

    const user = await getUser();
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {}
    });
    locals.auth.setSession(session);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/profile'
      }
    });
  } catch (e) {
    if (e instanceof OAuthRequestError) {
      // invalid code
      return new Response(null, {
        status: 400
      });
    }

    console.error(e);

    return new Response(null, {
      status: 500
    });
  }
};
