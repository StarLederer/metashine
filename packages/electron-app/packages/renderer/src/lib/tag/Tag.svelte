<script lang="ts">
  import type { ID3Tag } from '@metashine/native-addon';

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
    const arr = tag;

    order.forEach((id) => {
      if (findFrameIndexes(arr, id).length <= 0) {
        if (id.startsWith('T')) {
          arr.push([id, '']);
        } else if (id === 'APIC') {
          arr.push([
            id,
            {
              MIMEType: undefined,
              pictureType: 3,
              description: undefined,
              data: undefined,
            },
          ]);
        }
      }
    });

    arr.sort((a, b) => {
      const indexA = order.indexOf(a[0]);
      const indexB = order.indexOf(b[0]);

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
    function isContentComplete(frame: any) {
      if (typeof frame !== 'undefined') {
        if (typeof frame === 'object') {
          let frameComplete = true;
          const values = Object.values(frame);

          if (values.length <= 0) return false;

          values.forEach((obj) => {
            frameComplete = frameComplete && isContentComplete(obj);
          });

          return frameComplete;
        }
        return true;
      }
      return false;
    }

    const sanitizedTag = [];
    currentTag.forEach((frame) => {
      if (isContentComplete(frame)) {
        sanitizedTag.push(frame);
      } else sanitizedTag.push([frame[0], undefined]);
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
    {#each currentTag as [name, value]}
      {#if typeof value === 'string'}
        <TextFrame {name} bind:value />
      {:else if name === 'APIC'}
        <PictureFrame {name} bind:value />
      {:else}
        <OtherFrame {name} />
      {/if}
    {/each}
  </main>
</section>
