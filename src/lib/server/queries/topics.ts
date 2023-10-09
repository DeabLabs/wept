import { client } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';

export const getTopic = async (topicId: string, userId: string) => {
  const topic = await client.topic.findFirst({
    where: {
      id: topicId,
      users: {
        some: {
          user_id: userId
        }
      }
    },
    include: {
      messages: true
    }
  });

  const userCount = await client.usersInTopics.count({
    where: {
      topic_id: topicId
    }
  });

  return { ...topic, userCount };
};

export const createTopic = async (projectId: string, userId: string, name: string) => {
  const topic = await client.topic.create({
    data: {
      name,
      project: {
        connect: {
          id: projectId
        }
      },
      users: {
        create: {
          user_id: userId,
          admin: true
        }
      }
    }
  });
  return topic;
};

export const updateTopic = async (
  topicId: string,
  userId: string,
  args: Pick<Prisma.TopicUpdateInput, 'name' | 'context' | 'description'>
) => {
  // only admin of topic can update topic
  const topic = await client.topic.findFirst({
    where: {
      id: topicId,
      users: {
        some: {
          user_id: userId,
          admin: true
        }
      }
    }
  });

  if (!topic) {
    return null;
  }

  const updatedTopic = await client.topic.update({
    where: {
      id: topicId
    },
    data: args
  });

  return updatedTopic;
};

export const deleteTopic = async (topicId: string, userId: string) => {
  // user must be an admin to delete a topic
  const topic = await client.topic.findFirst({
    where: {
      id: topicId,
      users: {
        some: {
          user_id: userId,
          admin: true
        }
      }
    }
  });

  if (!topic) {
    return null;
  }

  const deletedTopic = await client.topic.delete({
    where: {
      id: topicId
    }
  });

  return deletedTopic;
};

export const addMessageToTopic = async (topicId: string, userId: string, message: string) => {
  const topic = await client.topic.findFirst({
    where: {
      id: topicId,
      users: {
        some: {
          user_id: userId
        }
      }
    }
  });

  if (!topic) {
    return null;
  }

  const createdMessage = await client.message.create({
    data: {
      content: message,
      topic: {
        connect: {
          id: topicId
        }
      },
      author: {
        connect: {
          id: userId
        }
      }
    }
  });

  return createdMessage;
};
