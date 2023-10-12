<script>
  import { page } from '$app/stores';
  import Chat from './chat.svelte';
  export let data;
  export let form;
</script>

<!-- TEMPORARY STOPGAP -->
<!-- This will force remount on url change until I move socket logic into reactive store -->
{#key $page.url.pathname}
  <Chat {data} {form} />
{/key}
