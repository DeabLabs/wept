<script lang="ts">
  import PlaceholderUser from '$lib/components/icons/placeholderUser.svelte';
  import clsx from 'clsx';
  import { fly } from 'svelte/transition';

  export let animate = false;
  export let avatar: string | null | undefined = undefined;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let tooltip: string | undefined = undefined;

  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };
</script>

<div
  class={clsx('avatar', tooltip && 'tooltip')}
  data-tip={tooltip}
  in:fly={{
    y: 100,
    duration: animate ? 200 : 0,
    delay: 100
  }}
  out:fly={{
    y: -100,
    duration: animate ? 200 : 0,
    delay: 100
  }}
>
  <div class={clsx('rounded-full', sizeMap[size])}>
    {#if avatar}
      <img src={avatar} alt="your profile" />
    {:else}
      <PlaceholderUser className={sizeMap[size]} />
    {/if}
  </div>
</div>
