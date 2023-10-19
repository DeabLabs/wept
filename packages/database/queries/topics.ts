import { and, asc, desc, eq } from "drizzle-orm";
import {
  message,
  topic,
  user,
  usersInProjects,
  usersInTopics,
} from "../schema";
import type { DbType, SDbType } from ".";

type Topic = typeof topic.$inferSelect;
export class TopicQueries {
  constructor(private db: DbType | SDbType) {}

  UNSAFE_getTopic = async (topicId: number) => {
    const result = await this.db
      .select()
      .from(topic)
      .where(eq(topic.id, topicId))
      .limit(1);

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  getAuthorizedTopic = async (topicId: number, userId: string) => {
    // user must be an admin of the topic to get the authorized topic
    const result = await this.db
      .select()
      .from(usersInTopics)
      .innerJoin(topic, eq(usersInTopics.topicId, topic.id))
      .where(
        and(
          eq(usersInTopics.userId, userId),
          eq(usersInTopics.topicId, topicId),
          eq(usersInTopics.admin, true)
        )
      )
      .limit(1);

    if (!result.length) {
      return null;
    }

    return { ...result[0].Topic, admin: result[0].UsersInTopics.admin };
  };

  getTopic = async (topicId: number, userId: string) => {
    // get a topic if the user is a member of the topic
    const result = await this.db
      .select()
      .from(usersInTopics)
      .innerJoin(topic, eq(usersInTopics.topicId, topic.id))
      .where(
        and(
          eq(usersInTopics.userId, userId),
          eq(usersInTopics.topicId, topicId)
        )
      )
      .limit(1);

    if (!result.length) {
      return null;
    }

    const members = await this.db
      .select({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        admin: usersInTopics.admin,
      })
      .from(usersInTopics)
      .innerJoin(user, eq(usersInTopics.userId, user.id))
      .where(eq(usersInTopics.topicId, topicId));

    return {
      ...result[0].Topic,
      admin: result[0].UsersInTopics.admin,
      members,
    };
  };

  createTopic = async (projectId: number, userId: string, name: string) => {
    // a user can create a topic within a project, only if they are an admin of the project
    const result = await this.db
      .select()
      .from(usersInProjects)
      .where(
        and(
          eq(usersInProjects.projectId, projectId),
          eq(usersInProjects.userId, userId),
          eq(usersInProjects.admin, true)
        )
      )
      .limit(1);

    if (!result.length) {
      return null;
    }

    return this.db.transaction(async (tx) => {
      const newTopic = await tx
        .insert(topic)
        .values({
          name,
          projectId,
          updatedAt: new Date().toISOString(),
        })
        .returning();

      if (!newTopic.length) {
        tx.rollback();
        return null;
      }

      const allUsersInProject = await tx
        .select()
        .from(usersInProjects)
        .where(eq(usersInProjects.projectId, projectId));

      const txs = allUsersInProject.map((u) =>
        tx.insert(usersInTopics).values({
          userId: u.userId,
          topicId: newTopic[0].id,
          admin: userId === u.userId,
          updatedAt: new Date().toISOString(),
        })
      );

      await Promise.allSettled(txs);

      return newTopic[0];
    });
  };

  updateTopic = async (
    topicId: number,
    userId: string,
    args: Pick<Partial<Topic>, "name" | "context" | "description">
  ) => {
    // only admin of topic can update topic
    const isAdmin = await this.db
      .select()
      .from(usersInTopics)
      .where(
        and(
          eq(usersInTopics.topicId, topicId),
          eq(usersInTopics.userId, userId)
        )
      );

    if (!isAdmin.length || !isAdmin[0].admin) {
      return null;
    }

    const result = await this.db
      .update(topic)
      .set(args)
      .where(and(eq(topic.id, topicId)))
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  deleteTopic = async (topicId: number, userId: string) => {
    // user must be an admin to delete a topic
    // when a topic is deleted, it should cascade and delete all messages and usersInTopics

    const isAdmin = await this.db
      .select({ admin: usersInTopics.admin })
      .from(usersInTopics)
      .where(
        and(
          eq(usersInTopics.topicId, topicId),
          eq(usersInTopics.userId, userId),
          eq(usersInTopics.admin, true)
        )
      );

    if (!isAdmin.length || !isAdmin[0].admin) {
      return null;
    }

    return await this.db
      .delete(topic)
      .where(and(eq(topic.id, topicId)))
      .returning();
  };

  addMessageToTopic = async (
    topicId: number,
    userId: string,
    content: string
  ) => {
    // a user can add a message to a topic if they are a member of the topic
    const result = await this.db
      .select()
      .from(usersInTopics)
      .where(
        and(
          eq(usersInTopics.topicId, topicId),
          eq(usersInTopics.userId, userId)
        )
      )
      .limit(1);

    if (!result.length) {
      return null;
    }

    const newMessage = await this.db
      .insert(message)
      .values({
        topicId,
        authorId: userId,
        content,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!newMessage.length) {
      return null;
    }

    return newMessage[0];
  };

  UNSAFE_getMessagesInTopic = async (
    topicId: number,
    direction: "asc" | "desc" = "desc"
  ) => {
    // get all messages in a topic
    // this does not check that the user is a member of the topic
    // this should just be used by the messages server
    return await this.db
      .select()
      .from(message)
      .where(eq(message.topicId, topicId))
      .orderBy(
        direction === "desc" ? desc(message.createdAt) : asc(message.createdAt)
      );
  };

  inviteUserById = async (
    topicId: number,
    userId: string,
    inviteeId: string
  ) => {
    // only admins can invite other users, so check that userId is an admin for the topic and project first
    // need to add invitee to project as well

    const isAdmin = await this.db
      .select({
        admin: usersInTopics.admin,
        projectId: usersInProjects.projectId,
      })
      .from(usersInTopics)
      .innerJoin(
        usersInProjects,
        eq(usersInTopics.userId, usersInProjects.userId)
      )
      .where(
        and(
          eq(usersInTopics.topicId, topicId),
          eq(usersInTopics.userId, userId),
          eq(usersInTopics.admin, true),
          eq(usersInProjects.admin, true)
        )
      );

    if (!isAdmin.length || !isAdmin[0].admin) {
      return null;
    }

    const result = await this.db.transaction(async (tx) => {
      const invitee = await tx
        .select()
        .from(user)
        .where(eq(user.id, inviteeId))
        .limit(1);

      if (!invitee.length) {
        return null;
      }

      await tx.insert(usersInProjects).values({
        userId: inviteeId,
        projectId: isAdmin[0].projectId,
        admin: false,
        updatedAt: new Date().toISOString(),
      });

      await tx.insert(usersInTopics).values({
        userId: inviteeId,
        topicId,
        admin: false,
        updatedAt: new Date().toISOString(),
      });

      return invitee[0];
    });

    if (!result) {
      return null;
    }

    return result;
  };

  addAIMessageToTopic = async (topicId: number, content: string) => {
    // this does not check that the user is a member of the topic
    // this should just be used by the messages server
    const newMessage = await this.db
      .insert(message)
      .values({
        topicId,
        content,
        aiGenerated: true,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!newMessage.length) {
      return null;
    }

    return newMessage[0];
  };

  UNSAFE_editMessageInTopic = async (
    topicId: number,
    messageId: number,
    content: string
  ) => {
    const result = await this.db
      .update(message)
      .set({ content })
      .where(and(eq(message.id, messageId), eq(message.topicId, topicId)))
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  UNSAFE_getMessageInTopic = async (topicId: number, messageId: number) => {
    const result = await this.db
      .select()
      .from(message)
      .where(and(eq(message.id, messageId), eq(message.topicId, topicId)))
      .limit(1);

    if (!result.length) {
      return null;
    }

    return result[0];
  };

  UNSAFE_deleteMessageInTopic = async (topicId: number, messageId: number) => {
    const result = await this.db
      .delete(message)
      .where(and(eq(message.id, messageId), eq(message.topicId, topicId)))
      .returning();

    if (!result.length) {
      return null;
    }

    return result[0];
  };
}
