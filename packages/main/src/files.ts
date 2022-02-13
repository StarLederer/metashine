import * as fs from 'fs/promises';

import { ipcMain } from 'electron';
import type { IpcMainEvent, BrowserWindow } from 'electron';
import IpcEvents from '../../common/IpcEvents';
import type { ISuppotedFile } from '../../common/SupportedFile';
import { getSupportedFileFomPath } from '../../common/SupportedFile';

function setupFilesProcess(mainWindow: BrowserWindow, loadedFiles: Map<string, ISuppotedFile>) {
  async function addFile(filePath: string) {
    if (loadedFiles.has(filePath)) throw new Error('File already added');
    if (!(await fs.stat(filePath)).isFile()) { throw new Error('Path does not point to a file'); }

    const supportedFile = await getSupportedFileFomPath(filePath);

    mainWindow.webContents.send(IpcEvents.mainFileApproved, supportedFile);

    loadedFiles.set(filePath, supportedFile);
  }

  ipcMain.on(
    IpcEvents.rendererFileReceived,
    async (event: IpcMainEvent, filePath: string) => {
      try {
        await addFile(filePath);
      } catch (err) {
        // eslint-disable-next-line no-empty
      }
    },
  );

  ipcMain.on(
    IpcEvents.rendererRequestRemoveFile,
    (event: IpcMainEvent, filePath: string) => {
      if (loadedFiles.has(filePath)) {
        loadedFiles.delete(filePath);
        event.sender.send(
          IpcEvents.mainFilesUpdated,
          Array.from(loadedFiles.values()),
        );
      } else {
        // Requesting to remove file that is not registered
      }
    },
  );

  ipcMain.on(IpcEvents.rendererRequestUpdateFiles, (event: IpcMainEvent) => {
    event.sender.send(
      IpcEvents.mainFilesUpdated,
      Array.from(loadedFiles.values()),
    );
  });

  /**
   * File selection
   */
  let selectedFiles: string[] = [];

  // Select file
  ipcMain.on(
    IpcEvents.rendererSelectionFileSelected,
    (event: IpcMainEvent, path: string) => {
      selectedFiles = [path];
      event.sender.send(IpcEvents.mainSelectionUpdated, selectedFiles);
    },
  );

  // toggle file
  ipcMain.on(
    IpcEvents.rendererSelectionFileToggled,
    (event: IpcMainEvent, path: string) => {
      const i = selectedFiles.indexOf(path);
      if (i > -1) selectedFiles = selectedFiles.filter((p) => p !== path);
      else selectedFiles = [...selectedFiles, path];
      event.sender.send(IpcEvents.mainSelectionUpdated, selectedFiles);
    },
  );
}

export default setupFilesProcess;
