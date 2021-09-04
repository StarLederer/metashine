import $ from 'jquery';
import { IContextMenuOption } from './IContextMenuOption';

let isContextMenuOpen = false;

interface ContextMenuSetupParams {
  document: JQuery<Document>;
  contextMenu: JQuery<HTMLElement>;
}

let contextMenu: JQuery<HTMLElement>;

function closeContextMenu(): void {
  if (isContextMenuOpen) {
    contextMenu.css({ display: 'none' });
    contextMenu.children().each((index, element) => {
      $(element).off('mouseup');
      $(element).remove();
    });
    isContextMenuOpen = false;
  }
}

function openContextMenu(
  x: number,
  y: number,
  options: Array<IContextMenuOption>
): void {
  closeContextMenu();
  contextMenu.css({
    left: `calc(${x}px - 2rem)`,
    top: `calc(${y}px - 2rem)`,
    // top: y,
    display: 'flex',
  });
  isContextMenuOpen = true;

  options.forEach((element) => {
    const optionButton = $(`
      <button>
        ${element.name}
      </button>
    `);
    optionButton.on('mouseup', element.click);
    contextMenu.append(optionButton);
  });
}

function setupContextMenu(params: ContextMenuSetupParams): void {
  contextMenu = params.contextMenu;
  params.document.on('mouseup', closeContextMenu);
}

export { setupContextMenu, openContextMenu, closeContextMenu };
