import { PARTY_HOST } from '$env/static/private';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const body = await request.json();
    const { projectId, topicId } = body;

    const roomId = `${projectId}-${topicId}`;
    const url = `${PARTY_HOST}/party/${roomId}`;
    const authResponse = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        userId: session.user.userId,
        roomId
      }),
      headers: {
        Authorization: `Bearer ${session.sessionId}`
      }
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate');
    }

    return authResponse;
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to authenticate' }), { status: 400 });
  }
};
