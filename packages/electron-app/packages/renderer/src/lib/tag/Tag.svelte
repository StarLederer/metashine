<script lang="ts">
  import type {
    FrameCarrier,
    PictureCarrier,
    TagCarrier,
  } from '@metashine/native-addon';

  import IpcEvents from '../../../../common/IpcEvents';

  import TextFrame from './frames/TextFrame.svelte';
  import PictureFrame from './frames/PictureFrame.svelte';
  import OtherFrame from './frames/OtherFrame.svelte';
  import { findFrameIndexes } from '../../../../common/util';

  let currentTag: TagCarrier = [];
  let tagMods: TagCarrier = [];

  const favorites = ['TIT2', 'TPE1', 'TRCK', 'TALB', 'TPE2', 'APIC'];
  let missingFrames = [];

  const changeFrame = (i: number, mod: FrameCarrier) => {
    currentTag[i] = mod;
    tagMods[i] = mod;
  };

  const addFrame = (name: string) => {
    if (name.startsWith('T')) {
      currentTag = [...currentTag, ['text', name, '', false]];
      tagMods[currentTag.length - 1] = currentTag[currentTag.length - 1];
    } else if (name === 'APIC') {
      currentTag = [
        ...currentTag,
        [
          'picture',
          'APIC',
          {
            MIMEType: 'image/jpeg',
            pictureType: 3,
            description: '',
            data: new ArrayBuffer(0),
          },
          false,
        ],
      ];
      tagMods[currentTag.length - 1] = currentTag[currentTag.length - 1];
    } else {
      alert("Can't add this frame yet");
    }
  };

  // Update missing frames
  $: {
    missingFrames = [];
    favorites.forEach((id) => {
      const indexes = findFrameIndexes(currentTag, id);
      if (id === 'APIC') {
        let foundOne = false;
        indexes.forEach((i) => {
          const frame = currentTag[i];
          if (frame[0] === 'picture' && frame[2].pictureType === 3) {
            foundOne = true;
          }
        });
        if (!foundOne) {
          missingFrames.push(id);
        }
      } else if (indexes.length <= 0) {
        missingFrames.push(id);
      }
    });
  }

  // Sort currentTag
  $: {
    // Sort favorites on top
    currentTag.sort((a, b) => {
      const indexA = favorites.indexOf(a[1]);
      const indexB = favorites.indexOf(b[1]);

      if (indexA < 0) return 0;
      if (indexB < 0) return -1;

      return indexA < indexB ? -1 : 0;
    });

    // Sort pictures by picture type
    currentTag.sort((a, b) => {
      if (a[0] === 'picture' && b[0] === 'picture') {
        return a[2].pictureType - b[2].pictureType;
      }

      return 0;
    });
  }

  $: unsavedChanges = tagMods.length > 0;

  /**
   * Communication
   */

  window.electron.on(
    IpcEvents.main.wants.toRender.meta,
    (_, tag: TagCarrier) => {
      currentTag = [...tag];
      tagMods = [];
    },
  );

  /**
   * Global instance
   */
  window.tags = {
    updateFrame(modifier: FrameCarrier): void {
      if (modifier[0] === 'text') {
        for (let i = 0; i < currentTag.length; ++i) {
          if (currentTag[i][0] === 'text' && currentTag[i][1] === modifier[1]) {
            changeFrame(i, modifier);
            return;
          }
        }
      } else if (modifier[0] === 'picture') {
        for (let i = 0; i < currentTag.length; ++i) {
          if (
            currentTag[i][0] === 'picture'
            && currentTag[i][1] === modifier[1]
          ) {
            const currentFrame = currentTag[i] as PictureCarrier;
            if (currentFrame[2].pictureType === modifier[2].pictureType) {
              changeFrame(i, [
                'picture',
                'APIC',
                {
                  ...currentFrame,
                  ...modifier[2],
                },
                false,
              ]);

              return;
            }
          }
        }
      }
      currentTag = [...currentTag, modifier];
    },
  };

  const onSaveClicked = () => {
    window.electron.send(IpcEvents.renderer.wants.toWriteUpdate, tagMods);
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
    <!-- Favorite frames -->
    {#if missingFrames.length > 0}
      <section class="missing-frames afterline">
        <h3>Add these frames?</h3>
        <div class="add-frames-list">
          {#each missingFrames as missingID}
            <button
              class="add"
              on:click={() => {
                addFrame(missingID);
              }}
            >
              {missingID}
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Regular frames -->
    {#each currentTag as [type, name, value, remove], i}
      <!-- <p style="padding: 1rem; opacity: 0.2;">
        type {type}; name: {name}; value: {value};
      </p> -->
      {#if type === 'text'}
        <TextFrame
          {name}
          {remove}
          bind:value
          on:input={() => {
            changeFrame(i, [type, name, value, remove]);
          }}
          on:remove={() => {
            const mod = currentTag[i];
            mod[3] = true;
            changeFrame(i, mod);
          }}
          on:restore={() => {
            const mod = currentTag[i];
            mod[3] = false;
            changeFrame(i, mod);
          }}
        />
      {:else if type === 'picture'}
        <PictureFrame
          {name}
          {remove}
          {value}
          on:change={(e) => {
            changeFrame(i, [type, name, e.detail.value, false]);
          }}
          on:remove={() => {
            const mod = currentTag[i];
            mod[3] = true;
            changeFrame(i, mod);
          }}
          on:restore={() => {
            const mod = currentTag[i];
            mod[3] = false;
            changeFrame(i, mod);
          }}
        />
      {:else}
        <OtherFrame
          {name}
          {remove}
          on:remove={() => {
            const mod = currentTag[i];
            mod[3] = true;
            changeFrame(i, mod);
          }}
          on:restore={() => {
            const mod = currentTag[i];
            mod[3] = false;
            changeFrame(i, mod);
          }}
        />
      {/if}
    {/each}
  </main>
</section>

<style lang="scss">
  #left-section {
    background: #ffffff;

    header button {
      height: 2rem;

      font-weight: 700;
      font-size: 0.75rem;

      border-radius: 1rem;
    }
  }

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

  .missing-frames {
    height: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    h3 {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .add-frames-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.25rem;

      .add {
        height: 1.5rem;
        padding-inline: 1rem;
        border: rgba(0, 0, 0, 0.4) 1px solid;
        border-radius: 1.5rem;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
          color: black;
        }
      }
    }
  }
</style>
