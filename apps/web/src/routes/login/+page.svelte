<script lang="ts">
  export let data;

  const availableAuth = data.availableAuthProviders;
</script>

<section
  class="prose max-w-full h-screen w-screen absolute top-0 left-0 flex flex-col gap-4 justify-center items-center"
>
  <h1>wept</h1>
  <ul class="not-prose menu rounded-box bg-base-200 w-56">
    <li class="menu-title">Sign In</li>
    {#each Object.keys(availableAuth) as auth}
      <li class="">
        <a href={`/login/${auth}`}>Sign in with {auth}</a>
      </li>
    {/each}
  </ul>
</section>
