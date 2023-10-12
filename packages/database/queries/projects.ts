import { and, eq } from "drizzle-orm";
import { project, topic, usersInProjects, usersInTopics } from "../schema";
import type { DbType, SDbType } from ".";

type Project = typeof project.$inferSelect;
type Topic = typeof topic.$inferSelect;
// type UsersInProjects = typeof usersInProjects.$inferSelect;
export class ProjectQueries {
  constructor(private db: DbType | SDbType) {}

  getAuthorizedProject = async (projectId: number, userId: string) => {
    // user must be an admin of the project to get the authorized project
    const result = await this.db
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

  getUserProjectsWithTopics = async (userId: string) => {
    // user must be a member of the project to get the authorized project
    const result = await this.db
      .select()
      .from(usersInProjects)
      .innerJoin(
        project,
        and(
          eq(usersInProjects.projectId, project.id),
          eq(usersInProjects.userId, userId)
        )
      )
      .leftJoin(topic, eq(topic.projectId, project.id))
      .leftJoin(
        usersInTopics,
        and(
          eq(usersInTopics.topicId, topic.id),
          eq(usersInTopics.userId, userId)
        )
      );

    const formattedResult: Record<
      Project["id"],
      Project & { topics: (Topic & { admin: boolean })[]; admin: boolean }
    > = {};

    result.forEach((r) => {
      if (!formattedResult[r.Project.id]) {
        formattedResult[r.Project.id] = {
          ...r.Project,
          admin: r.UsersInProjects.admin,
          topics: [],
        };
      }

      if (r.Topic) {
        formattedResult[r.Project.id].topics.push({
          ...r.Topic,
          admin: r.UsersInTopics?.admin ?? false,
        });
      }
    });

    return Object.values(formattedResult);
  };

  createProject = async (userId: string, name: string) => {
    return this.db.transaction(async (tx) => {
      const newProject = await tx
        .insert(project)
        .values({
          name,
          updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      });

      return newProject[0];
    });
  };

  deleteProject = async (projectId: number, userId: string) => {
    // user must be an admin to delete a project
    // when a project is deleted, it should cascade and delete all topics and usersInProjects
    const isAdmin = await this.db
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

    return await this.db
      .delete(project)
      .where(and(eq(project.id, projectId)))
      .returning();
  };

  updateProject = async (
    projectId: number,
    userId: string,
    args: Pick<Partial<Project>, "name" | "context" | "description">
  ) => {
    // only admin of project can update project

    const isAdmin = await this.db
      .select()
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

    return await this.db
      .update(project)
      .set({
        ...args,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(project.id, projectId)))
      .returning();
  };
}
