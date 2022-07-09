<script lang="ts">
  import type { APICFrame } from '@metashine/native-addon';
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
          }
        },
      },
      {
        name: 'Remove',
        click() {
          value = {
            ...value,
            data: undefined,
          };
        },
      },
    ]);
  }

  export let name: string;
  export let value: APICFrame = null;
</script>

<div
  class="tag-field picture-field"
>
  <span>
    {locale.pictureTypes[value.pictureType]} ({name}: {value.pictureType})
  </span>
  <div
    class="picture-input"
    on:dragenter|preventDefault={() => {}}
    on:dragover|preventDefault={() => {}}
    on:drop={onDropAlbumArt}
    on:contextmenu={onContextMenu}
  >
    {#if value.data}
      <img
        src={`data:${value.MIMEType};base64,${arrayBufferToBase64(value.data)}`}
        alt="Album art"
      />
    {/if}
  </div>
</div>
