<script lang="ts">
import Remove from './Remove.svelte';

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
export let value: string;
export let remove: boolean;
</script>

<div class="tag-field">
  <label for={name} style={`padding-bottom: ${remove ? '2rem' : '0'}`}>
    {locale.tags[name] ? `${locale.tags[name]} (${name})` : name}
    {#if remove}
      removed
    {/if}
  </label>
  <input type="text" id={name} placeholder="Unknown" bind:value on:input style={`display: ${remove ? 'none' : 'block'}`}/>
  <Remove on:remove on:restore restore={remove}/>
</div>
