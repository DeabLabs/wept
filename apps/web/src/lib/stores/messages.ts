import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Schema } from 'database';
import type { PartySocketOptions } from 'partysocket';
import type { SafePartyEvents, SafePartyResponses } from 'mclient';
import PartySocket from 'partysocket';
import { createPartyClient } from 'partyrpc';
import invariant from 'tiny-invariant';

type OptimisticMessage = {
  content: string;
  authorId: string;
};

type MessagesState = {
  messages: (OptimisticMessage | Schema.Message)[];
  activeUserIds: Set<string>;
};

type CreateMessagesStoreArgs = {
  partyOptions: PartySocketOptions;
  callbacks?: Partial<Record<SafePartyResponses['type'], () => void>>;
};

const initialState: MessagesState = {
  messages: [],
  activeUserIds: new Set<string>()
};

export function createMessagesStore({ partyOptions, callbacks }: CreateMessagesStoreArgs) {
  let socket: PartySocket | undefined;
  let client: ReturnType<typeof createPartyClient<SafePartyEvents, SafePartyResponses>>;

  const { subscribe } = readable({ ...initialState }, (set, update) => {
    if (!partyOptions || !browser) return;

    socket = new PartySocket(partyOptions);
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

    client.on('MessageEdited', (e) => {
      update((state) => {
        const newState = {
          ...state,
          messages: state.messages.map((message) => {
            if ('id' in message && message.id === e.message.id) {
              return e.message;
            }
            return message;
          })
        };
        return newState;
      });
      callbacks?.MessageEdited?.();
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
