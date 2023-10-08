import { getTopic } from '$lib/server/queries/topics.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const topicId = params.topicId;
  const topic = await getTopic(topicId, session.user.userId);

  if (!topic) {
    throw redirect(302, '/dashboard');
  }

  return {
    topic
  };
};
