<script lang="ts">
  import Frame from './components/Frame.svelte';

  const locale = {
    tags: {
      GEOB: 'Encapsulated object',
    },
  };

  export let name: string;
  export let remove: boolean;
</script>

<Frame
  {remove}
  title={locale.tags[name] ? `${locale.tags[name]} (${name})` : name}
  on:remove
  on:restore
/>
