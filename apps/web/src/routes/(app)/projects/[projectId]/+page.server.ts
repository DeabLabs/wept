import { fail, redirect } from '@sveltejs/kit';
import { queries } from '$lib/server/queries/index.js';
import { literal, optional, parse, union } from 'valibot';

export const load = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  if (!session) throw redirect(302, '/login');

  const projectId = Number(params.projectId);
  const project = await queries.Project.getAuthorizedProject(projectId, session.user.userId);

  if (!project) {
    throw redirect(302, '/dashboard');
  }

  const hasDonatedProjectKey = await queries.Project.hasDonatedProjectKey(
    projectId,
    session.user.userId
  );

  return {
    project,
    hasDonatedProjectKey
  };
};

const modelSchema = optional(
  union([literal('gpt-3.5-turbo'), literal('gpt-4'), literal('gpt-3.5-turbo-16k')])
);

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
    const donateKey = form.get('donate')?.toString();
    const removeKey = form.get('remove')?.toString();
    const modelRaw = form.get('model')?.toString();
    const model = parse(modelSchema, modelRaw);

    if (!name) {
      return fail(400, {
        updateProject: {
          success: false,
          errors: {
            name: 'Name is required'
          }
        }
      });
    }

    // replace this project's key with the user's latest key
    if (donateKey) {
      const result = await queries.Project.donateKey(projectId, userId);

      if (!result) {
        return fail(400, {
          updateProject: {
            success: false,
            errors: {
              donate: 'Failed to donate key, did you configure a key in your profile?'
            }
          }
        });
      }
    } else if (removeKey) {
      const result = await queries.Project.revokeKey(projectId, userId);

      if (!result) {
        return fail(400, {
          updateProject: {
            success: false,
            errors: {
              remove: 'Failed to revoke key.'
            }
          }
        });
      }
    }

    const result = await queries.Project.updateProject(projectId, userId, {
      name,
      context,
      description,
      model
    });

    if (!result) {
      return fail(400, {
        updateProject: {
          success: false,
          errors: {
            general: 'Failed to update project.'
          }
        }
      });
    }

    return { updateProject: { success: true } };
  },
  delete: async ({ locals, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');

    const userId = session.user.userId;
    const projectId = Number(params.projectId);

    await queries.Project.deleteProject(projectId, userId);

    throw redirect(302, `/dashboard`);
  }
};
