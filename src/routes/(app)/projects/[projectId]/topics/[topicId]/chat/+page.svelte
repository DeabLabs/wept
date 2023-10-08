<script lang="ts">
  import AvatarGroup from '$lib/components/avatarGroup.svelte';
  import Container from '$lib/components/container.svelte';
  import { Settings } from 'lucide-svelte';

  export let data;

  const testUsers = [data.user, data.user, data.user, data.user, data.user];
</script>

<Container
  className="not-prose flex flex-col justify-center items-center sm:ml-0 max-w-full w-full"
>
  <ul class="menu menu-horizontal rounded-box bg-base-200 items-center">
    <li><span class="text-lg font-bold text-info">{data.topic.name}</span></li>
    <li>
      <span>
        <AvatarGroup partialUsers={testUsers} />
      </span>
    </li>
    <li><a href={data.settingsLink}><Settings /></a></li>
  </ul>
</Container>
