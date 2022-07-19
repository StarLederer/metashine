<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Remove from './Remove.svelte';

  const dispatch = createEventDispatcher();

  const locale = {
    tags: {
      GEOB: 'General encapsulated object',
    },
  };

  export let name: string;
</script>

<div class="tag-field other-field">
  <span> {locale.tags[name] ? `${locale.tags[name]} (${name})` : name} </span>
  <Remove on:click={() => { dispatch('removed'); }} style="top: 0; bottom: 0; margin-block: auto;"/>
</div>
