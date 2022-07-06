<script lang="ts">
  import { arrayBufferToBase64 } from '../../../../../common/util';

  export let name: string;
  export let mimeType: string;
  // export let description: string;
  // export let pictureType: string;
  export let data: ArrayBuffer;
</script>

<div
  class="tag-field"
  id="album-art-field"
  on:dragenter|preventDefault
  on:dragover|preventDefault
  on:drop|preventDefault
>
  <span> Picture ({name}) </span>
  <div id="album-art-input" on:contextmenu|preventDefault>
    {#if data}
      <img src={`data:${mimeType};base64,${arrayBufferToBase64(data)}`} alt="Album art" />
    {/if}
  </div>
</div>
