import type { Schema } from "database";
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

type PartyResponses =
  | InitResponse
  | SetMessagesResponse
  | UserJoinedResponse
  | UserLeftResponse;

const party = createPartyRpc<PartyResponses, ClientContext>();

export const partyEvents = party.events({
  addMessage: {
    schema: v.object({
      content: v.string(),
      authorId: v.string(),
    }),
    async onMessage(message, _, room, ctx) {
      const newMessage = await ctx.Queries.Topic.addMessageToTopic(
        ctx.topicId,
        message.authorId,
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
});

export type SafePartyEvents = typeof partyEvents.events;
export type SafePartyResponses = typeof partyEvents.responses;
