<script lang="ts">
  const locale = {
    tags: {
      GEOB: 'General encapsulated object',
    },
  };

  export let name: string;
</script>

<div class="tag-field other-field">
  <span> {locale.tags[name] ? `${locale.tags[name]} (${name})` : name} </span>
</div>
