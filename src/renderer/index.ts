import '../assets/css/style.scss';

import { clipboard, ipcRenderer, IpcRendererEvent } from 'electron';
import $ from 'jquery';
import getStatic from './getStatic';

import { stringToHashCode } from '../common/util';

import IpcEvents from '../common/IpcEvents';
import ISuppotedFile from '../common/SupportedFile';
import FileCategory from '../common/FileCategory';

import cancelDragOverAndEnter from './dragEventHandlers';
import { setupTagUI } from './tagUI';
import { setupContextMenu, openContextMenu } from './contextMenu';
import setupAssistantUI from './assistantUI';

//
//
// Generate HTML
$(document.head).append(
  `<link rel="stylesheet" href="${getStatic(
    'mp3-tag-assistant-icons/mp3-tag-assistant-icons.css'
  )}"></link>`
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
$('#app').html(require('../assets/main.html'));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');

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

  sections: {
    left: {
      section: $('#left-section'),
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
    },
    right: {
      section: $('#right-section'),
      tabNav: {
        files: $('#show-files'),
        assistant: $('#show-assistant'),
      },
      tabs: {
        files: $('#files-tab'),
        assistant: $('#assistant-tab'),
      },
      fileLists: {
        supported: $('#file-list'),
        readonly: $('#readonly-list'),
        unsupported: $('#unsupported-list'),
      },
      searchInput: $('#search-input') as JQuery<HTMLInputElement>,
      searchSCButton: $('#search-soundcloud'),
      searchResults: $('#search-results'),
    },
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
setupTagUI({
  saveButton: ui.sections.left.saveButton,
  tagFields: ui.sections.left.tagFileds,
});

//
//
// Right secton tabs
const rightSection = {
  selectedTab: 0,
  // tabs: {
  // },
};

ui.sections.right.tabNav.files.on('click', (event: JQuery.ClickEvent) => {
  event.preventDefault();
  if (rightSection.selectedTab === 0) return;
  ui.sections.right.tabNav.assistant.html(
    ui.sections.right.tabNav.assistant
      .html()
      .substring(4, ui.sections.right.tabNav.assistant.html().length - 5)
  );
  ui.sections.right.tabNav.files.html(
    `<h2>${ui.sections.right.tabNav.files.html()}</h2>`
  );
  ui.sections.right.tabs.assistant.css('display', 'none');
  ui.sections.right.tabs.files.css('display', 'block');
  rightSection.selectedTab = 0;
});

ui.sections.right.tabNav.assistant.on('click', (event: JQuery.ClickEvent) => {
  event.preventDefault();
  if (rightSection.selectedTab === 1) return;
  ui.sections.right.tabNav.files.html(
    ui.sections.right.tabNav.files
      .html()
      .substring(4, ui.sections.right.tabNav.files.html().length - 5)
  );
  ui.sections.right.tabNav.assistant.html(
    `<h2>${ui.sections.right.tabNav.assistant.html()}</h2>`
  );
  ui.sections.right.tabs.files.css('display', 'none');
  ui.sections.right.tabs.assistant.css('display', 'block');
  rightSection.selectedTab = 1;
});

//
//
// File UI
function selectFileEntry(filePath: string) {
  ipcRenderer.send(IpcEvents.rendererSelectionFileSelected, filePath);
}

function toggleFileEntryInSelection(filePath: string) {
  ipcRenderer.send(IpcEvents.rendererSelectionFileToggled, filePath);
}

function updateFileSelection(event: IpcRendererEvent, elements: string[]) {
  $('.file-entry').removeClass('selected');
  elements.forEach((element) => {
    $(`#${stringToHashCode(element)}`).addClass('selected');
  });
}

function onFileEntryClicked(event: JQuery.MouseUpEvent, selectable?: boolean) {
  // Get file entry element
  let element = event.target;
  if (!$(event.target).hasClass('file-entry')) element = element.parentElement;

  // Get file path
  const filePath = $(element).children('.path').text();

  // Left click
  if (event.which === 1) {
    if (selectable) {
      if (event.ctrlKey) toggleFileEntryInSelection(filePath);
      else selectFileEntry(filePath);
    }
  }
  // Right click
  else if (event.which === 3) {
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
          const removeFilePath = $(element).children('.path').text();
          ipcRenderer.send(IpcEvents.rendererRequestRemoveFile, removeFilePath);
        },
      },
    ]);
    if (selectable) selectFileEntry(filePath);
  }
}

ui.sections.right.tabs.files.on('dragover', cancelDragOverAndEnter);
ui.sections.right.tabs.files.on('dragenter', cancelDragOverAndEnter);

ui.sections.right.tabs.files.on('drop', (event: JQuery.DropEvent) => {
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
        ui.sections.right.fileLists.supported.append(fileEntry);
        ui.sections.right.fileLists.supported.show();
        fileEntry.on('mouseup', (e) => onFileEntryClicked(e, true));
        break;
      case FileCategory.Readonly:
        ui.sections.right.fileLists.readonly.append(fileEntry);
        ui.sections.right.fileLists.readonly.show();
        fileEntry.on('mouseup', (e) => onFileEntryClicked(e, true));
        break;
      default:
        ui.sections.right.fileLists.unsupported.append(fileEntry);
        ui.sections.right.fileLists.unsupported.show();
        fileEntry.on('mouseup', (e) => onFileEntryClicked(e, false));
        break;
    }
  }
);

ipcRenderer.on(
  IpcEvents.renderNoFileDOM,
  (event: IpcRendererEvent, filePath: string) => {
    const entry = $(`#${stringToHashCode(filePath)}`);
    const parent = entry.parent();
    entry.remove();
    if (parent.children('.file-entry').length <= 0) {
      parent.hide();
    }
  }
);

ipcRenderer.on(IpcEvents.mainSelectionUpdated, updateFileSelection);

//
//
// Assistant
setupAssistantUI({
  searchInput: ui.sections.right.searchInput,
  searchSoundcloud: ui.sections.right.searchSCButton,
  searchResults: ui.sections.right.searchResults,
});

//
//
// Context menu
setupContextMenu({
  document: ui.document,
  contextMenu: ui.contextMenu,
});

//
//
// Popups
ipcRenderer.on(
  IpcEvents.renderError,
  (event: IpcRendererEvent, error: Error) => {
    // eslint-disable-next-line no-alert
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
  ipcRenderer.send(IpcEvents.rendererWindowCollapse);
});
ui.windowControls.toggleSize.on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send(IpcEvents.rendererWindowToggleSize);
});
ui.windowControls.close.on('click', (e) => {
  e.preventDefault();
  ipcRenderer.send(IpcEvents.rendererWindowClose);
});
