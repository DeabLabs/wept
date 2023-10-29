import { fail, redirect } from '@sveltejs/kit';
import { queries } from '$lib/server/queries/index.js';

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
      return fail(400, {
        createProject: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    const project = await queries.Project.createProject(userId, name);

    if (!project) {
      return fail(400, {
        createProject: {
          success: false,
          errors: {
            general: 'Could not create project'
          }
        }
      });
    }

    await queries.Project.donateKey(project.id, userId);

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
      return fail(400, {
        createTopic: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    if (!projectId || isNaN(projectId)) {
      return fail(400, {
        createTopic: {
          success: false,
          errors: {
            projectId: 'Project ID is required'
          }
        }
      });
    }

    const topic = await queries.Topic.createTopic(projectId, userId, name);

    if (!topic) {
      return fail(400, {
        createTopic: {
          success: false,
          errors: {
            general: 'Could not create topic'
          }
        }
      });
    }

    return {
      createTopic: { success: true }
    };
  }
};
