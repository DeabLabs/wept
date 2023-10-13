<script lang="ts">
  import Avatar from '$lib/components/avatar.svelte';

  export let partialUsers: { id: string; avatar?: string | null; username: string }[] = [];

  $: firstThreeUsers = partialUsers.slice(0, 3);
  $: remainingUserCount = partialUsers.length - firstThreeUsers.length;
</script>

<div class="avatar-group -space-x-6 hover:-space-x-2 transition-all">
  {#each firstThreeUsers as user}
    <Avatar avatar={user.avatar} animate={true} />
  {/each}
  {#if remainingUserCount > 0}
    <div class="avatar placeholder">
      <div class="w-10 bg-neutral-focus text-neutral-content">
        <span>+{remainingUserCount}</span>
      </div>
    </div>
  {/if}
</div>
