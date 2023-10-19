<script lang="ts">
  import clsx from 'clsx';
  export let value = '';
  export let minRows = 1;
  export let maxRows: number | undefined = undefined;
  export let className: string | undefined = undefined;
  export let keydown: (event: KeyboardEvent) => void = () => {};

  $: minHeight = `${1 + minRows * 1.2}rem`;
  $: maxHeight = maxRows ? `${1 + maxRows * 1.2}rem` : `auto`;
</script>

<div class={clsx('container', className)}>
  <pre aria-hidden="true" style="min-height: {minHeight}; max-height: {maxHeight}">{value +
      '\n'}</pre>

  <textarea bind:value on:keydown={keydown} {...$$restProps} />
</div>

<style>
  .container {
    position: relative;
    width: 100%;
  }

  pre,
  textarea {
    font-family: inherit;
    padding: 0.5em;
    box-sizing: border-box;
    line-height: 1.2;
    overflow: hidden;
    width: 100%;
  }

  textarea {
    position: absolute;
    height: 100%;
    top: 0;
    resize: none;
  }
</style>
