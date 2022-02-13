<script lang="ts">
  import WindowControls from './lib/WindowControls.svelte';
  import Files from './lib/Files.svelte';
  import Assistant from './lib/assistant/Assistant.svelte';
  import Tags from './lib/Tags.svelte';
  import ContextMenu from './lib/ContextMenu.svelte';
  import packageJson from '../../../package.json';
  import IpcEvents from '../../common/IpcEvents';

  let tab = 0;

  window.electron.on(IpcEvents.renderError, (event, error: Error) => {
    alert(`
      Error: ${error.name}\n
      ${error.message}\n
      \n
      Consider submitting a screenshot in a Github issue
    `);
  });
</script>

<div id="main-layout">
  <!-- tags -->
  <Tags />

  <!-- files & assistant -->
  <section id="right-section">
    <header>
      <div class="header-tabs">
        <button
          id="show-files"
          on:click={() => {
            tab = 0;
          }}><h2 class:is-selected={tab === 0}>Files</h2></button
        >
        <button
          id="show-assistant"
          on:click={() => {
            tab = 1;
          }}><h2 class:is-selected={tab === 1}>Assistant</h2></button
        >
      </div>

      <div id="beta-build-disclaimer">Preview build {packageJson.version}</div>

      <WindowControls />
    </header>
    <main>
      {#if tab === 0}
        <Files />
      {:else}
        <Assistant />
      {/if}
    </main>
  </section>
</div>

<ContextMenu />
