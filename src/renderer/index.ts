import '../assets/style.css';
import '../assets/tags.css';
import '../assets/files.css';
import '../assets/context-menu.css';

import { clipboard, ipcRenderer, IpcRendererEvent } from 'electron';
import getStatic from './getStatic';
import $ from 'jquery';
import * as NodeID3 from 'node-id3';

import { IpcEvents } from '../common/IpcEvents';
import { NodeID3Image } from '../common/NodeID3Image';
import { ISuppotedFile } from '../common/SupportedFile';
import { FileCategory } from '../common/FileCategory';

import { IContextMenuOption } from './IContextMenuOption';

//
//
// Util
function stringToHashCode(s: string): number {
  var hash = 0,
    i,
    chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

//
//
// Generate HTML
$(document.head).append(
  `<link rel="stylesheet" href="${getStatic(
    'mp3-tag-assistant-icons/mp3-tag-assistant-icons.css'
  )}"></link>`
);
$('#app').html(require('../assets/main.html'));

var packageJson = require('../../package.json');

//
//
// Fetch UI elements
const ui = {
  document: $(document),
  betaBuildDisclaimer: $('#beta-build-disclaimer'),
  windowControls: {
    close: $('#window-control-close'),
    toggleSize: $('#window-control-toggle-size'),
    collapse: $('#window-control-colapse'),
  },
  selctions: {
    tags: $('#tags-section'),
    files: $('#files-section'),
  },
  saveButton: $('#tags-save'),
  tagFileds: {
    all: $('.tag-filed'),
    trackTitle: $('#track-title'),
    trackArtist: $('#track-artist'),
    trackNumber: $('#track-number'),
    albumTitle: $('#album-title'),
    albumArtist: $('#album-artist'),
    year: $('#year'),
    albumArt: $('#album-art-input'),
  },
  fileLists: {
    supported: $('#file-list'),
    readonly: $('#readonly-list'),
    unsupported: $('#unsupported-list'),
  },
  contextMenu: $('#context-menu'),
};

//
//
// Beta build disclaimer
ui.betaBuildDisclaimer.html(`Beta build v${packageJson.version}`);

//
//
// Tag UI
ui.saveButton.on('click', (event: JQuery.ClickEvent) => {
  event.preventDefault();

  ipcRenderer.send(IpcEvents.rendererRequestSaveMeta, {
    title: ui.tagFileds.trackTitle.val(),
    artist: ui.tagFileds.trackArtist.val(),
    trackNumber: ui.tagFileds.trackNumber.val(),
    album: ui.tagFileds.albumTitle.val(),
    performerInfo: ui.tagFileds.albumArtist.val(),
    year: ui.tagFileds.year.val(),
  });
});

ui.tagFileds.albumArt.on('mouseup', (event: JQuery.MouseUpEvent) => {
  if (event.which == 3) {
    event.stopPropagation();
    openContextMenu(event.pageX, event.pageY, [
      {
        name: 'Paste',
        click() {
          const availableFormats = clipboard.availableFormats();
          if (
            availableFormats.includes('image/png') ||
            availableFormats.includes('image/jpeg')
          ) {
            ipcRenderer.send(
              IpcEvents.rendererAlbumArtReceived,
              '.png',
              clipboard.readImage().toPNG()
            );
          }
        },
      },
      {
        name: 'Remove',
        click() {
          ipcRenderer.send(IpcEvents.rendererRequestRemoveAlbumArt);
        },
      },
    ]);
  }
});

ui.tagFileds.albumArt.on('dragenter', cancelDragOverAndEnter);
ui.tagFileds.albumArt.on('dragover', cancelDragOverAndEnter);

ui.tagFileds.albumArt.on('drop', (event: JQuery.DropEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (event.originalEvent && event.originalEvent.dataTransfer) {
    const file = event.originalEvent.dataTransfer.files[0];
    file.arrayBuffer().then((buffer) => {
      ipcRenderer.send(IpcEvents.rendererAlbumArtReceived, file.name, buffer);
    });
  }
});

ui.tagFileds.trackTitle.on('blur', (event: JQuery.BlurEvent) =>
  ipcRenderer.send(IpcEvents.rendererTagTitleUpdated, $(event.target).val())
);
ui.tagFileds.trackArtist.on('blur', (event: JQuery.BlurEvent) =>
  ipcRenderer.send(IpcEvents.rendererTagArtistUpdated, $(event.target).val())
);
ui.tagFileds.trackNumber.on('blur', (event: JQuery.BlurEvent) =>
  ipcRenderer.send(IpcEvents.rendererTagTrackUpdated, $(event.target).val())
);
ui.tagFileds.albumTitle.on('blur', (event: JQuery.BlurEvent) =>
  ipcRenderer.send(IpcEvents.rendererTagAlbumUpdated, $(event.target).val())
);
ui.tagFileds.albumArtist.on('blur', (event: JQuery.BlurEvent) =>
  ipcRenderer.send(
    IpcEvents.rendererTagAlbumArtistUpdated,
    $(event.target).val()
  )
);
ui.tagFileds.year.on('blur', (event: JQuery.BlurEvent) =>
  ipcRenderer.send(IpcEvents.rendererTagYearUpdated, $(event.target).val())
);

ipcRenderer.on(
  IpcEvents.mainRequestRenderMeta,
  (event: IpcRendererEvent, meta: NodeID3.Tags, mmTags) => {
    ui.tagFileds.trackTitle.val(meta.title as string);
    ui.tagFileds.trackArtist.val(meta.artist as string);
    ui.tagFileds.trackNumber.val(meta.trackNumber as string);
    ui.tagFileds.albumTitle.val(meta.album as string);
    ui.tagFileds.albumArtist.val(meta.performerInfo as string);
    ui.tagFileds.year.val(meta.year as string);

    const albumCover = meta.image as NodeID3Image;
    if (albumCover.imageBuffer) {
      const base64String = _arrayBufferToBase64(albumCover.imageBuffer);
      setAlbumArt(`data:${albumCover.mime};base64,${base64String}`);
    } else ui.tagFileds.albumArt.html('');
  }
);

ipcRenderer.on(
  IpcEvents.mainRequestRenderAlbumArt,
  (event: IpcRendererEvent, albumArt: NodeID3Image) => {
    if (albumArt.imageBuffer) {
      const base64String = _arrayBufferToBase64(albumArt.imageBuffer);
      setAlbumArt(`data:${albumArt.mime};base64,${base64String}`);
    } else ui.tagFileds.albumArt.html('');
  }
);

function setAlbumArt(src: string) {
  ui.tagFileds.albumArt.html(`<img src="${src}" alt="Album art" />`);
}

//
//
// File UI
function cancelDragOverAndEnter(
  event: JQuery.DragEnterEvent | JQuery.DragOverEvent
) {
  event.preventDefault();
  event.stopPropagation();
}
ui.selctions.files.on('dragover', cancelDragOverAndEnter);
ui.selctions.files.on('dragenter', cancelDragOverAndEnter);

ui.selctions.files.on('drop', (event: JQuery.DropEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (event.originalEvent && event.originalEvent.dataTransfer) {
    for (let i = 0; i < event.originalEvent.dataTransfer.files.length; ++i) {
      const f = event.originalEvent.dataTransfer.files[i];
      ipcRenderer.send(IpcEvents.rendererFileReceived, f.path);
    }
  }
});

ipcRenderer.on(
  IpcEvents.mainFileApproved,
  (event: IpcRendererEvent, file: ISuppotedFile, category: FileCategory) => {
    const fileEntry = $(`
      <div class="row file-entry" id="${stringToHashCode(file.path)}">
        <div class="name">${file.name}</div>
        <div>${file.format}</div>
        <div>${file.location}</div>
        <div class="path hidden">${file.path}</div>
      </div>
    `);

    switch (category) {
      case FileCategory.Supported:
        ui.fileLists.supported.append(fileEntry);
        ui.fileLists.supported.show();
        fileEntry.on('mouseup', (e) => onFileEntryClicked(e, true));
        break;
      case FileCategory.Readonly:
        ui.fileLists.readonly.append(fileEntry);
        ui.fileLists.readonly.show();
        fileEntry.on('mouseup', (e) => onFileEntryClicked(e, true));
        break;
      default:
        ui.fileLists.unsupported.append(fileEntry);
        ui.fileLists.unsupported.show();
        fileEntry.on('mouseup', (e) => onFileEntryClicked(e, false));
        break;
    }
  }
);

ipcRenderer.on(
  IpcEvents.mainRequestRemoveFileDOM,
  (event: IpcRendererEvent, filePath: string) => {
    const entry = $('#' + stringToHashCode(filePath));
    const parent = entry.parent();
    entry.remove();
    if (parent.children('.file-entry').length <= 0) {
      parent.hide();
    }
  }
);

function selectFileEntry(element: Element) {
  $('.file-entry').removeClass('selected');
  $(element).addClass('selected');
  ipcRenderer.send(
    IpcEvents.rendererRequestLoadMeta,
    $(element).children('.path').text()
  );
}

function onFileEntryClicked(event: JQuery.MouseUpEvent, selectable?: boolean) {
  let element = event.target;
  if (!$(event.target).hasClass('file-entry')) element = element.parentElement;

  if (event.which == 1) {
    if (selectable) selectFileEntry(element);
  } else if (event.which == 3) {
    event.stopPropagation();
    openContextMenu(event.pageX, event.pageY, [
      {
        name: 'Copy name',
        click() {
          clipboard.writeText($(element).children('.name').html());
        },
      },
      {
        name: 'Remove',
        click() {
          const filePath = $(element).children('.path').text();
          ipcRenderer.send(IpcEvents.rendererRequestRemoveFile, filePath);
        },
      },
    ]);
    if (selectable) selectFileEntry(element);
  }
}

function _arrayBufferToBase64(buffer: Buffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

//
//
// Context menu
let isContextMenuOpen = false;

function openContextMenu(
  x: number,
  y: number,
  options: Array<IContextMenuOption>
) {
  closeContextMenu();
  ui.contextMenu.css({
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
    ui.contextMenu.append(optionButton);
  });
}

function closeContextMenu() {
  if (isContextMenuOpen) {
    ui.contextMenu.css({ display: 'none' });
    ui.contextMenu.children().each((index, element) => {
      $(element).off('mouseup');
      $(element).remove();
    });
    isContextMenuOpen = false;
  }
}

ui.document.on('mouseup', closeContextMenu);

//
//
// Popups
ipcRenderer.on(
  IpcEvents.mainRequestRenderError,
  (event: IpcRendererEvent, error: Error) => {
    alert(`
		Error: ${error.name}\n
		${error.message}\n
		\n
		Consider sending a screenshot of this to Herman
	`);
  }
);

//
//
// Window controls
ui.windowControls.collapse.on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send(IpcEvents.rendererWindowCollaps);
});
ui.windowControls.toggleSize.on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send(IpcEvents.rendererWindowToggleSize);
});
ui.windowControls.close.on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send(IpcEvents.rendererWindowClose);
});
