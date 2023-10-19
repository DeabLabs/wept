<script lang="ts">
  import Markdoc from '@markdoc/markdoc';

  export let content: string | undefined | null = '';

  $: html = Markdoc.renderers.html(Markdoc.transform(Markdoc.parse(content || '')));
</script>

<div class="prose min-w-0 m-0 p-0 w-full max-w-full min-h-8 wrap-anywhere sm:wrap-unset">
  {@html html}
</div>
