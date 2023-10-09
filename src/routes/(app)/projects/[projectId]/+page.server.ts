import {
  deleteProject,
  getAuthorizedProject,
  updateProject
} from '$lib/server/queries/projects.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const projectId = Number(params.projectId);
  const project = await getAuthorizedProject(projectId, session.user.userId);

  if (!project) {
    throw redirect(302, '/dashboard');
  }

  return {
    project
  };
};

export const actions = {
  update: async ({ locals, request, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const projectId = Number(params.projectId);
    const form = await request.formData();
    const name = form.get('name')?.toString();
    const context = form.get('context')?.toString();
    const description = form.get('description')?.toString();

    if (!name) {
      throw fail(400, {
        updateProject: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    await updateProject(projectId, userId, { name, context, description });

    return { updateProject: { success: true } };
  },
  delete: async ({ locals, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const projectId = Number(params.projectId);

    await deleteProject(projectId, userId);

    throw redirect(302, `/dashboard`);
  }
};
