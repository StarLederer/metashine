<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let restore: boolean;
  export let style: string = '';
</script>

<button
  class="remove"
  class:restore
  {style}
  on:click={() => {
    if (restore) {
      dispatch('restore');
    } else {
      dispatch('remove');
    }
  }}
>
  {#if restore}
    Restore
  {:else}
    <i class="icon-windows-close" />
  {/if}
</button>

<style lang="scss">
  .remove {
    width: 0.75rem;
    height: 0.75rem;

    color: rgba(0, 0, 0, 0.2);
    border-radius: 1rem;

    position: absolute;
    top: 2rem;
    right: 1rem;

    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 0.5rem;
    }

    &.restore {
      height: 1.5rem;
      top: 1.75rem;
      width: auto;
      padding: 0 1rem;
      border: rgba(0, 0, 0, 0.4) 1px solid;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: black;
      }
    }
  }
</style>
