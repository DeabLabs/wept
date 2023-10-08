import { getAuthorizedProjectsWithTopics } from '$lib/server/queries/projects.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, depends }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const projects = await getAuthorizedProjectsWithTopics(session.user.userId);
  depends('app:rootLayout');

  return {
    user: session.user,
    projects
  };
};
