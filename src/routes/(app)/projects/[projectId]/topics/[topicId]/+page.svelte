<script>
  import Container from '$lib/components/container.svelte';

  export let data;
</script>

<Container>
  <h1>{data.topic.name}</h1>

  <p>
    This page may end up being the settings page and instead <br />
    <code>/projects/1/topics/2/chat</code> is the actual chat route
  </p>
</Container>
