import { auth } from '$lib/server/lucia.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (!session) return fail(401);
  await auth.invalidateSession(session.sessionId); // invalidate session
  locals.auth.setSession(null); // remove cookie
  throw redirect(302, '/login'); // redirect to login page
};

export const actions = {
  default: async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) return fail(401);
    await auth.invalidateSession(session.sessionId); // invalidate session
    locals.auth.setSession(null); // remove cookie
    throw redirect(302, '/login'); // redirect to login page
  }
};
