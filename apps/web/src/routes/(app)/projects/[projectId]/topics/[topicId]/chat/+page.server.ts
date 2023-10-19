import { PARTY_HOST } from '$env/static/private';
import { queries } from '$lib/server/queries/index.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const topicId = Number(params.topicId);
  const topic = await queries.Topic.getTopic(topicId, session.user.userId);

  if (!topic) {
    throw redirect(302, '/dashboard');
  }

  return {
    user: session.user,
    admin: topic.members.find((m) => m.id === session.user.userId)?.admin ?? false,
    topic,
    partyOptions: {
      host: PARTY_HOST,
      room: `${params.projectId}-${params.topicId}`,
      id: session.user.userId
    },
    settingsLink: `/projects/${params.projectId}/topics/${params.topicId}`
  };
};

export const actions = {
  invite: async ({ locals, request, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const topicId = Number(params.topicId);
    const topic = await queries.Topic.getTopic(topicId, session.user.userId);

    if (!topic) {
      return redirect(302, '/dashboard');
    }

    const form = await request.formData();
    const id = form.get('member-id')?.toString();

    if (!id) {
      return fail(400, {
        invite: {
          success: false,
          errors: {
            memberId: 'Member ID is required'
          }
        }
      });
    }

    const result = await queries.Topic.inviteUserById(topicId, session.user.id, id);

    if (!result) {
      return fail(400, {
        invite: {
          success: false,
          errors: {
            memberId: 'Member ID could not be invited'
          }
        }
      });
    }

    return { invite: { success: true } };
  }
};
