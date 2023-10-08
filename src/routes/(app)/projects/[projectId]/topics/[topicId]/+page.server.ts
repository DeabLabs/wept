import { getTopic, updateTopic } from '$lib/server/queries/topics.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const topicId = params.topicId;
  const topic = await getTopic(topicId, session.user.userId);

  if (!topic) {
    throw redirect(302, '/dashboard');
  }

  return {
    topic,
    chatUrl: `/projects/${params.projectId}/topics/${params.topicId}/chat`
  };
};

export const actions = {
  update: async ({ locals, request, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const topicId = params.topicId;
    const form = await request.formData();
    const name = form.get('name')?.toString();
    const description = form.get('description')?.toString();
    const context = form.get('context')?.toString();

    if (!name) {
      throw fail(400, {
        updateTopic: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    await updateTopic(topicId, userId, { name, description, context });

    return { updateTopic: { success: true } };
  }
};
