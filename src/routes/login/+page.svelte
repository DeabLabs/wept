<script lang="ts">
  export let data;

  const availableAuth = data.availableAuthProviders;
</script>

<h1>Sign in</h1>

<div>
  <ul class="flex flex-col gap-4 my-8">
    {#each Object.keys(availableAuth) as auth}
      <li>
        <a href={`/login/${auth}`} class="rounded p-2 bg-slate-500">Sign in with {auth}</a>
      </li>
    {/each}
  </ul>
</div>
