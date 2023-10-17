<script lang="ts">
  import Markdoc from '@markdoc/markdoc';

  export let content: string | undefined | null = '';

  $: html = Markdoc.renderers.html(Markdoc.transform(Markdoc.parse(content || '')));
</script>

<div class="prose m-0 p-0">{@html html}</div>
