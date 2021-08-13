import { clipboard, ipcRenderer, IpcRendererEvent } from 'electron';
import $ from 'jquery';
import * as NodeID3 from 'node-id3';

import { IpcEvents } from '../common/IpcEvents';
import { NodeID3Image } from '../common/NodeID3Image';
import { arrayBufferToBase64 } from '../common/util';
import { openContextMenu } from './contextMenu';
import cancelDragOverAndEnter from './dragEventHandlers';

interface TagUISetupParameters {
  saveButton: JQuery<HTMLElement>;
  tagFields: {
    trackTitle: JQuery<HTMLElement>;
    trackArtist: JQuery<HTMLElement>;
    trackNumber: JQuery<HTMLElement>;
    albumTitle: JQuery<HTMLElement>;
    albumArtist: JQuery<HTMLElement>;
    year: JQuery<HTMLElement>;
    albumArt: JQuery<HTMLElement>;
  };
}

let tagUIParams: TagUISetupParameters;

function setupTagUI(params: TagUISetupParameters) {
  tagUIParams = params;

  params.saveButton.on('click', (event: JQuery.ClickEvent) => {
    event.preventDefault();
    ipcRenderer.send(IpcEvents.rendererRequestSaveMeta);
  });

  params.tagFields.albumArt.on('mouseup', (event: JQuery.MouseUpEvent) => {
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

  params.tagFields.albumArt.on('dragenter', cancelDragOverAndEnter);
  params.tagFields.albumArt.on('dragover', cancelDragOverAndEnter);

  params.tagFields.albumArt.on('drop', (event: JQuery.DropEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.originalEvent && event.originalEvent.dataTransfer) {
      const file = event.originalEvent.dataTransfer.files[0];
      file.arrayBuffer().then((buffer) => {
        ipcRenderer.send(IpcEvents.rendererAlbumArtReceived, file.name, buffer);
      });
    }
  });

  params.tagFields.trackTitle.on('blur', (event: JQuery.BlurEvent) =>
    ipcRenderer.send(IpcEvents.rendererTagTitleUpdated, $(event.target).val())
  );
  params.tagFields.trackArtist.on('blur', (event: JQuery.BlurEvent) =>
    ipcRenderer.send(IpcEvents.rendererTagArtistUpdated, $(event.target).val())
  );
  params.tagFields.trackNumber.on('blur', (event: JQuery.BlurEvent) =>
    ipcRenderer.send(IpcEvents.rendererTagTrackUpdated, $(event.target).val())
  );
  params.tagFields.albumTitle.on('blur', (event: JQuery.BlurEvent) =>
    ipcRenderer.send(IpcEvents.rendererTagAlbumUpdated, $(event.target).val())
  );
  params.tagFields.albumArtist.on('blur', (event: JQuery.BlurEvent) =>
    ipcRenderer.send(
      IpcEvents.rendererTagAlbumArtistUpdated,
      $(event.target).val()
    )
  );
  params.tagFields.year.on('blur', (event: JQuery.BlurEvent) =>
    ipcRenderer.send(IpcEvents.rendererTagYearUpdated, $(event.target).val())
  );

  ipcRenderer.on(
    IpcEvents.renderMeta,
    (event: IpcRendererEvent, meta: NodeID3.Tags) => {
      params.tagFields.trackTitle.val(meta.title as string);
      params.tagFields.trackArtist.val(meta.artist as string);
      params.tagFields.trackNumber.val(meta.trackNumber as string);
      params.tagFields.albumTitle.val(meta.album as string);
      params.tagFields.albumArtist.val(meta.performerInfo as string);
      params.tagFields.year.val(meta.year as string);

      if (meta.image) {
        const albumCover = meta.image as NodeID3Image;
        if (albumCover.imageBuffer) {
          const base64String = arrayBufferToBase64(albumCover.imageBuffer);
          setAlbumArt(`data:${albumCover.mime};base64,${base64String}`);
        } else params.tagFields.albumArt.html('');
      } else params.tagFields.albumArt.html('');
    }
  );

  ipcRenderer.on(
    IpcEvents.renderAlbumArt,
    (event: IpcRendererEvent, albumArt: NodeID3Image) => {
      if (albumArt.imageBuffer) {
        const base64String = arrayBufferToBase64(albumArt.imageBuffer);
        setAlbumArt(`data:${albumArt.mime};base64,${base64String}`);
      } else params.tagFields.albumArt.html('');
    }
  );

  function setAlbumArt(src: string) {
    params.tagFields.albumArt.html(`<img src="${src}" alt="Album art" />`);
  }
}

function updateTrackTitle(value: string) {
  tagUIParams.tagFields.trackTitle.val(value);
  ipcRenderer.send(IpcEvents.rendererTagTitleUpdated, value);
}

function updateTrackArtist(value: string) {
  tagUIParams.tagFields.trackArtist.val(value);
  ipcRenderer.send(IpcEvents.rendererTagArtistUpdated, value);
}

function updateAlbumArt(buffer: Buffer, name: string) {
  ipcRenderer.send(IpcEvents.rendererAlbumArtReceived, name, buffer);
}

export { setupTagUI, updateTrackTitle, updateTrackArtist, updateAlbumArt };
