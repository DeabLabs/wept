<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import Container from '$lib/components/container.svelte';
  import { Cross, Trash, X } from 'lucide-svelte';

  export let data;
  export let form;
</script>

<Container>
  <h1 class="flex justify-between">
    <span>Project Settings</span>
    <button class="btn btn-square hover:btn-error focus-visible:btn-error transition-colors"
      ><Trash /></button
    >
  </h1>
  <h2>{data.project.name}</h2>

  <form
    method="post"
    action="?/update"
    use:enhance={() =>
      async ({ update }) => {
        await update({ reset: false });
      }}
  >
    <fieldset class="flex flex-col w-full gap-2">
      <div class="form-control w-full max-w-xs">
        <label class="label" for="name">
          <span class="label-text">Name</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="My Awesome Project"
          class="input input-bordered w-full max-w-xs"
          value={data.project.name}
        />
      </div>
      <div class="form-control">
        <label class="label" for="context">
          <span class="label-text">Context</span>
        </label>
        <textarea
          name="context"
          class="textarea textarea-bordered h-24"
          placeholder="This project is about..."
          value={data.project.context}
        />
        <label class="label" for="context">
          <span class="label-text"
            >Project Context is the system message that wept AI will use when responding to messages
            in all of this project's topics.</span
          >
        </label>
      </div>
      <button class="btn btn-primary mt-24 flex self-end">Save</button>
    </fieldset>
  </form>
</Container>

<!-- @TODO refactor this into component -->
{#if form}
  <div class="toast toast-end">
    {#if form.updateProject.success}
      <div class="alert alert-success">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-primary"
        >
          <X size={16} />
        </button>
        <span>"{data.project.name}" updated successfully.</span>
      </div>
    {:else if !form.updateProject.success}
      <div class="alert alert-error">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-primary"
        >
          <X size={16} />
        </button>
        <span>Could not update project.</span>
      </div>
    {/if}
  </div>
{/if}
