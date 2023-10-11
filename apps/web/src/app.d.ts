// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      auth: import('lucia').AuthRequest;
    }
    // interface PageData {}
    // interface Platform {}
  }

  declare namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:app:click_outside'?: CompositionEventHandler<T>;
      'on:app:escape'?: CompositionEventHandler<T>;
    }
  }

  namespace Lucia {
    type Auth = import('$lib/server/lucia').Auth;
    type DatabaseUserAttributes = {
      email?: string | null;
      avatar?: string | null;
      username: string;
    };
    type DatabaseSessionAttributes = Record<string, never>;
  }
}

export {};
