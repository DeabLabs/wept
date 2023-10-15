import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { queries } from '$lib/server/queries';

// if the openai value is set to this, then the user has an openai key configured
// update operations will just ignore the value, and not set anything
const PRIVATE_OPENAI_VALUE = 'OPENAI-SECRET-KEY';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const hasOpenaiKey = await queries.User.hasOpenAiKey(session.user.id);

  return {
    user: session.user,
    openai: hasOpenaiKey ? PRIVATE_OPENAI_VALUE : ''
  };
};

export const actions = {
  update: async ({ locals, request }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const form = await request.formData();
    const username = form.get('username')?.toString();
    const openai = form.get('openai')?.toString();

    if (!username) {
      return fail(400, {
        update: {
          success: false,
          errors: {
            username: 'Username is required'
          }
        }
      });
    }

    await queries.User.updateUser(session.user.id, { username });

    if (!openai) {
      await queries.User.deleteLatestOpenAiKey(session.user.id);
    } else if (openai !== PRIVATE_OPENAI_VALUE) {
      await queries.User.upsertLatestOpenAiKey(session.user.id, openai);
    }

    return { update: { success: true } };
  }
};
