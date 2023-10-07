<script lang="ts">
  import clsx from 'clsx';

  export let drawerId: string;
  export let className: string | undefined = undefined;
</script>

<label for={drawerId} class={clsx('btn drawer-button lg:hidden', className)}><slot /></label>
