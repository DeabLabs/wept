<script lang="ts">
  export let drawerId: string;
</script>

<div class="drawer lg:drawer-open w-screen absolute">
  <input id={drawerId} type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col w-full">
    <slot name="content" />
  </div>
  <div class="drawer-side z-30">
    <label for={drawerId} aria-label="close sidebar" class="drawer-overlay" />
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <slot name="sidebar" />
    </ul>
  </div>
</div>
