<script lang="ts">
  import MenuCreateInput from '$lib/components/menuCreateInput.svelte';
  import { PlusCircle } from 'lucide-svelte';

  export let projects: Awaited<
    ReturnType<typeof import('$lib/server/queries/projects')['getAuthorizedProjectsWithTopics']>
  > = [];
</script>

{#each projects as project}
  <li>
    <details open={project.topics.length > 0}>
      <summary class="flex justify-between text-lg sm:text-sm">
        <a href={`/project/${project.id}`} class="hover:underline">{project.name}</a>
      </summary>
      <ul>
        {#each project.topics as topic}
          <li>
            <a
              href={`/project/${project.id}/topic/${topic.id}`}
              on:click={(e) => e.stopPropagation()}>{topic.name}</a
            >
          </li>
        {/each}
        <li>
          <MenuCreateInput action="/?/createTopic" invalidateTarget={'app:rootLayout'}>
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
  <MenuCreateInput action="/?/createProject" invalidateTarget={'app:rootLayout'}>
    <svelte:fragment slot="button"><PlusCircle size={16} />Create new Project</svelte:fragment>
  </MenuCreateInput>
</li>
