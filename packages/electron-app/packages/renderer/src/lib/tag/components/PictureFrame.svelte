<script lang="ts">
  import { arrayBufferToBase64 } from '../../../../../common/util';

  const locale = {
    pictureTypes: [
      'Other picture',
      'File icon',
      'Other file icon',
      'Front cover',
      'Back cover',
      'Leaflet page',
      'Media',
      'Lead artist',
      'Artist',
      'Conductor',
      'Band',
      'Composer',
      'Lyricist',
      'Recording location',
      'During recording',
      'During performance',
      'Video screen capture',
      'A bright colored fish',
      'Illustration',
      'Artist logo',
      'Publisher logo',
    ],
  };

  export let name: string;
  export let mimeType: string;
  // export let description: string;
  export let pictureType: string;
  export let data: ArrayBuffer;
</script>

<div
  class="tag-field"
  id="album-art-field"
  on:dragenter|preventDefault
  on:dragover|preventDefault
  on:drop|preventDefault
>
  <span> {locale.pictureTypes[pictureType]} ({name}: {pictureType}) </span>
  <div id="album-art-input" on:contextmenu|preventDefault>
    {#if data}
      <img
        src={`data:${mimeType};base64,${arrayBufferToBase64(data)}`}
        alt="Album art"
      />
    {/if}
  </div>
</div>
