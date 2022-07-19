<script lang="ts">
  import Remove from './Remove.svelte';

  const locale = {
    tags: {
      GEOB: 'General encapsulated object',
    },
  };

  export let name: string;
  export let remove: boolean;
</script>

<div class="tag-field other-field">
  <span>
    {locale.tags[name] ? `${locale.tags[name]} (${name})` : name}
    {#if remove}
      removed
    {/if}
  </span>
  <Remove
    on:remove
    on:restore
    style="top: 0; bottom: 0; margin-block: auto;"
    restore={remove}
  />
</div>
