<script lang="ts">
  export let style: string = '';
</script>

<button class="remove" on:click {style}>
  <i class="icon-windows-close" />
</button>

<style lang="scss">
  .remove {
    width: 2rem;
    height: 2rem;

    color: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    backdrop-filter: blur(10px);

    position: absolute;
    bottom: 1rem;
    right: 0.5rem;

    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 0.5rem;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: black;
    }
  }
</style>
