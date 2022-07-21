<script lang="ts">
  import Remove from './Remove.svelte';

  let element: HTMLDivElement;
  $: elementHeight = element ? element.getBoundingClientRect().height : 'auto';
  $: height = remove ? 0 : elementHeight;

  export let title: string;
  export let remove: boolean;
</script>

<div class="tag-field" class:removed={remove}>
  <span class="title">
    {#if remove}
      <del>
        {title}
      </del>
    {:else}
      {title}
    {/if}
  </span>

  <div class="content-wrapper" style={`height: ${height}px`}>
    <div class="content" bind:this={element}>
      <slot />
    </div>
  </div>

  <Remove on:remove on:restore restore={remove} />
</div>

<style lang="scss">
  .tag-field {
    padding: 1rem;
    transition: 500ms;

    &::before,
    &::after {
      content: "";
      height: 1px;
      background: mix(black, white, 6.25%);
      position: absolute;
      left: 0;
      right: 0;
      display: block;
      transition: 500ms;
    }

    &::before {
      top: -1px;
    }

    &::after {
      bottom: 0;
    }

    .title {
      height: 1rem;

      font-size: 0.75em;
      opacity: 0.5;

      display: flex;
      align-items: center;
    }

    .content-wrapper {
      overflow: hidden;
      transition: 500ms;
      display: flex;
      flex-direction: column;
      position: static;

      .content {
        position: static;
      }
    }

    &:hover {
      box-shadow: 0 0 1rem rgba(0, 0, 0, 0.05);
    }

    &.removed {
      margin: 1rem;
      background: mix(white, red, 90%);
      border-radius: 1rem;

      &::before,
      &::after {
        opacity: 0;
        left: 1rem;
        right: 1rem;
      }

      .content-wrapper {
        opacity: 0;
      }

      &:hover {
        box-shadow: none;
      }
    }
  }
</style>
