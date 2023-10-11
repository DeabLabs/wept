import { fail, redirect } from '@sveltejs/kit';
import { Queries } from 'database';

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  throw redirect(302, '/dashboard');
};

export const actions = {
  createProject: async ({ locals, request }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const form = await request.formData();
    const name = form.get('name')?.toString();

    if (!name) {
      throw fail(400, {
        createProject: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    await Queries.Project.createProject(userId, name);

    return { createProject: { success: true } };
  },
  createTopic: async ({ locals, request }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const form = await request.formData();
    const name = form.get('name')?.toString();
    const projectId = Number(form.get('projectId')?.toString());

    if (!name) {
      throw fail(400, {
        createTopic: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    if (!projectId || isNaN(projectId)) {
      throw fail(400, {
        createTopic: {
          success: false,
          errors: {
            projectId: 'Project ID is required'
          }
        }
      });
    }

    await Queries.Topic.createTopic(projectId, userId, name);

    return { createTopic: { success: true } };
  }
};