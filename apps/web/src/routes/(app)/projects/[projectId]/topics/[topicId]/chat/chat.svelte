<script lang="ts">
  import { enhance } from '$app/forms';
  import Avatar from '$lib/components/avatar.svelte';
  import AvatarGroup from '$lib/components/avatarGroup.svelte';
  import Container from '$lib/components/container.svelte';
  import type { Schema } from 'database';
  import { Info, Settings, X } from 'lucide-svelte';
  import PartySocket from 'partysocket';
  import { onDestroy } from 'svelte';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  const memberCountLabel = data.topic.members.length === 1 ? 'member' : 'members';

  $: memberMap = new Map(data.topic.members.map((member) => [member.id, member]));

  type OptimisticMessage = {
    content: string;
    authorId: string;
  };

  let messages: (Schema.Message | OptimisticMessage)[] = [];
  const socket = new PartySocket(data.partyOptions);

  onDestroy(() => {
    socket.close();
  });

  socket.onmessage = (event) => {
    const { messages: newMessages } = JSON.parse(event.data) as { messages: Schema.Message[] };
    messages = newMessages;
  };

  async function handleSubmit(event: { currentTarget: EventTarget & HTMLFormElement }) {
    const formData = new FormData(event.currentTarget);

    const optimisticMessage = {
      content: formData.get('content')?.toString() ?? '',
      authorId: data.partyOptions.id
    };

    messages.push(optimisticMessage);

    socket.send(JSON.stringify(optimisticMessage));

    event.currentTarget.reset();
  }
</script>

<Container
  className="not-prose flex flex-col justify-center items-center sm:ml-0 max-w-full w-full"
>
  <ul
    class="menu menu-horizontal rounded-box bg-base-200 justify-center items-center max-w-7xl w-full sm:w-auto"
  >
    <li>
      <button
        on:click={() => {
          const el = document.getElementById('info-modal');
          if (el instanceof HTMLDialogElement) {
            el.showModal();
          }
        }}><Info /><span class="text-lg font-bold text-info">{data.topic.name}</span></button
      >
    </li>
    <li class="hidden sm:flex">
      <button
        on:click={() => {
          const el = document.getElementById('members-modal');
          if (el instanceof HTMLDialogElement) {
            el.showModal();
          }
        }}
      >
        <AvatarGroup partialUsers={data.topic.members} />
      </button>
    </li>
    {#if data.topic.admin}
      <li class="hidden sm:flex"><a href={data.settingsLink}><Settings /></a></li>
    {/if}
  </ul>
  <ul class="w-full px-10 sm:px-40 py-10 flex flex-col gap-2">
    {#each messages as message}
      <li class="w-full flex gap-4 items-center">
        <Avatar
          size="sm"
          tooltip={memberMap.get(message.authorId)?.username}
          avatar={memberMap.get(message.authorId)?.avatar}
        />
        {message.content}
      </li>
    {/each}
  </ul>
  <form on:submit|preventDefault={handleSubmit}>
    <input type="text" name="content" />
    <button type="submit">Send</button>
  </form>
</Container>

<dialog id="info-modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg flex justify-between">
      <span class="text-xl text-info">{data.topic.name}</span><span
        >{data.topic.members.length} {memberCountLabel}</span
      >
    </h3>
    <ul class="sm:hidden flex gap-2 w-full justify-between items-center mt-1">
      <li>
        <span>
          <AvatarGroup partialUsers={data.topic.members} />
        </span>
      </li>
      <li><a href={data.settingsLink}><Settings /></a></li>
    </ul>
    <p class="py-4">
      {#if data.topic.description}
        {data.topic.description}
      {:else}
        <i>No description created for this topic.</i>
      {/if}
    </p>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

<dialog id="members-modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg flex justify-between">
      <span class="text-xl text-info">{data.topic.members.length} {memberCountLabel}</span>
    </h3>
    <ul class="flex flex-col gap-2 w-full mt-8">
      {#each data.topic.members as member}
        <li class="flex items-center gap-2">
          <Avatar avatar={member.avatar} />
          {member.username}
        </li>
      {/each}
    </ul>
    {#if data.admin}
      <div class="divider" />
      <form class="mt-4" method="post" use:enhance action="?/invite">
        <h3 class="text-lg">Invite new Member</h3>
        <div class="flex gap-4 items-center">
          <div class="form-control max-w-xs">
            <label class="label" for="member-id">
              <span class="label-text">Member ID</span>
            </label>
            <input
              type="text"
              placeholder="Member ID"
              name="member-id"
              class="input input-bordered w-full max-w-xs"
            />
            <label class="label" for="member-id">
              <span class="label-text-alt">You can find your own member ID on the profile page</span
              >
            </label>
          </div>
          <button class="btn">Invite</button>
        </div>
      </form>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

{#if form}
  <div class="toast toast-end">
    {#if form?.invite?.success}
      <div class="alert alert-success">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
        >
          <X size={16} />
        </button>
        <span>Member invited successfully.</span>
      </div>
    {:else if form?.invite?.success === false}
      <div class="alert alert-error">
        <button
          on:click={() => {
            form = null;
          }}
          class="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
        >
          <X size={16} />
        </button>
        <span>Could not invite member.</span>
      </div>
    {/if}
  </div>
{/if}
