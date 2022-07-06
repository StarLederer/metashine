<script lang="ts">
  import type { ID3Tag } from '@metashine/native-addon';

  import IpcEvents from '../../../../common/IpcEvents';

  import TextFrame from './components/TextFrame.svelte';
  import PictureFrame from './components/PictureFrame.svelte';

  let currentTag: ID3Tag = {};

  /**
   * Pictures
   */
  function dropAlbumArt(event: DragEvent) {
    if (event.dataTransfer) {
      const file = event.dataTransfer.files[0];
      file.arrayBuffer().then((buffer) => {
        window.electron.send(
          IpcEvents.renderer.has.receivedPicture,
          file.name,
          buffer,
        );
      });
    }
  }

  function albumArtContextMenu(e: MouseEvent) {
    window.contextMenu.open(e.x, e.y, [
      {
        name: 'Paste',
        click() {
          const availableFormats = window.electron.clipboard.availableFormats();
          if (
            availableFormats.includes('image/png')
            || availableFormats.includes('image/jpeg')
          ) {
            window.electron.send(
              IpcEvents.renderer.has.receivedPicture,
              '.png',
              window.electron.clipboard.readImagePNG(),
            );
          }
        },
      },
      {
        name: 'Remove',
        click() {
          window.electron.send(IpcEvents.renderer.wants.toRemoveAlbumArt);
        },
      },
    ]);
  }

  /**
   * Communication
   */

  window.electron.on(IpcEvents.main.wants.toRender.meta, (_, tag: ID3Tag) => {
    currentTag = tag;
  });

  /**
   * Global instance
   */
  window.tags = {
    updateFrame(update): void {
      Object.assign(currentTag, update);
      window.electron.send(IpcEvents.renderer.has.updated.id3tag, update);
    },
  };

  const order = ['APIC', 'TIT2', 'TPE1', 'TRCK', 'TALB', 'TPE2'];

  $: sortedFrames = (() => {
    order.forEach((id) => {
      if (!currentTag[id]) {
        if (id.startsWith('T')) {
          currentTag[id] = '';
        } else if (id === 'APIC') {
          currentTag[id] = {
            MIMEType: '',
            pictureType: '3',
            description: '',
            data: null,
          };
        }
      }
    });

    const arr = Object.entries(currentTag);
    arr.sort((a, b) => {
      const indexA = order.indexOf(a[0]);
      const indexB = order.indexOf(b[0]);

      if (indexA < 0) return 0;
      if (indexB < 0) return -1;

      return indexA < indexB ? -1 : 0;
    });

    return arr;
  })();
</script>

<section id="left-section">
  <header>
    <h2>Tags</h2>
    <div class="header-controls">
      <button
        id="tags-save"
        class="begging"
        on:click={() => window.electron.send(IpcEvents.renderer.wants.toSaveMeta)}
      >
        save
      </button>
    </div>
  </header>
  <main>
    <!-- Regular frames -->
    {#each sortedFrames as [name, value]}
      {#if typeof value === 'string'}
        <TextFrame
          {name}
          {value}
          on:change={(event) => {
            const update = {};
            update[name] = event.detail.value;
            window.electron.send(IpcEvents.renderer.has.updated.id3tag, update);
          }}
        />
      {/if}
    {/each}

    <!-- Pictures -->
    {#each sortedFrames as [name, value]}
      {#if typeof value === 'object' && value?.pictureType}
        <PictureFrame
          {name}
          mimeType={value.MIMEType}
          data={value.data}
          on:drop={dropAlbumArt}
          on:contextmenu={albumArtContextMenu}
        />
      {/if}
    {/each}
  </main>
</section>
