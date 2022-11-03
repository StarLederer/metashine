<script lang="ts">
  import Frame from './components/Frame.svelte';

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

  let field: HTMLInputElement;

  export let name: string;
  export let value: string;
  export let remove: boolean;
</script>

<Frame
  {remove}
  title={locale.tags[name] ? `${locale.tags[name]} (${name})` : name}
  on:remove
  on:restore
>
  {#if !remove}
    <div
      class="bg"
      on:click={() => {
        field.focus();
      }}
    />
  {/if}
  <input
    type="text"
    id={name}
    placeholder="Unknown"
    bind:value
    on:input
    bind:this={field}
  />
</Frame>

<style lang="scss">
  .bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    cursor: text;
  }

  input {
    width: 100%;
    height: 3rem;

    font-size: 1em;
    font-weight: 700;

    opacity: 0.87;

    transition: 500ms;

    &::placeholder {
      color: #000;
      opacity: 0.1;
    }
  }
</style>
