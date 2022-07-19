<script lang="ts">
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

export let name: string;
</script>

<div class="tag-field other-field">
  <span>
    Tag {name} removed
  </span>
  <button on:click={() => { dispatch('restore'); }}>restore</button>
</div>

<style lang="scss">
  button {
    height: 2rem;
    margin: 0 1rem;
    margin-block-start: 0.5rem;
    padding: 0 1rem;

    border: rgba(0, 0, 0, 0.4) 1px solid;
    border-radius: 1rem;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
</style>
