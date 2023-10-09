<script lang="ts">
  import AvatarGroup from '$lib/components/avatarGroup.svelte';
  import Container from '$lib/components/container.svelte';
  import { Info, Settings } from 'lucide-svelte';

  export let data;

  const testUsers = [data.user, data.user, data.user, data.user, data.user];
  const memberCountLabel = data.topic.userCount === 1 ? 'member' : 'members';
</script>

<Container
  className="not-prose flex flex-col justify-center items-center sm:ml-0 max-w-full w-full"
>
  <ul class="menu menu-horizontal rounded-box bg-base-200 justify-center items-center max-w-7xl">
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
    <li>
      <span>
        <AvatarGroup partialUsers={testUsers} />
      </span>
    </li>
    <li><a href={data.settingsLink}><Settings /></a></li>
  </ul>
</Container>

<dialog id="info-modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg flex justify-between">
      <span class="text-xl text-info">{data.topic.name}</span><span
        >{data.topic.userCount} {memberCountLabel}</span
      >
    </h3>
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
