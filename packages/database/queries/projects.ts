import { and, desc, eq } from "drizzle-orm";
import {
  donatedKeyInProjects,
  project,
  topic,
  userOpenAiKey,
  usersInProjects,
  usersInTopics,
} from "../schema";
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
    args: Pick<Partial<Project>, "name" | "context" | "description" | "model">
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

  donateKey = async (projectId: number, userId: string) => {
    // user must be a member of the project to donate a key
    const result = await this.db
      .select()
      .from(usersInProjects)
      .innerJoin(project, eq(usersInProjects.projectId, project.id))
      .where(
        and(
          eq(usersInProjects.userId, userId),
          eq(usersInProjects.projectId, projectId)
        )
      )
      .limit(1);

    if (!result.length) {
      return null;
    }

    // user must have at least one key to donate a key
    const user = await this.db
      .select()
      .from(usersInProjects)
      .where(
        and(
          eq(usersInProjects.userId, userId),
          eq(usersInProjects.projectId, projectId)
        )
      )
      .limit(1);

    if (!user.length) {
      return null;
    }

    const keys = await this.db
      .select()
      .from(userOpenAiKey)
      .where(eq(userOpenAiKey.userId, userId))
      .orderBy(desc(userOpenAiKey.updatedAt))
      .limit(1);

    if (!keys.length) {
      return null;
    }

    // donate key to project
    const donatedKey = await this.db
      .insert(donatedKeyInProjects)
      .values({
        projectId: projectId,
        userId: userId,
        userOpenAiKeyId: keys[0].id,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!donatedKey.length) {
      return null;
    }

    return donatedKey[0];
  };

  revokeKey = async (projectId: number, userId: string) => {
    // user must be an admin of the project to revoke a key
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

    const result = await this.db
      .delete(donatedKeyInProjects)
      .where(
        and(
          eq(donatedKeyInProjects.projectId, projectId),
          eq(donatedKeyInProjects.userId, userId)
        )
      )
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  hasDonatedProjectKey = async (projectId: number, userId: string) => {
    // if the user isn't an admin member of the project, return null
    // if the user is an admin member, and its their key, return "own_key"
    // if the user is an admin member, and its not their key, return "donated_key"

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

    if (!isAdmin.length) {
      return null;
    }

    const donatedKey = await this.db
      .select()
      .from(donatedKeyInProjects)
      .where(eq(donatedKeyInProjects.projectId, projectId))
      .limit(1);

    if (!donatedKey.length) {
      return null;
    }

    if (donatedKey[0].userId === userId) {
      return "own_key";
    }

    return "donated_key";
  };

  /** @todo decrypt user openai key */
  UNSAFE_getDonatedProjectKey = async (projectId: number) => {
    const result = await this.db
      .select()
      .from(donatedKeyInProjects)
      .innerJoin(
        userOpenAiKey,
        eq(donatedKeyInProjects.userOpenAiKeyId, userOpenAiKey.id)
      )
      .orderBy(desc(donatedKeyInProjects.updatedAt))
      .where(eq(donatedKeyInProjects.projectId, projectId))
      .limit(1);

    if (!result.length) {
      return null;
    }

    return result[0].UserOpenAiKey.key;
  };
}
