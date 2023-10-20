<script lang="ts">
  import clsx from 'clsx';
  const themes: string[] = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter'
  ];

  export let className: string | undefined = undefined;
</script>

<div class={clsx('form-control w-full max-w-xs', className)}>
  <label class="label" for="theme-picker">
    <span class="label-text">Theme</span>
  </label>
  <select data-choose-theme id="theme-picker" name="theme-picker" class="select select-bordered">
    {#each themes as theme}
      <option value={theme}>{theme}</option>
    {/each}
  </select>
</div>
