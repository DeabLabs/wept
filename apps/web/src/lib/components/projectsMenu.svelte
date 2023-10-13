<script lang="ts">
  import MenuCreateInput from '$lib/components/menuCreateInput.svelte';
  import type { GetProjectsQueryType } from '$lib/server/queries/types';
  import { PlusCircle } from 'lucide-svelte';

  export let projects: GetProjectsQueryType<'getUserProjectsWithTopics'> = [];
</script>

{#each projects as project}
  <li>
    <details open={project.topics.length > 0}>
      <summary class="flex justify-between text-lg sm:text-sm">
        {#if project.admin}
          <a href={`/projects/${project.id}`} class="hover:underline">
            <span class="max-w-full whitespace-nowrap text-ellipsis overflow-hidden">
              {project.name}
            </span>
          </a>
        {:else}
          <span>{project.name}</span>
        {/if}
      </summary>
      <ul>
        {#each project.topics as topic}
          <li>
            <a href={`/projects/${project.id}/topics/${topic.id}/chat`}>
              <span class="max-w-full whitespace-nowrap text-ellipsis overflow-hidden"
                >{topic.name}</span
              >
            </a>
          </li>
        {/each}
        {#if project.admin}
          <li>
            <MenuCreateInput action="/?/createTopic">
              <svelte:fragment slot="button"
                ><PlusCircle size={16} />Create new Topic</svelte:fragment
              >
              <input slot="open" name="projectId" hidden readonly value={project.id} />
            </MenuCreateInput>
          </li>
        {/if}
      </ul>
    </details>
  </li>
{/each}
<li>
  <MenuCreateInput action="/?/createProject">
    <svelte:fragment slot="button"><PlusCircle size={16} />Create new Project</svelte:fragment>
  </MenuCreateInput>
</li>
