<script lang="ts">
  import type { ID3Frame, ID3Tag } from '@metashine/native-addon';

  import IpcEvents from '../../../../common/IpcEvents';

  import TextFrame from './components/TextFrame.svelte';
  import PictureFrame from './components/PictureFrame.svelte';
  import OtherFrame from './components/OtherFrame.svelte';
  import { findFrameIndexes } from '../../../../common/util';

  let currentTag: ID3Tag = [];

  /**
   * Communication
   */
  const order = ['TIT2', 'TPE1', 'TRCK', 'TALB', 'TPE2', 'APIC'];

  window.electron.on(IpcEvents.main.wants.toRender.meta, (_, tag: ID3Tag) => {
    // WARNING: This pollutes currentTag with invalid
    // placeholders. They should not be returned to main
    const arr = [...tag];

    order.forEach((id) => {
      if (findFrameIndexes(arr, id).length <= 0) {
        if (id.startsWith('T')) {
          arr.push(['text', id, '']);
        } else if (id === 'APIC') {
          arr.push([
            'picture',
            id,
            {
              MIMEType: undefined,
              pictureType: 3,
              description: '',
              data: undefined,
            },
          ]);
        }
      }
    });

    arr.sort((a, b) => {
      const indexA = order.indexOf(a[1]);
      const indexB = order.indexOf(b[1]);

      if (indexA < 0) return 0;
      if (indexB < 0) return -1;

      return indexA < indexB ? -1 : 0;
    });

    currentTag = arr;
  });

  /**
   * Global instance
   */
  window.tags = {
    updateFrame(update): void {
      // Object.assign(currentTag, update);
    },
  };

  /**
   *
   */
  const onSaveClicked = () => {
    // Sanitize tag because we pollute them with empty placeholders
    function isContentComplete(frame: ID3Frame) {
      if (frame[0] === 'text') {
        if (frame[2].length > 0) return true;
      }
      if (frame[0] === 'picture') {
        if (frame[2].data) return true;
      }

      return false;
    }

    const sanitizedTag: ID3Tag = [];
    currentTag.forEach((frame) => {
      if (isContentComplete(frame)) {
        sanitizedTag.push(frame);
      }
    });

    // Communicate to main
    window.electron.send(IpcEvents.renderer.has.changedTag, sanitizedTag);
    window.electron.send(IpcEvents.renderer.wants.toSaveMeta);
  };
</script>

<section id="left-section">
  <header>
    <h2>Tags</h2>
    <div class="header-controls">
      <button id="tags-save" class="begging" on:click={onSaveClicked}>
        save
      </button>
    </div>
  </header>
  <main>
    <!-- Regular frames -->
    {#each currentTag as [type, name, value]}
      {#if type === 'text'}
        <TextFrame {name} bind:value />
      {:else if type === 'picture'}
        <PictureFrame {name} bind:value />
      {:else}
        <OtherFrame {name} />
      {/if}
    {/each}
  </main>
</section>
