<script lang="ts">
  import type { ID3Frame, ID3Picture, ID3Tag } from '@metashine/native-addon';

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
    unsavedChanges = false;

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
    updateFrame(update: ID3Frame): void {
      unsavedChanges = true;

      if (update[0] === 'text') {
        for (let i = 0; i < currentTag.length; ++i) {
          if (currentTag[i][0] === 'text' && currentTag[i][1] === update[1]) {
            currentTag[i] = update;
            return;
          }
        }
      } else if (update[0] === 'picture') {
        for (let i = 0; i < currentTag.length; ++i) {
          if (
            currentTag[i][0] === 'picture'
            && currentTag[i][1] === update[1]
          ) {
            const currentFrame = currentTag[i] as ID3Picture;
            if (currentFrame[2].pictureType === update[2].pictureType) {
              currentTag[i] = [
                'picture',
                'APIC',
                {
                  ...currentFrame,
                  ...update[2],
                },
              ];

              return;
            }
          }
        }
      }
      currentTag = [...currentTag, update];
    },
  };

  /**
   *
   */
  let unsavedChanges = false;

  const onSaveClicked = () => {
    // Sanitize tag because we pollute them with empty placeholders
    function isContentComplete(frame: ID3Frame) {
      if (frame[0] === 'text') {
        if (frame[2].length <= 0) return false;
      }
      if (frame[0] === 'picture') {
        if (!frame[2].data) return false;
      }

      return true;
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
      <button
        id="tags-save"
        class:begging={unsavedChanges}
        on:click={onSaveClicked}
      >
        save
        <div class="unsaved-changes" class:visible={unsavedChanges} />
      </button>
    </div>
  </header>
  <main>
    <!-- Regular frames -->
    {#each currentTag as [type, name, value]}
      {#if type === 'text'}
        <TextFrame
          {name}
          bind:value
          on:input={() => {
            unsavedChanges = true;
          }}
        />
      {:else if type === 'picture'}
        <PictureFrame
          {name}
          bind:value
          on:change={() => {
            unsavedChanges = true;
          }}
        />
      {:else}
        <OtherFrame {name} />
      {/if}
    {/each}
  </main>
</section>

<style lang="scss">
  #tags-save {
    width: 6rem;
    background: #000000;
    color: #ffffff;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--accent);
      color: #ffffff;
    }

    &:active {
      background: var(--accent-h1);
      color: #ffffff;
    }

    .unsaved-changes {
      width: 2rem;
      height: 2rem;
      position: absolute;
      right: 0;

      border-radius: 50%;
      background: #ffffff;
      opacity: 0;
      transform: scale(0);
      transition: 100ms;

      &.visible {
        opacity: 1;
        transform: scale(0.125);
        // margin-inline-start: 1rem;
      }
    }
  }
</style>
