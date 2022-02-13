<script>
  import IpcEvents from '../../../common/IpcEvents';
</script>

<div id="window-controls" class="header-controls">
  <button id="window-control-colapse" on:click={() => window.electron.send(IpcEvents.rendererWindowCollapse)}>
    <i class="icon-windows-collapse" />
  </button>
  <button id="window-control-toggle-size" on:click={() => window.electron.send(IpcEvents.rendererWindowToggleSize)}>
    <i class="icon-windows-maximize" />
  </button>
  <button id="window-control-close" on:click={() => window.electron.send(IpcEvents.rendererWindowClose)}>
    <i class="icon-windows-close" />
  </button>
</div>
