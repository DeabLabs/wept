<script lang="ts">
  import { enhance } from '$app/forms';
  import Container from '$lib/components/container.svelte';
  import { X } from 'lucide-svelte';

  export let data;
  export let form;

  $: ({ user, openai } = data);
</script>

<Container className="flex flex-col gap-8">
  <h1>Profile</h1>
  <form
    method="post"
    action="?/update"
    use:enhance={() =>
      async ({ update }) => {
        await update({ reset: false });
      }}
  >
    <fieldset class="flex flex-col w-full gap-2">
      <div class="form-control w-full max-w-sm">
        <label class="label" for="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          placeholder="Your username"
          class="input input-bordered w-full max-w-sm"
          value={user.username}
        />
        <label class="label-alt" for="username">Your id is: <code>{user.id}</code></label>
      </div>
      <div class="form-control w-full max-w-sm">
        <label class="label" for="openai">Openai Key</label>
        <input
          id="openai"
          name="openai"
          type="password"
          autocomplete="off"
          placeholder="sk-12345"
          class="input input-bordered w-full max-w-sm"
          value={openai}
        />
        <label class="label" for="openai">
          <span class="label-text"
            >Once set, you will be able to donate this key to a Project, enabling conversations with
            GPT for anyone, in any topic, in the project.</span
          >
        </label>
        <label class="label-alt" for="openai">
          <span class="label-text">WARNING: This is not yet encrypted in DB</span>
        </label>
      </div>
      <button class="btn btn-primary mb-4 sm:mb-0 sm:mt-24 flex self-end">Save</button>
    </fieldset>
  </form>
</Container>

{#if form}
  <div class="toast toast-end">
    {#if form?.update?.success}
      <div class="alert alert-success">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
        >
          <X size={16} />
        </button>
        <span>Profile updated successfully.</span>
      </div>
    {:else if form?.update?.success === false}
      <div class="alert alert-error">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
        >
          <X size={16} />
        </button>
        <span>Could not update profile.</span>
      </div>
    {/if}
  </div>
{/if}
