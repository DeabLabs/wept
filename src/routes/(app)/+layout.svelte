<script>
  import Drawer from '$lib/components/drawer.svelte';
  import Navbar from '$lib/components/navbar.svelte';

  export let data;

  const drawerId = 'primary-drawer';
</script>

<Drawer {drawerId}>
  <svelte:fragment slot="content">
    <Navbar {drawerId} user={data.user} />
    <slot />
  </svelte:fragment>
  <svelte:fragment slot="sidebar">
    <li>
      <a href="/dashboard">Dashboard</a>
    </li>
    <li>
      <a href="/profile">Profile</a>
    </li>
    <li />
  </svelte:fragment>
</Drawer>
