<script>
  import Drawer from '$lib/components/drawer.svelte';
  import NavLinks from '$lib/components/navLinks.svelte';
  import Navbar from '$lib/components/navbar.svelte';
  import ProjectsMenu from '$lib/components/projectsMenu.svelte';

  export let data;

  const drawerId = 'primary-drawer';
</script>

<Drawer {drawerId}>
  <svelte:fragment slot="content">
    <Navbar {drawerId} user={data.user} />
    <slot />
  </svelte:fragment>
  <svelte:fragment slot="sidebar">
    <NavLinks />
    <div class="divider" />
    <ProjectsMenu projects={data.projects} />
  </svelte:fragment>
</Drawer>
