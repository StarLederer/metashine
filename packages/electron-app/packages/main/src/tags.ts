import { ipcMain } from 'electron';
import type { IpcMainEvent } from 'electron';

import * as mm2 from '@metashine/native-addon';

import * as NodeID3 from 'node-id3';

import IpcEvents from '../../common/IpcEvents';
import type NodeID3Image from '../../common/NodeID3Image';
import type { ISuppotedFile } from '../../common/SupportedFile';

function setupTagsProcess(loadedFiles: Map<string, ISuppotedFile>) {
  let currentFiles: string[] = [];
  let currentMeta: NodeID3.Tags = {};

  ipcMain.on(
    IpcEvents.renderer.has.updated.tag.title,
    (event: IpcMainEvent, value: string) => {
      currentMeta.title = value;
    },
  );
  ipcMain.on(
    IpcEvents.renderer.has.updated.tag.artist,
    (event: IpcMainEvent, value: string) => {
      currentMeta.artist = value;
    },
  );
  ipcMain.on(
    IpcEvents.renderer.has.updated.tag.track,
    (event: IpcMainEvent, value: string) => {
      currentMeta.trackNumber = value;
    },
  );
  ipcMain.on(
    IpcEvents.renderer.has.updated.tag.album,
    (event: IpcMainEvent, value: string) => {
      currentMeta.album = value;
    },
  );
  ipcMain.on(
    IpcEvents.renderer.has.updated.tag.albumArtist,
    (event: IpcMainEvent, value: string) => {
      currentMeta.performerInfo = value;
    },
  );
  ipcMain.on(
    IpcEvents.renderer.has.updated.tag.year,
    (event: IpcMainEvent, value: string) => {
      currentMeta.year = value;
    },
  );

  ipcMain.on(
    IpcEvents.renderer.wants.toSelectFile,
    (event: IpcMainEvent, filePath: string) => {
      // Clear selectrion and select the file
      currentFiles = [];
      currentFiles.push(filePath);

      // Load tags
      currentMeta = {};

      try {
        const tag = mm2.loadTag(filePath);
        if (tag.TYER) currentMeta.year = tag.TYER;
        if (tag.TPE2) currentMeta.performerInfo = tag.TPE2;
        if (tag.TALB) currentMeta.album = tag.TALB;
        if (tag.TRCK) currentMeta.trackNumber = tag.TRCK;
        if (tag.TPE1) currentMeta.artist = tag.TPE1;
        if (tag.TIT2) currentMeta.title = tag.TIT2;

        if (tag.APIC) {
          currentMeta.image = {
            mime: tag.APIC.MIMEType,
            type: {
              id: 3,
              name: tag.APIC.pictureType,
            },
            description: tag.APIC.description,
            imageBuffer: tag.APIC.data,
          } as NodeID3Image;
        }

        // Request tag section update
        event.sender.send(IpcEvents.main.wants.toRender.meta, currentMeta);
      } catch (error) {
        event.sender.send(IpcEvents.main.wants.toRender.error, error);
      }

      // Request render update
      event.sender.send(IpcEvents.main.has.updatedSelection, currentFiles);
    },
  );

  ipcMain.on(
    IpcEvents.renderer.wants.toToggleFile,
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
        event.sender.send(IpcEvents.main.wants.toRender.meta, currentMeta);
      }

      // Request render update
      event.sender.send(IpcEvents.main.has.updatedSelection, currentFiles);
    },
  );

  ipcMain.on(IpcEvents.renderer.wants.toSaveMeta, (event: IpcMainEvent) => {
    currentFiles.forEach((filePath) => {
      const supportedFile = loadedFiles.get(filePath);
      if (supportedFile) {
        const result = NodeID3.update(currentMeta, supportedFile.path);
        if (result === true) {
          // success
        } else {
          event.sender.send(IpcEvents.main.wants.toRender.error, result);
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
    IpcEvents.renderer.has.receivedPicture,
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

      event.sender.send(IpcEvents.main.wants.toRender.albumArt, frontCover);
    },
  );

  ipcMain.on(IpcEvents.renderer.wants.toRemoveAlbumArt, (event: IpcMainEvent) => {
    currentMeta.image = getNewFrontCover();
    event.sender.send(IpcEvents.main.wants.toRender.albumArt, currentMeta.image);
  });
}

export default setupTagsProcess;
