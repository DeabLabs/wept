<script>
  import Drawer from '$lib/components/drawer.svelte';
  import NavLinks from '$lib/components/navLinks.svelte';
  import Navbar from '$lib/components/navbar.svelte';
  import ProjectsMenu from '$lib/components/projectsMenu.svelte';
  import ThemePicker from '$lib/components/themePicker.svelte';
  import { onMount } from 'svelte';
  import { themeChange } from 'theme-change';

  onMount(() => {
    themeChange(false);
  });

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
    <li class="flex-col flex">
      <ThemePicker />
    </li>
    <div class="divider" />
    <ProjectsMenu projects={data.projects} />
  </svelte:fragment>
</Drawer>
