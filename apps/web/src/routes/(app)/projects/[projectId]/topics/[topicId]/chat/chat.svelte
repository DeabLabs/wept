<script lang="ts">
  import { enhance } from '$app/forms';
  import Avatar from '$lib/components/avatar.svelte';
  import AvatarGroup from '$lib/components/avatarGroup.svelte';
  import Container from '$lib/components/container.svelte';
  import { Info, MoreHorizontalIcon, Settings, X } from 'lucide-svelte';
  import { tick } from 'svelte';
  import type { ActionData, PageData } from './$types';
  import clsx from 'clsx';
  import { createMessagesStore } from '$lib/stores/messages';
  import Message from '$lib/components/message.svelte';
  import throttle from 'just-throttle';
  // @ts-expect-error
  import autosize from 'svelte-autosize';
  import { user } from 'database/schema';

  export let data: PageData;
  export let form: ActionData;

  function scrollToEndOfMessages(smooth = true) {
    // get the last child element of #messages and then scroll to it
    const messagesEl = document.getElementById('messages');
    if (messagesEl instanceof HTMLElement) {
      const lastMessageEl = messagesEl.lastElementChild;
      if (lastMessageEl instanceof HTMLElement) {
        // select the last message's element with the .prose class
        const lastMessageContent = lastMessageEl.querySelector('.prose > article');
        if (lastMessageContent instanceof HTMLElement) {
          // get the last, deepest nested child element of lastMessageContent and then scroll to it
          lastMessageContent.lastElementChild?.scrollIntoView({
            behavior: smooth ? 'smooth' : undefined
          });
        }
      }
    }
  }

  const throttledScroll = throttle(scrollToEndOfMessages, 256, { leading: true, trailing: true });

  $: messagesStore = createMessagesStore({
    projectId: data.projectId,
    topicId: data.topicId,
    partyOptions: data.partyOptions,
    callbacks: {
      Init: () => {
        tick().then(() => {
          throttledScroll(false);
        });
      },
      SetMessages: () => {
        tick().then(() => {
          const scrolled = () => window.scrollY >= window.outerHeight;
          if (
            // if window is scrolled to the bottom, scroll to the bottom again when a new message arrives
            scrolled()
          ) {
            throttledScroll();
          }
        });
      },
      MessageEdited: () => {
        tick().then(() => {
          const scrolled = () => window.scrollY >= window.outerHeight;
          if (
            // if window is scrolled to the bottom, scroll to the bottom again when a new message arrives
            scrolled()
          ) {
            throttledScroll();
          }
        });
      }
    }
  });

  $: ({ messages, activeUserIds, error: messagesError } = $messagesStore);

  $: memberCountLabel = data.topic.members.length === 1 ? 'member' : 'members';
  $: memberMap = new Map(data.topic.members.map((member) => [member.id, member]));
  $: memberMap.set('null', { admin: false, avatar: null, id: 'AGENT', username: 'GPT' });
  $: activeMembers = data.topic.members.filter((member) => activeUserIds.has(member.id));
  let inputHeight = 0;
  $: chatStyles = `min-height: calc(100vh - ${inputHeight}px - 9.5rem);`;
  $: userClass = (authorId: string) =>
    authorId === data.user.id ? 'text-info' : 'text-base-content';

  function textareaKeyDown(e: KeyboardEvent) {
    // skip handleSubmit if enter + cmd or enter + shift is pressed
    if (e.key === 'Enter' && (e.metaKey || e.shiftKey)) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('send-btn')?.click();
    }
  }

  function handleSubmit(event: { currentTarget: EventTarget & HTMLFormElement }) {
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content')?.toString() ?? '';

    if (!content.trim()) {
      return;
    }

    const optimisticMessage = {
      content,
      authorId: data.partyOptions.id
    };

    messages = [...messages, optimisticMessage];

    messagesStore.addMessage(optimisticMessage);

    event.currentTarget.reset();

    tick().then(() => {
      throttledScroll();
    });
  }

  function handleDeleteMessage(messageId: number) {
    try {
      messagesStore.deleteMessage(messageId);
    } catch {
      console.error('Could not delete message with id', messageId);
    }
  }
</script>

<Container
  notProse={true}
  className="flex flex-col justify-center sm:mx-0 w-full h-full pl-0 pt-0 pr-0"
>
  <ul
    class="menu menu-horizontal rounded-box bg-base-200 self-center justify-center items-center max-w-7xl sticky top-2 p-2 z-20 mt-0"
  >
    <li class="h-full">
      <button
        class="h-full flex items-center"
        on:click={() => {
          const el = document.getElementById('info-modal');
          if (el instanceof HTMLDialogElement) {
            el.showModal();
          }
        }}
        ><Info /><span
          class="sm:text-lg sm:max-w-[15rem] md:max-w-sm 2xl:max-w-4xl font-bold text-info text-ellipsis max-w-[5rem] overflow-hidden whitespace-nowrap"
          >{data.topic.name}</span
        ></button
      >
    </li>
    <li>
      <button
        on:click={() => {
          const el = document.getElementById('members-modal');
          if (el instanceof HTMLDialogElement) {
            el.showModal();
          }
        }}
      >
        <AvatarGroup partialUsers={activeMembers} />
      </button>
    </li>
    {#if data.topic.admin}
      <li class="hidden sm:flex"><a href={data.settingsLink}><Settings /></a></li>
    {/if}
  </ul>
  <ul
    class="w-full px-4 sm:px-10 py-5 flex flex-col h-full gap-2 pt-10"
    id="messages"
    style={chatStyles}
  >
    {#each messages as message, i}
      <li class="w-full flex gap-2 group">
        {#if messages[i - 1]?.authorId !== message.authorId}
          <Avatar
            className="self-start"
            size="sm"
            tooltip={memberMap.get(`${message.authorId}`)?.username}
            avatar={memberMap.get(`${message.authorId}`)?.avatar}
          />
        {:else}
          <!-- Add some space so that message still lines up with messages that have avatars -->
          <!-- this width is w-6 + 4px border from the avatar default width -->
          <div class="w-[26px]" />
        {/if}
        <div class="w-full flex flex-col gap-2">
          {#if messages[i - 1]?.authorId !== message.authorId}
            <div class="w-full flex justify-between items-center h-6 flex-nowrap">
              <span class={clsx('leading-none font-semibold', userClass(`${message.authorId}`))}
                >{memberMap.get(`${message.authorId}`)?.username}</span
              >
              <span class="text-xs text-base-content italic font-light"
                >{new Date(
                  'createdAt' in message ? message.createdAt : Date.now()
                ).toLocaleString()}</span
              >
            </div>
          {/if}
          <div class="flex justify-between items-start">
            <Message content={message.content} />
            <div class="dropdown">
              <button
                tabindex="0"
                class={clsx(
                  'btn btn-sm btn-ghost invisible',
                  (message.authorId === data.user.id || message.authorId == null) &&
                    'focus-visible:visible group-hover:visible'
                )}><MoreHorizontalIcon /></button
              >
              <ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                {#if (message.authorId === data.user.id || message.authorId == null) && 'id' in message}
                  <li>
                    <button on:click={() => 'id' in message && handleDeleteMessage(message.id)}
                      >Delete</button
                    >
                  </li>
                {/if}
              </ul>
            </div>
          </div>
        </div>
      </li>
    {/each}
  </ul>
  <form
    on:submit|preventDefault={handleSubmit}
    class="flex bg-base-300 sticky bottom-0 w-full join-horizontal p-4 sm:rounded-none"
    bind:clientHeight={inputHeight}
  >
    <textarea
      on:keydown={textareaKeyDown}
      use:autosize
      name="content"
      placeholder="Shift + Enter to add a new line. Enter to send."
      style="overflow-x: hidden;"
      class="input input-bordered w-full join-item max-h-36 !overflow-x-hidden resize-none pt-3"
    />
    <button id="send-btn" type="submit" class="join-item btn btn-ghost rounded-lg self-center"
      >Send</button
    >
  </form>
</Container>

<dialog id="info-modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg flex justify-between">
      <span
        class="text-xl text-info overflow-hidden text-ellipsis max-w-[18rem] whitespace-nowrap tooltip"
        data-tip={data.topic.name}>{data.topic.name}</span
      ><span>{data.topic.members.length} {memberCountLabel}</span>
    </h3>
    <ul class="sm:hidden flex gap-2 w-full justify-between items-center mt-1">
      <li>
        <span>
          <AvatarGroup partialUsers={activeMembers} />
        </span>
      </li>
      {#if data.admin}
        <li><a href={data.settingsLink}><Settings /></a></li>
      {/if}
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
              id="member-id"
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

{#if form || messagesError !== undefined}
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
    {:else if messagesError !== undefined}
      <div class="alert alert-error">
        <span>{messagesError}</span>
      </div>
    {/if}
  </div>
{/if}
