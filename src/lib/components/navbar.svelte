<script lang="ts">
  import { enhance } from '$app/forms';
  import DrawerToggle from '$lib/components/drawerToggle.svelte';
  import PlaceholderUser from '$lib/components/icons/placeholderUser.svelte';
  import type { User } from 'lucia';
  import { Menu } from 'lucide-svelte';

  export let user: User;
  export let drawerId: string;
</script>

<div class="navbar bg-base-100">
  <div class="flex-1">
    <DrawerToggle {drawerId}>
      <Menu />
    </DrawerToggle>
  </div>
  <div class="flex-none gap-2">
    <div class="dropdown dropdown-end">
      <button tabindex="0" class="btn btn-ghost btn-circle avatar">
        <div class="w-10 rounded-full">
          {#if user.avatar}
            <img src={user.avatar} alt="your profile" />
          {:else}
            <PlaceholderUser className="h-10 w-10" />
          {/if}
        </div>
      </button>
      <ul class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-200 rounded-box w-52">
        <li class="menu-title">Hey, {user.username}</li>
        <li>
          <a href="/profile">Profile</a>
        </li>
        <li class="w-full">
          <form method="post" action="/logout" class="flex w-full h-full" use:enhance>
            <button type="submit" class="flex w-full h-full p-0">Logout</button>
          </form>
        </li>
      </ul>
    </div>
  </div>
</div>
