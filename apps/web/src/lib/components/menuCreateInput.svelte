<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { clickOutside, escape } from '$lib/directives';
  import { Loader2, PlusCircle } from 'lucide-svelte';

  export let action: string;
  export let inputName = 'name';
  export let placeholder: string | undefined = undefined;

  let open = false;
  let loading = false;

  function close() {
    open = false;
  }
</script>

{#if open}
  <form
    method="post"
    {action}
    class="flex justify-between"
    use:enhance={() => {
      loading = true;
      return async ({ result, update }) => {
        loading = false;
        await update();
        await applyAction(result);
        close();
      };
    }}
    use:clickOutside
    on:app:click_outside={close}
    use:escape
    on:app:escape={close}
  >
    <!-- svelte-ignore a11y-autofocus -->
    <input disabled={loading} autofocus name={inputName} {placeholder} required />
    {#if !loading}
      <button disabled={loading} class="btn btn-circle btn-xs" type="submit">
        <PlusCircle size={16} />
      </button>
    {:else}
      <Loader2 size={16} class="animate-spin" />
    {/if}
    <slot name="open" />
  </form>
{:else}
  <button class="text-sm font-light" on:click={() => (open = true)}><slot name="button" /></button>
  <slot name="closed" />
{/if}
