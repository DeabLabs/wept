<script lang="ts">
  import Container from '$lib/components/container.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<Container className="flex flex-col gap-8">
  <h1>Profile</h1>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>id</th>
          <th>username</th>
          <th>email</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{data.userId}</td>
          <td>{data.username}</td>
          <td>{data.email}</td>
        </tr>
      </tbody>
    </table>
  </div>
</Container>
