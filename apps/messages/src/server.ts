/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as Party from 'partykit/server';
import { Queries as QueryClient } from 'database';
import { Pool } from '@neondatabase/serverless';
import { getServerlessDb } from 'database/drizzle';
import { partyEvents } from 'mclient';
import type { ClientContext } from 'mclient';

export default class Server implements Party.Server {
  context: ClientContext;

  constructor(readonly party: Party.Party) {
    const [projectId, topicId] = party.id.split('/');

    const client = new Pool({
      connectionString: party.env.DATABASE_URL as string
    });

    const db = getServerlessDb(client);

    this.context = {
      users: new Set<string>(),
      messages: undefined,
      topicId: Number(topicId),
      projectId: Number(projectId),
      Queries: new QueryClient(db),
      async ensureLatestMessages() {
        if (!this.messages) {
          console.log("messages don't exist, fetching them");
          this.messages = await this.Queries.Topic.UNSAFE_getMessagesInTopic(this.topicId, 'asc');
          console.log('messages fetched');
        }

        return this.messages;
      }
    };
  }

  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    console.log('disconnecting user', connection.id);
    this.context.users.delete(connection.id);
    partyEvents.broadcast(this.party, { type: 'UserLeft', userId: connection.id });

    if (this.context.users.size === 0) {
      console.log('no users left, clearing messages');
      this.context.messages = undefined;
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log('connecting user', conn.id);
    this.context.users.add(conn.id);
    const messages = await this.context.ensureLatestMessages();

    partyEvents.broadcast(this.party, { type: 'UserJoined', userId: conn.id });
    partyEvents.send(conn, { type: 'Init', messages, userIds: Array.from(this.context.users) });

    conn.addEventListener('message', async (event) => {
      partyEvents.onMessage(event.data, conn, this.party, this.context);
    });
  }
}

Server satisfies Party.Worker;
