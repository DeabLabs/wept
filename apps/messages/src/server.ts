/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as Party from 'partykit/server';
import { Queries as QueryClient } from 'database';
import { Pool } from '@neondatabase/serverless';
import { getServerlessDb } from 'database/drizzle';
import { partyEvents } from 'mclient';
import type { ClientContext } from 'mclient';
import { lucia, type Auth } from 'lucia';
import { generateRandomString } from 'lucia/utils';
import { pg } from '@lucia-auth/adapter-postgresql';
import { web } from 'lucia/middleware';
import invariant from 'tiny-invariant';
import { object, parse, string } from 'valibot';

export default class Server implements Party.Server {
  context: ClientContext;
  agent: Party.Stub | undefined;
  auth: Auth;
  db: ReturnType<typeof getServerlessDb>;
  headers: Record<string, string> = {};

  constructor(readonly party: Party.Party) {
    const [projectId, topicId] = party.id.split('-');

    const { db, client, Queries } = Server.getNewDbClient(party.env.DATABASE_URL as string);
    this.db = db;

    const env = party.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';

    this.auth = lucia({
      middleware: web(),
      env,
      adapter: pg(client, {
        user: 'User',
        key: 'Key',
        session: 'Session'
      })
    });

    this.context = {
      users: new Set<string>(),
      messages: undefined,
      topicId: Number(topicId),
      projectId: Number(projectId),
      Queries,
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

  static getNewDbClient(connectionString: string) {
    const client = new Pool({
      connectionString
    });
    const db = getServerlessDb(client);
    const Queries = new QueryClient(db);

    return {
      client,
      db,
      Queries
    };
  }

  async onRequest(req: Party.Request) {
    // user must make a post request here, as a validated lucia user
    // the body should contain {userId: string}
    // once validated, we will create a unique token id for the user and store it under their id
    // we will then return the token id to the user
    try {
      invariant(req.method.toLocaleLowerCase() === 'post', 'must be a post request');
      const body = await req.json();
      const { userId } = parse(object({ userId: string() }), body);

      // validate user based on bearer token
      const valid = await this.auth.validateSession(
        req.headers.get('Authorization')?.split(' ')[1] as string
      );

      if (!valid) {
        console.log(req.headers.get('Authorization'));
        console.log("user's bearer token is invalid");
        return new Response('Unauthorized', {
          status: 401
        });
      }

      // create token
      const token = generateRandomString(16);

      // store token
      await this.party.storage.put(userId, token);

      // return token
      return new Response(JSON.stringify({ token }), {
        status: 200
      });
    } catch {
      return new Response('Bad Request', {
        status: 400
      });
    }
  }

  static async onBeforeConnect(req: Party.Request, lobby: Party.Lobby) {
    if (!req.url.startsWith('ws')) return req;

    // if key in url === key in storage, assume agent
    // and let them in
    const keyInUrl = new URL(req.url).searchParams.get('token');

    if (!keyInUrl) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { Queries } = Server.getNewDbClient(lobby.env.DATABASE_URL as string);
    const agentKey = `agent-${lobby.id}`;
    const valid = await Queries.TemporaryTokens.validateAndConsumeToken(agentKey, keyInUrl);

    if (valid) {
      console.log('AGENT VALID');
      return req;
    }

    // otherwise, assume user and validate key as bearer token
    const userInUrl = new URL(req.url).searchParams.get('user_id');
    if (!userInUrl) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userValid = await Queries.TemporaryTokens.validateAndConsumeToken(userInUrl, keyInUrl);

    if (!userValid) {
      return new Response('Unauthorized', { status: 401 });
    }

    return req;
  }

  async ensureAgentConnected() {
    if (this.context.users.size >= 1 && !this.agent) {
      console.log('agent not connected, connecting');
      this.agent = this.party.context.parties.agent.get(this.party.id);
      const agentKey = `agent-${this.party.id}`;
      const result = await this.context.Queries.TemporaryTokens.createToken(
        agentKey,
        generateRandomString(16)
      );
      if (!result) {
        console.log('failed to create agent token');
        console.log('agent failed to connect');
        this.agent = undefined;
        return;
      }
      const response = await this.agent.fetch({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.party.env.PARTY_SHARED_SECRET}`
        },
        body: JSON.stringify({
          action: 'connect',
          id: this.party.id,
          topicId: this.context.topicId,
          projectId: this.context.projectId,
          host: this.party.env.PARTY_HOST,
          token: result.value
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
