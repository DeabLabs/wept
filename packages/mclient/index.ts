import { Dates, type Schema } from "database";
import type { Queries as QueryClient, SDbType } from "database/queries";
import { createPartyRpc } from "partyrpc/src/server";
import * as v from "valibot";

export type ClientContext = {
  users: Set<string>;
  messages: Schema.Message[] | undefined;
  topicId: number;
  projectId: number;
  Queries: QueryClient<SDbType>;
  ensureLatestMessages: () => Promise<Schema.Message[]>;
};

type InitResponse = {
  type: "Init";
  messages: Schema.Message[];
  userIds: string[];
};
type SetMessagesResponse = { type: "SetMessages"; messages: Schema.Message[] };
type UserJoinedResponse = { type: "UserJoined"; userId: string };
type UserLeftResponse = { type: "UserLeft"; userId: string };
type MessageEditedResponse = { type: "MessageEdited"; message: Schema.Message };
type MessageDeletedResponse = { type: "MessageDeleted"; messageId: number };

type PartyResponses =
  | InitResponse
  | SetMessagesResponse
  | UserJoinedResponse
  | UserLeftResponse
  | MessageEditedResponse
  | MessageDeletedResponse;

const party = createPartyRpc<PartyResponses, ClientContext>();

export const partyEvents = party.events({
  addMessage: {
    schema: v.object({
      content: v.string(),
    }),
    async onMessage(message, conn, room, ctx) {
      const authorId = conn.id;
      const newMessage = await ctx.Queries.Topic.addMessageToTopic(
        ctx.topicId,
        authorId,
        message.content
      );

      if (!newMessage) {
        return;
      }

      ctx.messages?.push(newMessage);

      partyEvents.broadcast(room, {
        type: "SetMessages",
        messages: ctx.messages || [],
      });
    },
  },
  provideMessage: {
    schema: v.object({
      id: v.number(),
    }),
    async onMessage(message, _, room, ctx) {
      const providedMessage = await ctx.Queries.Topic.UNSAFE_getMessageInTopic(
        ctx.topicId,
        message.id
      );

      if (!providedMessage) {
        console.log("did not provide message");
        return;
      }

      // insert the message into the messages array, in order based on createdAt date
      const messages = ctx.messages || [];
      const index = messages.findIndex(
        (m) => m.createdAt > providedMessage.createdAt
      );
      if (index === -1) {
        messages.push(providedMessage);
      } else {
        messages.splice(index, 0, providedMessage);
      }

      ctx.messages = messages;

      partyEvents.broadcast(room, {
        type: "SetMessages",
        messages: ctx.messages || [],
      });
    },
  },
  editMessage: {
    schema: v.object({
      authorId: v.optional(v.string()),
      messageId: v.number(),
      content: v.string(),
      updatedAt: v.string("iso datetime required", [v.isoDateTime()]),
    }),
    async onMessage(newMessage, _, room, ctx) {
      const oldMessage = ctx.messages?.find(
        (m) => m.id === newMessage.messageId
      );

      if (!oldMessage) {
        console.log("cant edit missing message");
        return;
      }

      // if the message.updatedAt is older than the message we have, don't edit it
      if (
        oldMessage.updatedAt &&
        Dates.isBefore(newMessage.updatedAt, oldMessage.updatedAt)
      ) {
        console.log(
          `${newMessage.updatedAt} is older than ${oldMessage.updatedAt}`
        );
        console.log("message is older than the one we have");
        return;
      }

      const updatedMessage = await ctx.Queries.Topic.UNSAFE_editMessageInTopic(
        ctx.topicId,
        newMessage.messageId,
        newMessage.content,
        newMessage.updatedAt
      );

      if (!updatedMessage) {
        console.log("did not edit message");
        return;
      }

      ctx.messages = ctx.messages?.map((m) =>
        m.id === newMessage.messageId ? updatedMessage : m
      );

      partyEvents.broadcast(room, {
        type: "MessageEdited",
        message: updatedMessage,
      });
    },
  },
  deleteMessage: {
    schema: v.object({
      messageId: v.number(),
    }),
    async onMessage(message, conn, room, ctx) {
      const userId = conn.id;
      // users can only delete their own messages
      const deletedMessage = await ctx.Queries.Topic.deleteMessageInTopic(
        ctx.topicId,
        userId,
        message.messageId
      );

      if (!deletedMessage) {
        console.log("did not delete message");
        return;
      }

      ctx.messages = ctx.messages?.filter(
        (m) => m.id !== deletedMessage.id
      ) as Schema.Message[];

      partyEvents.broadcast(room, {
        type: "MessageDeleted",
        messageId: deletedMessage.id,
      });
    },
  },
});

export type SafePartyEvents = typeof partyEvents.events;
export type SafePartyResponses = typeof partyEvents.responses;
