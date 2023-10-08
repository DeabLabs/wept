<script lang="ts">
  import PlaceholderUser from '$lib/components/icons/placeholderUser.svelte';

  export let avatar: string | null | undefined = undefined;
</script>

<div class="avatar">
  <div class="w-10 rounded-full">
    {#if avatar}
      <img src={avatar} alt="your profile" />
    {:else}
      <PlaceholderUser className="h-10 w-10" />
    {/if}
  </div>
</div>
