<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // TODO: this should be internationalized
  const locale = {
    tags: {
      TALB: 'Album',
      TBPM: 'BPM',
      TCON: 'Genre',
      TIT2: 'Track title',
      TKEY: 'Key',
      TPE1: 'Tack artirst',
      TPE2: 'Album artist',
      TRCK: 'Track number',
    },
  };

  export let name: string;
  export let value: string = '';
</script>

<div class="tag-field">
  <label for={name}>{locale.tags[name] ? `${locale.tags[name]} (${name})` : `Extra: ${name}`} </label>
  <input
    type="text"
    id={name}
    placeholder="Unknown"
    bind:value
    on:blur={() => {
      dispatch('change', { value });
    }}
  />
</div>
