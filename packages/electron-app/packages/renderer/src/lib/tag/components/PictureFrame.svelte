<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ID3Picture } from '@metashine/native-addon';
  import Remove from './Remove.svelte';
  import { arrayBufferToBase64 } from '../../../../../common/util';

  const dispatch = createEventDispatcher();

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

  function onDropAlbumArt(event: DragEvent) {
    if (!event.dataTransfer) return;

    const file = event.dataTransfer.files[0];
    file.arrayBuffer().then((buffer) => {
      let MIMEType;

      const fileNameLowerCase = file.name.toLowerCase();
      if (fileNameLowerCase.endsWith('png')) {
        MIMEType = 'image/png';
      } else if (
        fileNameLowerCase.endsWith('jpg')
        || fileNameLowerCase.endsWith('jpeg')
      ) {
        MIMEType = 'image/jpeg';
      } else return;

      value = {
        ...value,
        MIMEType,
        data: buffer,
      };
      dispatch('change', { value });
      dispatch('restore');
    });
  }

  function onContextMenu(e: MouseEvent) {
    window.contextMenu.open(e.x, e.y, [
      {
        name: 'Paste',
        click() {
          const availableFormats = window.electron.clipboard.availableFormats();
          if (
            availableFormats.includes('image/png')
            || availableFormats.includes('image/jpeg')
          ) {
            value = {
              ...value,
              MIMEType: 'image/png',
              data: window.electron.clipboard.readImagePNG(),
            };
            dispatch('change', { value });
            dispatch('restore');
          }
        },
      },
      {
        name: 'Remove',
        click() {
          dispatch('remove');
        },
      },
    ]);
  }

  export let name: string;
  export let value: ID3Picture = null;
  export let remove: boolean;
</script>

<div class="tag-field picture-field">
  <span>
    {locale.pictureTypes[value.pictureType]} ({name}: {value.pictureType})
    {#if remove}
    removed
  {/if}
  </span>
  <div
    class="picture-input"
    on:dragenter|preventDefault={() => {}}
    on:dragover|preventDefault={() => {}}
    on:drop={onDropAlbumArt}
    on:contextmenu={onContextMenu}
  >
    {#if value.data && !remove}
      <img
        src={`data:${value.MIMEType};base64,${arrayBufferToBase64(value.data)}`}
        alt="Album art"
      />
    {/if}
  </div>

  <Remove
    on:remove
    on:restore
    restore={remove}
  />
</div>
