import type { Action } from 'svelte/action';

export const clickOutside: Action = (node) => {
  const handleClick = (event: MouseEvent) => {
    if (node && !node.contains(event.target as Node | null) && !event.defaultPrevented) {
      node.dispatchEvent(
        new CustomEvent(
          'app:click_outside',
          // @ts-expect-error bad types
          node
        )
      );
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
};

export const escape: Action = (node) => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      node.dispatchEvent(
        new CustomEvent(
          'app:escape',
          // @ts-expect-error bad types
          node
        )
      );
    }
  };

  document.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      document.removeEventListener('keydown', handleKeydown);
    }
  };
};
