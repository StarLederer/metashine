import { ipcMain } from 'electron';
import type { IpcMainEvent } from 'electron';

import * as mm from 'music-metadata';
import * as NodeID3 from 'node-id3';

import IpcEvents from '../../common/IpcEvents';
import SupportedFormat from '../../common/SupportedFormats';
import type NodeID3Image from '../../common/NodeID3Image';
import type { ISuppotedFile } from '../../common/SupportedFile';

function setupTagsProcess(loadedFiles: Map<string, ISuppotedFile>) {
  let currentFiles: string[] = [];
  let currentMeta: NodeID3.Tags = {};

  ipcMain.on(
    IpcEvents.rendererTagTitleUpdated,
    (event: IpcMainEvent, value: string) => {
      currentMeta.title = value;
    },
  );
  ipcMain.on(
    IpcEvents.rendererTagArtistUpdated,
    (event: IpcMainEvent, value: string) => {
      currentMeta.artist = value;
    },
  );
  ipcMain.on(
    IpcEvents.rendererTagTrackUpdated,
    (event: IpcMainEvent, value: string) => {
      currentMeta.trackNumber = value;
    },
  );
  ipcMain.on(
    IpcEvents.rendererTagAlbumUpdated,
    (event: IpcMainEvent, value: string) => {
      currentMeta.album = value;
    },
  );
  ipcMain.on(
    IpcEvents.rendererTagAlbumArtistUpdated,
    (event: IpcMainEvent, value: string) => {
      currentMeta.performerInfo = value;
    },
  );
  ipcMain.on(
    IpcEvents.rendererTagYearUpdated,
    (event: IpcMainEvent, value: string) => {
      currentMeta.year = value;
    },
  );

  ipcMain.on(
    IpcEvents.rendererSelectionFileSelected,
    (event: IpcMainEvent, filePath: string) => {
      // Clear selectrion and select the file
      currentFiles = [];
      currentFiles.push(filePath);

      // Load tags
      currentMeta = {};
      mm.parseFile(filePath)
        .then((value) => {
          if (value.common.title) currentMeta.title = value.common.title;
          if (value.common.artist) currentMeta.artist = value.common.artist;
          if (value.common.track.no) { currentMeta.trackNumber = value.common.track.no.toString(); }
          if (value.common.album) currentMeta.album = value.common.album;
          if (value.common.albumartist) { currentMeta.performerInfo = value.common.albumartist; }
          if (value.common.year) { currentMeta.year = value.common.year.toString(); }

          const frontCover = mm.selectCover(value.common.picture);
          if (frontCover) {
            currentMeta.image = {
              mime: frontCover.format,
              type: {
                id: 3,
                name: frontCover.name,
              },
              description: frontCover.description,
              imageBuffer: frontCover.data,
            } as NodeID3Image;
          }

          // Request tag section update
          event.sender.send(IpcEvents.renderMeta, currentMeta);
        })
        .catch((error: Error) => {
          event.sender.send(IpcEvents.renderError, error);
        });

      // Request render update
      event.sender.send(IpcEvents.mainSelectionUpdated, currentFiles);
    },
  );

  ipcMain.on(
    IpcEvents.rendererSelectionFileToggled,
    (event: IpcMainEvent, filePath: string) => {
      const i = currentFiles.indexOf(filePath);

      if (i > -1) {
        // Remove file from selectrion
        currentFiles.splice(i, 1);
      } else {
        // Add file to selection
        currentFiles.push(filePath);

        // Clear current tags
        currentMeta = {};
        event.sender.send(IpcEvents.renderMeta, currentMeta);
      }

      // Request render update
      event.sender.send(IpcEvents.mainSelectionUpdated, currentFiles);
    },
  );

  ipcMain.on(IpcEvents.rendererRequestSaveMeta, (event: IpcMainEvent) => {
    currentFiles.forEach(async (filePath) => {
      const supportedFile = loadedFiles.get(filePath);
      if (supportedFile) {
        if (supportedFile.format === SupportedFormat.MP3) {
          const result = NodeID3.update(currentMeta, supportedFile.path);
          if (result === true) {
            // success
          } else {
            event.sender.send(IpcEvents.renderError, result);
          }
        } else if (supportedFile.format === SupportedFormat.WAV) {
          event.sender.send(
            IpcEvents.renderError,
            new Error(`
              Cannot save ${filePath}!\n
              Saving WAVs is not supported and there currently is no plan to add support for that. Please encode your music in MP3
            `),
          );
        }
      }
    });
  });

  function getNewFrontCover(): NodeID3Image {
    return {
      mime: '',
      type: {
        id: 3,
        name: '',
      },
      description: '',
      imageBuffer: null as unknown as Buffer,
    };
  }

  ipcMain.on(
    IpcEvents.rendererAlbumArtReceived,
    (event: IpcMainEvent, name: string, buffer: ArrayBuffer) => {
      const frontCover = currentMeta.image
        ? (currentMeta.image as NodeID3Image)
        : getNewFrontCover();

      const fileNameLowerCase = name.toLowerCase();
      if (fileNameLowerCase.endsWith('png')) {
        frontCover.mime = 'image/png';
      } else if (
        fileNameLowerCase.endsWith('jpg')
        || fileNameLowerCase.endsWith('jpeg')
      ) {
        frontCover.mime = 'image/jpeg';
      } else return;

      frontCover.imageBuffer = Buffer.from(buffer);
      currentMeta.image = frontCover;

      event.sender.send(IpcEvents.renderAlbumArt, frontCover);
    },
  );

  ipcMain.on(IpcEvents.rendererRequestRemoveAlbumArt, (event: IpcMainEvent) => {
    currentMeta.image = getNewFrontCover();
    event.sender.send(IpcEvents.renderAlbumArt, currentMeta.image);
  });
}

export default setupTagsProcess;
