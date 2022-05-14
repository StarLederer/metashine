<script>
import IpcEvents from '../../../common/IpcEvents';
</script>

<div id="window-controls" class="header-controls">
  <button id="window-control-colapse" on:click={() => window.electron.send(IpcEvents.renderer.wants.window.toCollapse)}>
    <i class="icon-windows-collapse" />
  </button>
  <button id="window-control-toggle-size" on:click={() => window.electron.send(IpcEvents.renderer.wants.window.toToggleSize)}>
    <i class="icon-windows-maximize" />
  </button>
  <button id="window-control-close" on:click={() => window.electron.send(IpcEvents.renderer.wants.window.toClose)}>
    <i class="icon-windows-close" />
  </button>
</div>
