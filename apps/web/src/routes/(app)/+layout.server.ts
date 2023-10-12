import { queries } from '$lib/server/queries/index.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, depends }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const projects = await queries.Project.getUserProjectsWithTopics(session.user.userId);
  depends('app:rootLayout');

  return {
    user: session.user,
    projects
  };
};
