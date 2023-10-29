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
  const state: {
    socket: PartySocket | undefined;
    client: ReturnType<typeof createPartyClient<SafePartyEvents, SafePartyResponses>> | undefined;
    abort?: AbortController;
  } = {
    socket: undefined,
    client: undefined
  };

  const { subscribe } = readable({ ...initialState }, (set, update) => {
    if (!partyOptions || !browser) return;
    try {
      const abort = new AbortController();
      state.abort = abort; // set the abort controller on the state object
      // ensure that the cleanup function always has access to the abort controller
      state.abort?.signal.addEventListener('abort', () => {
        state.socket?.close();
        state.client?.unsubscribe();
      });
      fetch(`/api/party-auth`, {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          topicId
        }),
        signal: abort.signal
      })
        .then(async (authResponse) => {
          if (!authResponse.ok) {
            throw new Error('Failed to authenticate');
          }

          const body = await authResponse.json();
          const response = parse(
            object({
              key: optional(string()),
              token: optional(string()),
              error: optional(string())
            }),
            body
          );

          console.log('response', response);

          if (response.error) {
            throw new Error(response.error);
          }

          if (!response.token || !response.key) {
            throw new Error('No token');
          }

          state.socket = new PartySocket({
            ...partyOptions,
            query: { ...partyOptions.query, token: response.token, key: response.key }
          });
          state.client = createPartyClient<SafePartyEvents, SafePartyResponses>(state.socket);
          invariant(state.socket, 'socket should be defined');
          invariant(state.client, 'client should be defined');

          state.client.on('Init', (e) => {
            const newState = {
              messages: e.messages,
              activeUserIds: new Set(e.userIds)
            };
            set(newState);
            callbacks?.Init?.();
          });

          state.client.on('SetMessages', (e) => {
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

          state.client.on('MessageEdited', (e) => {
            updateMessages(e.message);
          });

          state.client.on('UserJoined', (e) => {
            update((state) => {
              const newState = {
                ...state,
                activeUserIds: new Set([...state.activeUserIds, e.userId])
              };
              return newState;
            });
            callbacks?.UserJoined?.();
          });

          state.client.on('UserLeft', (e) => {
            update((state) => {
              const newState = {
                ...state,
                activeUserIds: new Set([...state.activeUserIds].filter((id) => id !== e.userId))
              };
              return newState;
            });
            callbacks?.UserLeft?.();
          });
        })
        .catch(() => {
          // noop
          // the user rejected the request by switching pages
        });
    } catch (e) {
      update((v) => ({ ...v, error: 'Could not connect to server' }));
    }

    return () => {
      // cleanup
      state.abort?.abort();
    };
  });

  return {
    subscribe,
    addMessage: (message: OptimisticMessage) => {
      invariant(state.client, 'client should be defined');
      state.client.send({ type: 'addMessage', ...message });
    }
  };
}
