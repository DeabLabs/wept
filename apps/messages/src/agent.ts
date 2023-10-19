import type { SafePartyEvents, SafePartyResponses } from 'mclient';
import type * as Party from 'partykit/server';
import { createPartyClient } from 'partyrpc';
import * as valibot from 'valibot';
import PartySocket from 'partysocket';
import type { Schema } from 'database';
import { Queries as QueryClient, Dates } from 'database';
import { OpenAI } from 'openai';
import type { SDbType } from 'database/queries';
import { Pool } from '@neondatabase/serverless';
import { getServerlessDb } from 'database/drizzle';
import invariant from 'tiny-invariant';
import type { ChatCompletionMessageParam } from 'openai/resources';

const connectionRequestBodySchema = valibot.object({
  /** The connect action */
  action: valibot.literal('connect'),
  /** The room id to connect to */
  id: valibot.string(),
  /** The topic that the room represents */
  topicId: valibot.number(),
  /** The project that the room represents */
  projectId: valibot.number(),
  /** temporary */
  host: valibot.string()
});

const disconnectionRequestBodySchema = valibot.object({
  /** The disconnect action */
  action: valibot.literal('disconnect')
});

const requests = valibot.union([connectionRequestBodySchema, disconnectionRequestBodySchema]);

export default class Agent implements Party.Server {
  id = 'AGENT';
  connected = false;
  topicId: number | undefined;
  projectId: number | undefined;
  messages: Schema.Message[] = [];
  responding = false;
  client: ReturnType<typeof createPartyClient<SafePartyEvents, SafePartyResponses>> | undefined;
  token: string | undefined;
  chatContext:
    | { topicSystemMessage?: string; projectSystemMessage?: string; openaiKey: string }
    | undefined;
  queryClient: QueryClient<SDbType>;
  openai: OpenAI | undefined;

  constructor(readonly party: Party.Party) {
    const client = new Pool({
      connectionString: party.env.DATABASE_URL as string
    });
    const db = getServerlessDb(client);
    this.queryClient = new QueryClient(db);
  }

  async onRequest(req: Party.Request) {
    try {
      if (req.method === 'POST') {
        const body = await req.json();
        const result = valibot.safeParse(requests, body);

        if (result.success) {
          switch (result.output.action) {
            case 'connect': {
              const socket = new PartySocket({
                host: result.output.host,
                room: result.output.id,
                id: this.id
              });
              this.topicId = result.output.topicId;
              this.projectId = result.output.projectId;
              this.client = createPartyClient<SafePartyEvents, SafePartyResponses>(socket);
              this.setup();
              return new Response(JSON.stringify({ success: true }));
            }
            case 'disconnect': {
              this.client?.unsubscribe();
              this.client = undefined;
              this.topicId = undefined;
              this.projectId = undefined;
              return new Response(JSON.stringify({ success: true }));
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    return new Response(JSON.stringify({ success: false }));
  }

  async refresh() {
    if (!this.topicId || !this.projectId) return;

    const projectKey = await this.queryClient.Project.UNSAFE_getDonatedProjectKey(this.projectId);

    if (!projectKey) {
      this.chatContext = undefined;
      throw new Error("Project doesn't have a key");
    }

    const project = await this.queryClient.Project.UNSAFE_getProject(this.projectId);

    if (!project) {
      this.chatContext = undefined;
      throw new Error("Project doesn't exist");
    }

    const topic = await this.queryClient.Topic.UNSAFE_getTopic(this.topicId);

    if (!topic) {
      this.chatContext = undefined;
      throw new Error("Topic doesn't exist");
    }

    const topicSystemMessage = topic.context ?? undefined;
    const projectSystemMessage = project.context ?? undefined;

    this.chatContext = {
      topicSystemMessage,
      projectSystemMessage,
      openaiKey: projectKey
    };

    this.openai = new OpenAI({ apiKey: projectKey });
  }

  setup() {
    if (!this.client || this.topicId === undefined || this.projectId === undefined) return;

    this.client.on('Init', (e) => {
      this.messages = e.messages;
    });

    this.client.on('SetMessages', (e) => {
      this.messages = e.messages;
      this.respond();
    });

    this.client.on('MessageEdited', (e) => {
      this.messages = this.messages.map((m) => (m.id === e.message.id ? e.message : m));
    });
  }

  async respond() {
    if (this.responding || this.topicId === undefined) return;
    this.responding = true;
    let newMessageId: number | undefined;

    try {
      if (!this.chatContext || !this.openai) {
        console.log('No context loaded, refreshing context');
        await this.refresh();
      }

      const systemMessages: ChatCompletionMessageParam[] = [
        this.chatContext?.projectSystemMessage,
        this.chatContext?.topicSystemMessage
      ]
        .filter((m) => m)
        .map((m) => ({
          content: m ?? '',
          role: 'system'
        }));
      const messages: ChatCompletionMessageParam[] = [...this.messages].map((m) => ({
        content: m.content,
        role: m.authorId === this.id ? 'assistant' : 'user'
      }));

      const newMessagePlaceholder = await this.queryClient.Topic.addAIMessageToTopic(
        this.topicId,
        ''
      );

      if (!newMessagePlaceholder) {
        throw new Error('Failed to add message placeholder');
      }

      newMessageId = newMessagePlaceholder.id;

      this.client?.send({ type: 'provideMessage', id: newMessagePlaceholder.id });
      const openai = this.openai;
      invariant(openai);
      const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-16k',
        messages: [...systemMessages, ...messages],
        stream: true
      });

      let text = '';
      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content;
        if (delta) {
          text = `${text}${delta}`;
          this.client?.send({
            type: 'editMessage',
            messageId: newMessagePlaceholder.id,
            content: text,
            updatedAt: Dates.getCurrentDateInUTC()
          });
        } else {
          this.responding = false;
        }
      }
    } catch (e) {
      console.error('Failed to respond', e);

      if (newMessageId !== undefined) {
        this.queryClient.Topic.UNSAFE_deleteMessageInTopic(this.topicId, newMessageId);
      }

      this.responding = false;
    }
  }
}
