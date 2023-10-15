<script lang="ts">
  import { enhance } from '$app/forms';
  import Container from '$lib/components/container.svelte';
  import { Trash, X } from 'lucide-svelte';

  export let data;
  export let form;
</script>

<Container>
  <h1 class="flex justify-between">
    <span>Topic Settings</span>
    <button
      on:click={() => {
        const modal = document.getElementById('delete-modal');
        if (modal instanceof HTMLDialogElement) {
          modal.showModal();
        }
      }}
      class="btn btn-square hover:btn-error focus-visible:btn-error transition-colors"
      ><Trash /></button
    >
  </h1>
  <h2 class="text-info">{data.topic.name}</h2>

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
        <label class="label" for="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="My Awesome Topic"
          class="input input-bordered w-full max-w-xs"
          value={data.topic.name}
        />
      </div>
      <div class="form-control">
        <label class="label" for="description">Description</label>
        <textarea
          id="description"
          name="description"
          class="textarea textarea-bordered h-24"
          placeholder="This topic is about..."
          value={data.topic.description}
        />
        <label class="label" for="description">
          <span class="label-text"
            >Describe this topic for yourself, and others, to keep on track.</span
          >
        </label>
      </div>
      <div class="form-control">
        <label class="label" for="context">Context</label>
        <textarea
          id="context"
          name="context"
          class="textarea textarea-bordered h-24"
          placeholder={`You are a helpful AI assistant. You can help with the topic "${data.topic.name}"...`}
          value={data.topic.context}
        />
        <label class="label" for="context">
          <span class="label-text"
            >Topic Context is the system message that wept AI will use when responding to messages
            in all this topic.</span
          >
        </label>
      </div>
      <div class="flex justify-between mb-4 sm:mb-0 sm:mt-24">
        <a href={data.chatUrl} class="btn btn-neutral">Return to Chat</a>
        <button class="btn btn-primary">Save</button>
      </div>
    </fieldset>
  </form>
</Container>

<dialog id="delete-modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Are you sure you want to delete this topic?</h3>
    <p class="py-4">
      This will delete the topic for all users. <br />
      <b class="font-extrabold">This action cannot be reversed.</b>
    </p>
    <form method="post" action="?/delete" use:enhance class="flex justify-end">
      <button class="btn btn-error">delete</button>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>cancel</button>
  </form>
</dialog>

<!-- @TODO refactor this into component -->
{#if form}
  <div class="toast toast-end">
    {#if form?.updateTopic?.success}
      <div class="alert alert-success">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
        >
          <X size={16} />
        </button>
        <span>"{data.topic.name}" updated successfully.</span>
      </div>
    {:else if form?.updateTopic?.success === false}
      <div class="alert alert-error">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
        >
          <X size={16} />
        </button>
        <span>Could not update topic.</span>
      </div>
    {/if}
  </div>
{/if}
