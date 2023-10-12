/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as Party from 'partykit/server';
import { Queries as QueryClient, type Schema } from 'database';
import { Pool } from '@neondatabase/serverless';
import { getServerlessDb } from 'database/drizzle';
import type { SDbType } from 'database/queries';

export default class Server implements Party.Server {
  users: string[] = [];
  messages: Schema.Message[] | undefined = undefined;
  topicId: number;
  projectId: number;
  db: SDbType;
  Queries: QueryClient<SDbType>;

  constructor(readonly party: Party.Party) {
    const [projectId, topicId] = party.id.split('/');
    this.topicId = Number(topicId);
    this.projectId = Number(projectId);

    const client = new Pool({
      connectionString: party.env.DATABASE_URL as string
    });
    this.db = getServerlessDb(client);
    this.Queries = new QueryClient(this.db);
  }

  async ensureLatestMessages() {
    if (!this.messages) {
      this.messages = await this.Queries.Topic.UNSAFE_getMessagesInTopic(this.topicId, 'asc');
    }

    return this.messages;
  }

  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    console.log('disconnecting user', connection.id);
    this.users = this.users.filter((u) => u !== connection.id);

    if (this.users.length === 0) {
      console.log('no users left, clearing messages');
      this.messages = undefined;
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log('connecting user', conn.id);
    this.users.push(conn.id);
    const messages = await this.ensureLatestMessages();

    conn.send(
      JSON.stringify({
        messages
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    const parsedMessage = JSON.parse(message) as { content: string; authorId: string };

    const newMessage = await this.Queries.Topic.addMessageToTopic(
      this.topicId,
      parsedMessage.authorId,
      parsedMessage.content
    );

    if (!newMessage) {
      return;
    }

    this.messages?.push(newMessage);

    // as well as broadcast it to all the other connections in the room...
    this.party.broadcast(JSON.stringify({ messages: this.messages }));
  }
}

Server satisfies Party.Worker;
