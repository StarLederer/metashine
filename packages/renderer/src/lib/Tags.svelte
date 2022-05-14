<script lang="ts">
  import type * as NodeID3 from 'node-id3';

  import { render } from 'sass';
  import type NodeID3Image from '../../../common/NodeID3Image';
  import IpcEvents from '../../../common/IpcEvents';
  import { arrayBufferToBase64 } from '../../../common/util';

  type TagField = {
    id: string;
    label: string;
    value: string;
    apply: () => void;
  };

  const tagFields: TagField[] = [
    {
      id: 'track-title',
      label: 'Track',
      value: '',
      apply() {
        window.electron.send(IpcEvents.renderer.has.updated.tag.title, this.value);
      },
    },
    {
      id: 'track-artist',
      label: 'Tack artirst',
      value: '',
      apply() {
        window.electron.send(IpcEvents.renderer.has.updated.tag.artist, this.value);
      },
    },
    {
      id: 'track-number',
      label: 'Track number',
      value: '',
      apply() {
        window.electron.send(IpcEvents.renderer.has.updated.tag.track, this.value);
      },
    },
    {
      id: 'album-title',
      label: 'Album',
      value: '',
      apply() {
        window.electron.send(IpcEvents.renderer.has.updated.tag.album, this.value);
      },
    },
    {
      id: 'album-artist',
      label: 'Album artist',
      value: '',
      apply() {
        window.electron.send(
          IpcEvents.renderer.has.updated.tag.albumArtist,
          this.value,
        );
      },
    },
    {
      id: 'year',
      label: 'Year',
      value: '',
      apply() {
        window.electron.send(IpcEvents.renderer.has.updated.tag.year, this.value);
      },
    },
  ];

  const albumArtField = {
    src: null,
  };

  /**
   * Album art filed
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

  window.electron.on(IpcEvents.main.wants.toRender.meta, (event: any, meta: NodeID3.Tags) => {
    tagFields[0].value = meta.title;
    tagFields[1].value = meta.artist;
    tagFields[2].value = meta.trackNumber;
    tagFields[3].value = meta.album;
    tagFields[4].value = meta.performerInfo;
    tagFields[5].value = meta.year;

    if (meta.image) {
      const albumCover = meta.image as NodeID3Image;
      if (albumCover.imageBuffer) {
        const base64String = arrayBufferToBase64(albumCover.imageBuffer);

        albumArtField.src = `data:${albumCover.mime};base64,${base64String}`;
      } else albumArtField.src = null;
    } else albumArtField.src = null;
  });

  window.electron.on(
    IpcEvents.main.wants.toRender.albumArt,
    (event: any, albumArt: NodeID3Image) => {
      if (albumArt.imageBuffer) {
        const base64String = arrayBufferToBase64(albumArt.imageBuffer);
        albumArtField.src = `data:${albumArt.mime};base64,${base64String}`;
      } else albumArtField.src = null;
    },
  );

  /**
   * Global instance
   */
  window.tags = {
    updateTrackTitle(value: string): void {
      tagFields[0].value = value;
      window.electron.send(IpcEvents.renderer.has.updated.tag.title, value);
    },

    updateTrackArtist(value: string): void {
      tagFields[1].value = value;
      window.electron.send(IpcEvents.renderer.has.updated.tag.artist, value);
    },

    updateTrackNumber(value: string): void {
      tagFields[2].value = value;
      window.electron.send(IpcEvents.renderer.has.updated.tag.track, value);
    },

    updateAlbumTitle(value: string): void {
      tagFields[3].value = value;
      window.electron.send(IpcEvents.renderer.has.updated.tag.album, value);
    },

    updateAlbumArtist(value: string): void {
      tagFields[4].value = value;
      window.electron.send(IpcEvents.renderer.has.updated.tag.albumArtist, value);
    },

    updateYear(value: string): void {
      tagFields[5].value = value;
      window.electron.send(IpcEvents.renderer.has.updated.tag.year, value);
    },

    updateAlbumArt(buffer: ArrayBuffer, name: string): void {
      window.electron.send(IpcEvents.renderer.has.receivedPicture, name, buffer);
    },
  };
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
    {#each tagFields as field}
      <div class="tag-field">
        <label for={field.id}> {field.label} </label>
        <input
          type="text"
          id={field.id}
          placeholder="Unknown"
          bind:value={field.value}
          on:blur={field.apply}
        />
      </div>
    {/each}

    <div
      class="tag-field"
      id="album-art-field"
      on:dragenter|preventDefault
      on:dragover|preventDefault
      on:drop={dropAlbumArt}
    >
      <span> Album art </span>
      <div id="album-art-input" on:contextmenu={albumArtContextMenu}>
        {#if albumArtField.src}
          <img src={albumArtField.src} alt="Album art" />
        {/if}
      </div>
    </div>
  </main>
</section>
