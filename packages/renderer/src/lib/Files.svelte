<script lang="ts">
  import IpcEvents from '../../../common/IpcEvents';
  import type { ISuppotedFile } from '../../../common/SupportedFile';
  import { stringToHashCode } from '../../../common/util';

  type Category = {
    id: string;
    title?: string;
    addedFiles: ISuppotedFile[];
  };

  const categories: Category[] = [
    {
      id: 'file-list',
      addedFiles: [],
    },
    {
      id: 'unsupported-list',
      title: 'Unsupported',
      addedFiles: [],
    },
  ];

  /**
   * Load file list from main process
   */
  window.electron.on(
    IpcEvents.main.has.updatedFiles,
    (event: any, files: ISuppotedFile[]) => {
      const supported: ISuppotedFile[] = [];
      const unsupported: ISuppotedFile[] = [];

      files.forEach((file) => {
        if (file.tag) {
          supported.push(file);
        } else {
          unsupported.push(file);
        }
      });

      categories[0].addedFiles = supported;
      categories[1].addedFiles = unsupported;
    },
  );

  window.electron.send(IpcEvents.renderer.wants.toRefresh.files);

  /**
   * File addition
   */
  function drop(event: DragEvent) {
    if (event.dataTransfer) {
      for (let i = 0; i < event.dataTransfer.files.length; ++i) {
        const f = event.dataTransfer.files[i] as File & { path: string };
        window.electron.send(IpcEvents.renderer.has.receivedFile, f.path);
      }
    }
  }

  window.electron.on(
    IpcEvents.main.has.approvedFile,
    (event: any, file: ISuppotedFile) => {
      if (file.tag) {
        categories[0].addedFiles = [...categories[0].addedFiles, file];
      } else {
        categories[1].addedFiles = [...categories[1].addedFiles, file];
      }
    },
  );

  /**
   * File selection
   */
  let selectedFiles: string[] = [];
  let ctrl = false;

  function clickFile(path: string): void {
    if (ctrl) {
      window.electron.send(IpcEvents.renderer.wants.toToggleFile, path);
    } else window.electron.send(IpcEvents.renderer.wants.toSelectFile, path);
  }

  function opneContextMenu(e: MouseEvent, name: string, path: string): void {
    window.contextMenu.open(e.x, e.y, [
      {
        name: 'Copy name',
        click() {
          window.electron.clipboard.writeText(name);
        },
      },
      {
        name: 'Remove',
        click() {
          window.electron.send(IpcEvents.renderer.wants.toRemoveFile, path);
        },
      },
    ]);
  }

  window.electron.send(IpcEvents.renderer.wants.toRefresh.selection);

  window.electron.on(
    IpcEvents.main.has.updatedSelection,
    (event, selection) => { selectedFiles = selection; },
  );
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Control') ctrl = true;
  }}
  on:keyup={(e) => {
    if (e.key === 'Control') ctrl = false;
  }}
/>

<div
  id="files-tab"
  on:dragenter|preventDefault
  on:dragover|preventDefault
  on:drop={drop}
>
  <div class="table">
    <div class="row table-head afterline">
      <div>Name</div>
      <div>Tag</div>
      <div>Location</div>
      <div class="hidden">Path</div>
    </div>

    {#each categories as category}
      {#if category.addedFiles.length > 0}
        <div id={category.id} class="section">
          {#if category.title}
            <div class="row section-head afterline">
              {category.title}
            </div>
          {/if}
          {#each category.addedFiles as file}
            <div
              class="row file-entry"
              class:selected={selectedFiles.includes(file.path)}
              id="${stringToHashCode(file.path)}"
              on:click={() => clickFile(file.path)}
              on:contextmenu={(e) => opneContextMenu(e, file.name, file.path)}
            >
              <div class="name">{file.name}</div>
              <div>{file.tag ? 'ID3' : ''}</div>
              <div>{file.location}</div>
              <div class="path hidden">{file.path}</div>
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</div>
