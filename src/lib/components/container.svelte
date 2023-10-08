<script lang="ts">
  import clsx from 'clsx';
  export let className: string | undefined = undefined;
</script>

<section class={clsx('sm:ml-8 prose w-full', className)}>
  <slot />
</section>
