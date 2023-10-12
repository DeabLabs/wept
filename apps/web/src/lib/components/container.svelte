<script lang="ts">
  import clsx from 'clsx';
  export let className: string | undefined = undefined;
  export let notProse = false;
</script>

<section class={clsx('px-4 sm:px-0 pt-4 sm:pt-0 w-full', !notProse && 'prose', className)}>
  <slot />
</section>
