<script lang="ts">
  import type {
    FrameModifier,
    PictureCarrier,
    TagCarrier,
    TagModifier,
  } from '@metashine/native-addon';

  import IpcEvents from '../../../../common/IpcEvents';

  import TextFrame from './components/TextFrame.svelte';
  import PictureFrame from './components/PictureFrame.svelte';
  import OtherFrame from './components/OtherFrame.svelte';
  import { findFrameIndexes } from '../../../../common/util';

  let currentTag: TagModifier = [];

  const favorites = ['TIT2', 'TPE1', 'TRCK', 'TALB', 'TPE2', 'APIC'];
  let missingFrames = [];

  const addFrame = (name: string) => {
    if (name.startsWith('T')) {
      currentTag = [...currentTag, ['text', name, '']];
    } else if (name === 'APIC') {
      currentTag = [
        ...currentTag,
        [
          'picture',
          'APIC',
          {
            MIMEType: null,
            pictureType: 3,
            description: null,
            data: null,
          },
        ],
      ];
    } else {
      alert("Can't add this frame yet");
    }
  };

  $: {
    missingFrames = [];
    favorites.forEach((id) => {
      const indexes = findFrameIndexes(currentTag, id);
      if (indexes.length <= 0) {
        missingFrames.push(id);
      } else {
        let oneFound = false;
        indexes.forEach((i) => {
          const frame = currentTag[i];
          if (!frame[0].startsWith('remove')) {
            if (frame[0] === 'picture') {
              // We only look for picture type 3 for now
              if (frame[2].pictureType === 3) {
                oneFound = true;
              }
            } else {
              oneFound = true;
            }
          }
        });

        if (!oneFound) {
          missingFrames.push(id);
        }
      }
    });
  }

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

  /**
   * Communication
   */

  window.electron.on(
    IpcEvents.main.wants.toRender.meta,
    (_, tag: TagCarrier) => {
      unsavedChanges = false;

      currentTag = [...tag];
    },
  );

  /**
   * Global instance
   */
  window.tags = {
    updateFrame(modifier: FrameModifier): void {
      unsavedChanges = true;

      if (modifier[0] === 'text') {
        for (let i = 0; i < currentTag.length; ++i) {
          if (currentTag[i][0] === 'text' && currentTag[i][1] === modifier[1]) {
            currentTag[i] = modifier;
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
              currentTag[i] = [
                'picture',
                'APIC',
                {
                  ...currentFrame,
                  ...modifier[2],
                },
              ];

              return;
            }
          }
        }
      }
      currentTag = [...currentTag, modifier];
    },
  };

  /**
   *
   */
  let unsavedChanges = false;

  const onSaveClicked = () => {
    // Communicate to main
    window.electron.send(IpcEvents.renderer.has.changedTag, currentTag);
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
    {#each currentTag as [type, name, value], i}
      <!-- <p style="padding: 1rem; opacity: 0.2;">
        type {type}; name: {name}; value: {value};
      </p> -->
      {#if type === 'text'}
        <TextFrame
          {name}
          bind:value
          on:input={() => {
            unsavedChanges = true;
          }}
          on:removed={() => {
            currentTag[i] = ['remove', name];
          }}
        />
      {:else if type === 'picture'}
        <PictureFrame
          {name}
          bind:value
          on:change={() => {
            unsavedChanges = true;
          }}
          on:removed={() => {
            currentTag[i] = ['remove picture', name, value.pictureType];
          }}
        />
      {:else if type.startsWith('remove')}
        <!--  -->
      {:else}
        <OtherFrame
          {name}
          on:removed={() => {
            currentTag[i] = ['remove', name];
          }}
        />
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
      }
    }
  }
</style>
