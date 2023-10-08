import { client } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';

export const getAuthorizedProject = async (projectId: string, userId: string) => {
  // user must be an admin of the project to get the authorized project
  const project = await client.project.findFirst({
    where: {
      id: projectId,
      users: {
        some: {
          user_id: userId,
          admin: true
        }
      }
    }
  });

  return project;
};

export const getAuthorizedProjectsWithTopics = async (userId: string) => {
  const projects = await client.project.findMany({
    where: {
      users: {
        some: {
          user_id: userId
        }
      }
    },
    include: {
      topics: {
        where: {
          users: {
            some: {
              user_id: userId
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return projects;
};

export const createProject = async (userId: string, name: string) => {
  const project = await client.project.create({
    data: {
      name,
      users: {
        create: {
          user_id: userId,
          admin: true
        }
      }
    }
  });
  return project;
};

export const deleteProject = async (projectId: string, userId: string) => {
  // user must be an admin to delete a project
  const project = await client.project.findFirst({
    where: {
      id: projectId,
      users: {
        some: {
          user_id: userId,
          admin: true
        }
      }
    }
  });

  if (!project) {
    return null;
  }

  const deletedProject = await client.project.delete({
    where: {
      id: projectId
    }
  });

  return deletedProject;
};

export const updateProject = async (
  projectId: string,
  userId: string,
  args: Pick<Prisma.ProjectUpdateInput, 'name' | 'context' | 'description'>
) => {
  // only admin of project can update project
  const project = await client.project.findFirst({
    where: {
      id: projectId,
      users: {
        some: {
          user_id: userId,
          admin: true
        }
      }
    }
  });

  if (!project) {
    return null;
  }

  const updatedProject = await client.project.update({
    where: {
      id: projectId
    },
    data: args
  });

  return updatedProject;
};
