<script lang="ts" context="module">
  export interface IContextMenuOption {
    name: string;
    click(event: MouseEvent): void;
  }
</script>

<script lang="ts">
  let isOpen = false;
  let pos = {
    x: 0,
    y: 0,
  };
  let options: IContextMenuOption[] = [];

  window.contextMenu = {
    open(x: number, y: number, items: Array<IContextMenuOption>) {
      window.contextMenu.close();
      options = items;
      pos = { x, y };
      isOpen = true;
    },
    close() {
      if (isOpen) {
        isOpen = false;
        options = [];
      }
    },
  };
</script>

<svelte:window on:click={() => { window.contextMenu.close(); }} />

<div
  id="context-menu"
  style="
    left: calc({pos.x}px - 1rem);
    top: calc({pos.y}px - 2rem);
    display: {isOpen ? 'flex' : 'block'}
  "
>
  {#each options as option}
    <button on:click={option.click}>
      {option.name}
    </button>
  {/each}
</div>
