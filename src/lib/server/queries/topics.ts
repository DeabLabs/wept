import { db } from '$lib/server/drizzle';
import { and, eq, sql } from 'drizzle-orm';
import { message, topic, usersInProjects, usersInTopics } from '../../../../drizzle/schema';

type Topic = typeof topic.$inferSelect;

export const getTopic = async (topicId: number, userId: string) => {
  // get a topic if the user is a member of the topic
  const result = await db
    .select()
    .from(usersInTopics)
    .innerJoin(topic, eq(usersInTopics.topicId, topic.id))
    .where(and(eq(usersInTopics.userId, userId), eq(usersInTopics.topicId, topicId)))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersInTopics)
    .where(eq(usersInTopics.topicId, topicId));

  if (!userCount.length) {
    return null;
  }

  return { ...result[0].Topic, userCount: Number(userCount[0].count) };
};

export const createTopic = async (projectId: number, userId: string, name: string) => {
  // a user can create a topic within a project, only if they are an admin of the project
  const result = await db
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

  return db.transaction(async (tx) => {
    const newTopic = await tx
      .insert(topic)
      .values({
        name,
        projectId,
        updatedAt: new Date().toISOString()
      })
      .returning();

    if (!newTopic.length) {
      tx.rollback();
      return null;
    }

    await tx.insert(usersInTopics).values({
      userId,
      topicId: newTopic[0].id,
      admin: true,
      updatedAt: new Date().toISOString()
    });

    return newTopic[0];
  });
};

export const updateTopic = async (
  topicId: number,
  userId: string,
  args: Pick<Partial<Topic>, 'name' | 'context' | 'description'>
) => {
  // only admin of topic can update topic
  const isAdmin = await db
    .select()
    .from(usersInTopics)
    .where(and(eq(usersInTopics.topicId, topicId), eq(usersInTopics.userId, userId)));

  if (!isAdmin.length || !isAdmin[0].admin) {
    return null;
  }

  const result = await db
    .update(topic)
    .set(args)
    .where(and(eq(topic.id, topicId)))
    .returning();

  if (!result.length) {
    return null;
  }

  return result[0];
};

export const deleteTopic = async (topicId: number, userId: string) => {
  // user must be an admin to delete a topic
  // when a topic is deleted, it should cascade and delete all messages and usersInTopics

  const isAdmin = await db
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

  return await db
    .delete(topic)
    .where(and(eq(topic.id, topicId)))
    .returning();
};

export const addMessageToTopic = async (topicId: number, userId: string, content: string) => {
  // a user can add a message to a topic if they are a member of the topic

  const result = await db
    .select()
    .from(usersInTopics)
    .where(and(eq(usersInTopics.topicId, topicId), eq(usersInTopics.userId, userId)))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const newMessage = await db
    .insert(message)
    .values({
      topicId,
      authorId: userId,
      content,
      updatedAt: new Date().toISOString()
    })
    .returning();

  if (!newMessage.length) {
    return null;
  }

  return newMessage[0];
};
