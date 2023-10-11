import { redirect } from '@sveltejs/kit';
import { Queries } from 'database';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const topicId = Number(params.topicId);
  const topic = await Queries.Topic.getTopic(topicId, session.user.userId);

  if (!topic) {
    throw redirect(302, '/dashboard');
  }

  return {
    topic,
    settingsLink: `/projects/${params.projectId}/topics/${params.topicId}`
  };
};
