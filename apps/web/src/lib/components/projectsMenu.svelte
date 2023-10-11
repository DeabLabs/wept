<script lang="ts">
  import MenuCreateInput from '$lib/components/menuCreateInput.svelte';
  import type { GetProjectsQueryType } from '$lib/server/queries/types';
  import { PlusCircle } from 'lucide-svelte';

  export let projects: GetProjectsQueryType<'getAuthorizedProjectsWithTopics'> = [];
</script>

{#each projects as project}
  <li>
    <details open={project.topics.length > 0}>
      <summary class="flex justify-between text-lg sm:text-sm">
        <a href={`/projects/${project.id}`} class="hover:underline">{project.name}</a>
      </summary>
      <ul>
        {#each project.topics as topic}
          <li>
            <a href={`/projects/${project.id}/topics/${topic.id}/chat`}>{topic.name}</a>
          </li>
        {/each}
        <li>
          <MenuCreateInput action="/?/createTopic">
            <svelte:fragment slot="button"><PlusCircle size={16} />Create new Topic</svelte:fragment
            >
            <input slot="open" name="projectId" hidden readonly value={project.id} />
          </MenuCreateInput>
        </li>
      </ul>
    </details>
  </li>
{/each}
<li>
  <MenuCreateInput action="/?/createProject">
    <svelte:fragment slot="button"><PlusCircle size={16} />Create new Project</svelte:fragment>
  </MenuCreateInput>
</li>
