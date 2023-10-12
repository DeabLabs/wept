import { fail, redirect } from '@sveltejs/kit';
import { queries } from '$lib/server/queries/index.js';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const topicId = Number(params.topicId);
  const topic = await queries.Topic.getAuthorizedTopic(topicId, session.user.userId);

  if (!topic) {
    throw redirect(302, '/dashboard');
  }

  return {
    topic,
    chatUrl: `/projects/${params.projectId}/topics/${params.topicId}/chat`
  };
};

export const actions = {
  delete: async ({ locals, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const topicId = Number(params.topicId);

    await queries.Topic.deleteTopic(topicId, userId);

    throw redirect(302, `/dashboard`);
  },
  update: async ({ locals, request, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const topicId = Number(params.topicId);
    const form = await request.formData();
    const name = form.get('name')?.toString();
    const description = form.get('description')?.toString();
    const context = form.get('context')?.toString();

    if (!name) {
      return fail(400, {
        updateTopic: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    await queries.Topic.updateTopic(topicId, userId, { name, description, context });

    return { updateTopic: { success: true } };
  }
};
