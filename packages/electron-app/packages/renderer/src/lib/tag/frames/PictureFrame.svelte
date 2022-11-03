<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ID3Picture } from 'native-addon';
  import Frame from './components/Frame.svelte';
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
  export let value: ID3Picture;
  export let remove: boolean;
</script>

<Frame
  {remove}
  title={`
    ${locale.pictureTypes[value.pictureType]} (${name}: ${value.pictureType})
  `}
  on:remove
  on:restore
>
  <div
    class="picture-input"
    on:dragenter|preventDefault={() => {}}
    on:dragover|preventDefault={() => {}}
    on:drop={onDropAlbumArt}
    on:contextmenu={onContextMenu}
  >
    {#if value.data && value.data.byteLength > 0}
      <img
        src={`data:${value.MIMEType};base64,${arrayBufferToBase64(value.data)}`}
        alt="Album art"
      />
    {/if}
  </div>
</Frame>

<style lang="scss">
  .picture-input {
    width: 100%;
    aspect-ratio: 1/1;

    background: rgba(0, 0, 0, 0.1);

    margin-top: 1rem;
    margin-bottom: 1rem;

    border-radius: 0.25rem;

    overflow: hidden;

    &::before {
      content: "Drag an image here";

      width: 100%;
      height: 100%;
      position: absolute;

      opacity: 0.1;

      font-size: 1em;
      font-weight: 700;

      display: flex;
      justify-content: center;
      align-items: center;
    }

    & img {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
</style>
