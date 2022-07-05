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

    const supportedFile = getSupportedFileFomPath(filePath);

    mainWindow.webContents.send(IpcEvents.main.has.approvedFile, supportedFile);

    loadedFiles.set(filePath, supportedFile);
  }

  ipcMain.on(
    IpcEvents.renderer.has.receivedFile,
    (event: IpcMainEvent, filePath: string) => {
      (async () => {
        try {
          await addFile(filePath);
        } catch (err) {
          // eslint-disable-next-line no-empty
        }
      })().catch(() => {});
    },
  );

  ipcMain.on(
    IpcEvents.renderer.wants.toRemoveFile,
    (event: IpcMainEvent, filePath: string) => {
      if (loadedFiles.has(filePath)) {
        loadedFiles.delete(filePath);
        event.sender.send(
          IpcEvents.main.has.updatedFiles,
          Array.from(loadedFiles.values()),
        );
      } else {
        // Requesting to remove file that is not registered
      }
    },
  );

  ipcMain.on(IpcEvents.renderer.wants.toRefresh.files, (event: IpcMainEvent) => {
    event.sender.send(
      IpcEvents.main.has.updatedFiles,
      Array.from(loadedFiles.values()),
    );
  });

  /**
   * File selection
   */
  let selectedFiles: string[] = [];

  // Select file
  ipcMain.on(
    IpcEvents.renderer.wants.toSelectFile,
    (event: IpcMainEvent, path: string) => {
      selectedFiles = [path];
      event.sender.send(IpcEvents.main.has.updatedSelection, selectedFiles);
    },
  );

  // toggle file
  ipcMain.on(
    IpcEvents.renderer.wants.toToggleFile,
    (event: IpcMainEvent, path: string) => {
      const i = selectedFiles.indexOf(path);
      if (i > -1) selectedFiles = selectedFiles.filter((p) => p !== path);
      else selectedFiles = [...selectedFiles, path];
      event.sender.send(IpcEvents.main.has.updatedSelection, selectedFiles);
    },
  );

  ipcMain.on(IpcEvents.renderer.wants.toRefresh.selection, (event: IpcMainEvent) => {
    event.sender.send(IpcEvents.main.has.updatedSelection, selectedFiles);
  });
}

export default setupFilesProcess;
