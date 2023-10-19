/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as Party from 'partykit/server';
import { Queries as QueryClient } from 'database';
import { Pool } from '@neondatabase/serverless';
import { getServerlessDb } from 'database/drizzle';
import { partyEvents } from 'mclient';
import type { ClientContext } from 'mclient';

export default class Server implements Party.Server {
  context: ClientContext;
  agent: Party.Stub | undefined;

  constructor(readonly party: Party.Party) {
    const [projectId, topicId] = party.id.split('-');

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

  async ensureAgentConnected() {
    if (this.context.users.size >= 1 && !this.agent) {
      console.log('agent not connected, connecting');
      this.agent = this.party.context.parties.agent.get(this.party.id);
      const response = await this.agent.fetch({
        method: 'POST',
        body: JSON.stringify({
          action: 'connect',
          id: this.party.id,
          topicId: this.context.topicId,
          projectId: this.context.projectId
        })
      });
      const body = await response.json();
      if (body?.success) {
        console.log('agent connected');
      } else {
        console.log('agent failed to connect');
        this.agent = undefined;
      }
    }
  }

  async disconnectAgent() {
    if (this.agent) {
      console.log('agent connected, disconnecting');
      await this.agent.fetch({
        method: 'POST',
        body: JSON.stringify({
          action: 'disconnect',
          id: this.party.id
        })
      });
      this.agent = undefined;
      console.log('agent disconnected');
    }
  }

  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    console.log('disconnecting user', connection.id);
    this.context.users.delete(connection.id);
    partyEvents.broadcast(this.party, { type: 'UserLeft', userId: connection.id });

    if (this.context.users.size === 0) {
      console.log('no users left, clearing messages');
      this.context.messages = undefined;
      this.disconnectAgent();
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log('connecting user', conn.id);
    if (conn.id !== 'AGENT') {
      this.context.users.add(conn.id);
      const messages = await this.context.ensureLatestMessages();

      partyEvents.broadcast(this.party, { type: 'UserJoined', userId: conn.id });
      partyEvents.send(conn, { type: 'Init', messages, userIds: Array.from(this.context.users) });

      await this.ensureAgentConnected();
    }

    conn.addEventListener('message', async (event) => {
      partyEvents.onMessage(event.data, conn, this.party, this.context);
    });
  }
}

Server satisfies Party.Worker;
