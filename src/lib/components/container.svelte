<script lang="ts">
  import clsx from 'clsx';
  export let className: string | undefined = undefined;
</script>

<section class={clsx('px-4 sm:px-0 pt-4 sm:pt-0 sm:ml-8 prose w-full', className)}>
  <slot />
</section>
