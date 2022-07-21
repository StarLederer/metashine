<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SearchResult } from './Result';

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let height: number = null;

  export let result: SearchResult;
</script>

<div class="search-result" class:open={result.isOpen}>
  <div class="suggestions" style={`height: ${height}px`}>
    <div class="container" bind:this={container}>
      {#each result.suggestions as suggestion}
        {#if suggestion.buttons?.length > 0}
          <h5>{suggestion.lablel}</h5>
          <div class="track-artist-suggestions">
            {#each suggestion.buttons as button}
              <button on:click={button.apply}>{button.label}</button>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  </div>
  <div
    class="preview"
    on:click={() => {
      if (result.isOpen) {
        result.isOpen = false;
        height = null;
      } else {
        result.isOpen = true;
        height = container.offsetHeight;
      }
    }}
  >
    <img
      src={result.albumArtSrc ?? ''}
      alt="Album art"
      class="album-art"
      on:click|stopPropagation={() => {
        dispatch('albumArt', {
          url: result.albumArt.url,
          extension: result.albumArt.extension,
        });
      }}
    />

    <h4 class="track-info">
      <span class="track-title">{result.trackTitle}</span>
      <span class="track-artist">{result.trackArtist}</span>
    </h4>
  </div>
</div>
