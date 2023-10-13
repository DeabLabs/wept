<script lang="ts">
  import clsx from 'clsx';
  export let className: string | undefined = undefined;
  export let notProse = false;
</script>

<section class={clsx('px-4 pt-4 w-full', !notProse && 'prose', className)}>
  <slot />
</section>
