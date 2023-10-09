import { db } from '$lib/server/drizzle';
import { and, eq } from 'drizzle-orm';
import { project, topic, usersInProjects } from '../../../../drizzle/schema';

type Project = typeof project.$inferSelect;
type Topic = typeof topic.$inferSelect;
// type UsersInProjects = typeof usersInProjects.$inferSelect;

export const getAuthorizedProject = async (projectId: number, userId: string) => {
  // user must be an admin of the project to get the authorized project
  const result = await db
    .select()
    .from(usersInProjects)
    .innerJoin(project, eq(usersInProjects.projectId, project.id))
    .where(
      and(
        eq(usersInProjects.userId, userId),
        eq(usersInProjects.admin, true),
        eq(usersInProjects.projectId, projectId)
      )
    )
    .limit(1);

  if (!result.length) {
    return null;
  }

  return result[0].Project;
};

export const getAuthorizedProjectsWithTopics = async (userId: string) => {
  // user must be an admin of the project to get the authorized project
  const result = await db
    .select()
    .from(usersInProjects)
    .innerJoin(project, eq(usersInProjects.projectId, project.id))
    .leftJoin(topic, eq(topic.projectId, project.id))
    .where(and(eq(usersInProjects.userId, userId), eq(usersInProjects.admin, true)));

  const formattedResult: Record<Project['id'], Project & { topics: Topic[] }> = {};

  result.forEach((r) => {
    if (!formattedResult[r.Project.id]) {
      formattedResult[r.Project.id] = {
        ...r.Project,
        topics: []
      };
    }

    if (r.Topic) {
      formattedResult[r.Project.id].topics.push(r.Topic);
    }
  });

  return Object.values(formattedResult);
};

export const createProject = async (userId: string, name: string) => {
  return db.transaction(async (tx) => {
    const newProject = await tx
      .insert(project)
      .values({
        name,
        updatedAt: new Date().toISOString()
      })
      .returning();

    if (newProject.length === 0) {
      tx.rollback();
      return null;
    }

    await tx.insert(usersInProjects).values({
      userId,
      projectId: newProject[0].id,
      admin: true,
      updatedAt: new Date().toISOString()
    });

    return newProject[0];
  });
};

export const deleteProject = async (projectId: number, userId: string) => {
  // user must be an admin to delete a project
  // when a project is deleted, it should cascade and delete all topics and usersInProjects
  const isAdmin = await db
    .select({ admin: usersInProjects.admin })
    .from(usersInProjects)
    .where(
      and(
        eq(usersInProjects.projectId, projectId),
        eq(usersInProjects.userId, userId),
        eq(usersInProjects.admin, true)
      )
    );

  if (!isAdmin.length || !isAdmin[0].admin) {
    return null;
  }

  return await db
    .delete(project)
    .where(and(eq(project.id, projectId)))
    .returning();
};

export const updateProject = async (
  projectId: number,
  userId: string,
  args: Pick<Partial<Project>, 'name' | 'context' | 'description'>
) => {
  // only admin of project can update project

  return await db
    .update(project)
    .set({
      ...args,
      updatedAt: new Date().toISOString()
    })
    .where(
      and(
        eq(project.id, projectId),
        eq(project.id, usersInProjects.projectId),
        eq(usersInProjects.userId, userId),
        eq(usersInProjects.admin, true)
      )
    )
    .returning();
};
