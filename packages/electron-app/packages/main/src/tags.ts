import { ipcMain } from 'electron';
import type { IpcMainEvent } from 'electron';

import { loadTag } from '@metashine/native-addon';
import type { ID3Tag, APICFrame } from '@metashine/native-addon';

import IpcEvents from '../../common/IpcEvents';
import type { ISuppotedFile } from '../../common/SupportedFile';

function setupTagsProcess(loadedFiles: Map<string, ISuppotedFile>) {
  let currentFiles: string[] = [];
  let currentMeta: ID3Tag = {};

  ipcMain.on(
    IpcEvents.renderer.has.updated.id3tag,
    (event: IpcMainEvent, value: ID3Tag) => {
      Object.assign(currentMeta, value);
      event.sender.send(IpcEvents.main.wants.toRender.meta, currentMeta);
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
        currentMeta = loadTag(filePath);

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

  function getNewFrontCover(): APICFrame {
    return {
      MIMEType: '',
      pictureType: '3',
      description: '',
      data: undefined,
    };
  }

  ipcMain.on(
    IpcEvents.renderer.has.receivedPicture,
    (event: IpcMainEvent, name: string, buffer: ArrayBuffer) => {
      const picture = currentMeta.APIC
        ? currentMeta.APIC
        : getNewFrontCover();

      const fileNameLowerCase = name.toLowerCase();
      if (fileNameLowerCase.endsWith('png')) {
        picture.MIMEType = 'image/png';
      } else if (
        fileNameLowerCase.endsWith('jpg')
        || fileNameLowerCase.endsWith('jpeg')
      ) {
        picture.MIMEType = 'image/jpeg';
      } else return;

      picture.data = Buffer.from(buffer);

      currentMeta.APIC = picture;

      event.sender.send(IpcEvents.main.wants.toRender.meta, currentMeta);
    },
  );

  ipcMain.on(IpcEvents.renderer.wants.toRemoveAlbumArt, (event: IpcMainEvent) => {
    currentMeta.APIC = getNewFrontCover();
    event.sender.send(IpcEvents.main.wants.toRender.meta, currentMeta);
  });
}

export default setupTagsProcess;
