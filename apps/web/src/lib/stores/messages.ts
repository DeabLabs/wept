import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Schema } from 'database';
import type { PartySocketOptions } from 'partysocket';
import type { SafePartyEvents, SafePartyResponses } from 'mclient';
import PartySocket from 'partysocket';
import { createPartyClient } from 'partyrpc';
import invariant from 'tiny-invariant';
import throttle from 'just-throttle';
import { object, optional, parse, string } from 'valibot';

type OptimisticMessage = {
  content: string;
  authorId: string;
};

type MessagesState = {
  messages: (OptimisticMessage | Schema.Message)[];
  activeUserIds: Set<string>;
  error?: string;
};

type CreateMessagesStoreArgs = {
  partyOptions: PartySocketOptions;
  projectId: string;
  topicId: string;
  callbacks?: Partial<Record<SafePartyResponses['type'], () => void>>;
};

const initialState: MessagesState = {
  messages: [],
  activeUserIds: new Set<string>()
};

export function createMessagesStore({
  partyOptions,
  projectId,
  topicId,
  callbacks
}: CreateMessagesStoreArgs) {
  let socket: PartySocket | undefined;
  let client: ReturnType<typeof createPartyClient<SafePartyEvents, SafePartyResponses>>;

  const { subscribe } = readable({ ...initialState }, (set, update) => {
    if (!partyOptions || !browser) return;

    new Promise((resolve) => {
      const go = async () => {
        const authResponse = await fetch(`/api/party-auth`, {
          method: 'POST',
          body: JSON.stringify({
            projectId,
            topicId
          })
        });

        const body = await authResponse.json();
        console.log(body);
        const response = parse(
          object({
            token: optional(string()),
            error: optional(string())
          }),
          body
        );

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.token) {
          throw new Error('No token');
        }

        socket = new PartySocket({
          ...partyOptions,
          query: { ...partyOptions.query, token: response.token, user_id: partyOptions.id }
        });
        client = createPartyClient<SafePartyEvents, SafePartyResponses>(socket);
        invariant(socket, 'socket should be defined');
        invariant(client, 'client should be defined');

        client.on('Init', (e) => {
          const newState = {
            messages: e.messages,
            activeUserIds: new Set(e.userIds)
          };
          set(newState);
          callbacks?.Init?.();
        });

        client.on('SetMessages', (e) => {
          update((state) => {
            const newState = {
              ...state,
              messages: e.messages
            };
            return newState;
          });
          callbacks?.SetMessages?.();
        });

        const updateMessages = throttle(
          (newMessage: Schema.Message) => {
            update((state) => {
              const newState = {
                ...state,
                messages: state.messages.map((message) => {
                  if ('id' in message && message.id === newMessage.id) {
                    return newMessage;
                  }
                  return message;
                })
              };
              return newState;
            });
            callbacks?.MessageEdited?.();
          },
          16,
          { trailing: true, leading: true }
        );

        client.on('MessageEdited', (e) => {
          updateMessages(e.message);
        });

        client.on('UserJoined', (e) => {
          update((state) => {
            const newState = {
              ...state,
              activeUserIds: new Set([...state.activeUserIds, e.userId])
            };
            return newState;
          });
          callbacks?.UserJoined?.();
        });

        client.on('UserLeft', (e) => {
          update((state) => {
            const newState = {
              ...state,
              activeUserIds: new Set([...state.activeUserIds].filter((id) => id !== e.userId))
            };
            return newState;
          });
          callbacks?.UserLeft?.();
        });
      };

      go().then(resolve);
    }).catch(() => {
      update((v) => ({ ...v, error: 'Could not connect to chat server.' }));
    });

    return () => socket?.close();
  });

  return {
    subscribe,
    addMessage: (message: OptimisticMessage) => {
      invariant(client, 'client should be defined');
      client.send({ type: 'addMessage', ...message });
    }
  };
}
