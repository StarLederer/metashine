import fs from 'fs';
import path from 'path';
import { format as formatUrl } from 'url';

import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { autoUpdater } from 'electron-updater';

import * as mm from 'music-metadata';
import * as NodeID3 from 'node-id3';

import { IpcEvents } from '../common/IpcEvents';
import { SupportedFormat } from '../common/SupportedFormats';
import { NodeID3Image } from '../common/NodeID3Image';
import { ISuppotedFile } from '../common/SupportedFile';
import { FileCategory } from '../common/FileCategory';
import { setUpAssistantProcess } from './assistantProcess';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Window common
function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 200,
    title: 'Metashine',
    frame: false,
    icon: './src/assets/app-icon.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  window.removeMenu();

  if (isDevelopment) {
    window.webContents.openDevTools();
  } else {
    autoUpdater.allowPrerelease = true;
    autoUpdater.checkForUpdatesAndNotify();
  }

  return window;
}

//
//
// Main window
function createMainWindow() {
  const window = createWindow();
  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      })
    );
  }
  return window;
}

// Global references to Metashine windows
let mainWindow: BrowserWindow;
// let assistantWindow: BrowserWindow;

// Quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// Create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});

//
//
// Assistant
setUpAssistantProcess();

//
//
// Files
const fileList: Array<string> = [];

ipcMain.on(
  IpcEvents.rendererFileReceived,
  (event: IpcMainEvent, filePath: string) => {
    tryAddFile(filePath);
  }
);

ipcMain.on(
  IpcEvents.rendererRequestRemoveFile,
  (event: IpcMainEvent, filePath: string) => {
    const i = fileList.indexOf(filePath);
    if (i >= 0) {
      fileList.splice(i, 1);
      event.sender.send(IpcEvents.renderNoFileDOM, filePath);
    } else {
      // Requesting to remove file that is not registered
    }
  }
);

function tryAddFile(filePath: string): boolean {
  if (fileList.includes(filePath)) return false;
  if (fs.lstatSync(filePath).isDirectory()) return false;

  const supportedFile = getSupportedFileFomPath(filePath);

  let category: FileCategory;
  switch (supportedFile.format) {
    case SupportedFormat.MP3:
      category = FileCategory.Supported;
      break;
    case SupportedFormat.WAV:
      category = FileCategory.Readonly;
      break;
    case SupportedFormat.Unsupported:
      category = FileCategory.Unsupported;
      break;
  }

  mainWindow.webContents.send(
    IpcEvents.mainFileApproved,
    supportedFile,
    category
  );

  fileList.push(filePath);

  return true;
}

function getSupportedFileFomPath(filePath: string): ISuppotedFile {
  const supportedFile: ISuppotedFile = {
    name: path.basename(filePath, path.extname(filePath)),
    format: SupportedFormat.Unsupported,
    location: path.dirname(filePath),
    path: filePath,
    meta: null,
  };

  // Format
  const lowerCaseExtname = path.extname(filePath).toLowerCase();
  if (lowerCaseExtname.endsWith('mp3'))
    supportedFile.format = SupportedFormat.MP3;
  else if (lowerCaseExtname.endsWith('wav'))
    supportedFile.format = SupportedFormat.WAV;

  if (supportedFile.format == SupportedFormat.Unsupported) return supportedFile;

  // Metadata
  mm.parseFile(filePath)
    .then((value: mm.IAudioMetadata) => {
      supportedFile.meta = value;
    })
    .catch((error: Error) => {
      mainWindow.webContents.send(IpcEvents.renderError, error);
    });

  return supportedFile;
}

//
//
// Tags
let currentFiles: string[] = [];
let currentMeta: NodeID3.Tags = {};

ipcMain.on(
  IpcEvents.rendererTagTitleUpdated,
  (event: IpcMainEvent, value: string) => (currentMeta.title = value)
);
ipcMain.on(
  IpcEvents.rendererTagArtistUpdated,
  (event: IpcMainEvent, value: string) => (currentMeta.artist = value)
);
ipcMain.on(
  IpcEvents.rendererTagTrackUpdated,
  (event: IpcMainEvent, value: string) => (currentMeta.trackNumber = value)
);
ipcMain.on(
  IpcEvents.rendererTagAlbumUpdated,
  (event: IpcMainEvent, value: string) => (currentMeta.album = value)
);
ipcMain.on(
  IpcEvents.rendererTagAlbumArtistUpdated,
  (event: IpcMainEvent, value: string) => (currentMeta.performerInfo = value)
);
ipcMain.on(
  IpcEvents.rendererTagYearUpdated,
  (event: IpcMainEvent, value: string) => (currentMeta.year = value)
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
        if (value.common.track.no)
          currentMeta.trackNumber = value.common.track.no.toString();
        if (value.common.album) currentMeta.album = value.common.album;
        if (value.common.albumartist)
          currentMeta.performerInfo = value.common.albumartist;
        if (value.common.year) currentMeta.year = value.common.year.toString();

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
  }
);

ipcMain.on(
  IpcEvents.rendererSelectionFileToggled,
  (event: IpcMainEvent, filePath: string) => {
    const i = currentFiles.indexOf(filePath);

    // Remove file from selectrion
    if (i > -1) {
      currentFiles.splice(i, 1);
    }
    // Add file to selection
    else {
      currentFiles.push(filePath);

      // Clear current tags
      currentMeta = {};
      event.sender.send(IpcEvents.renderMeta, currentMeta);
    }

    // Request render update
    event.sender.send(IpcEvents.mainSelectionUpdated, currentFiles);
  }
);

ipcMain.on(IpcEvents.rendererRequestSaveMeta, (event: IpcMainEvent) => {
  currentFiles.forEach((filePath) => {
    const supportedFile = getSupportedFileFomPath(filePath);

    if (supportedFile.format == SupportedFormat.MP3) {
      const result = NodeID3.update(currentMeta, supportedFile.path);
      if (result === true) {
        // success
      } else {
        event.sender.send(IpcEvents.renderError, result as Error);
      }
    } else if (supportedFile.format == SupportedFormat.WAV) {
      event.sender.send(
        IpcEvents.renderError,
        new Error(`
          Cannot save ${filePath}!\n
          Saving WAVs is not supported and there currently is no plan to add support for that. Please encode your music in MP3
        `)
      );
    }
  });
});

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
      fileNameLowerCase.endsWith('jpg') ||
      fileNameLowerCase.endsWith('jpeg')
    ) {
      frontCover.mime = 'image/jpeg';
    } else return;

    frontCover.imageBuffer = Buffer.from(buffer);
    currentMeta.image = frontCover;

    event.sender.send(IpcEvents.renderAlbumArt, frontCover);
  }
);

ipcMain.on(IpcEvents.rendererRequestRemoveAlbumArt, (event: IpcMainEvent) => {
  currentMeta.image = getNewFrontCover();
  event.sender.send(IpcEvents.renderAlbumArt, currentMeta.image);
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

//
//
// Window controls
ipcMain.on(IpcEvents.rendererWindowCollapse, () => mainWindow.minimize());
ipcMain.on(IpcEvents.rendererWindowToggleSize, () => {
  if (!mainWindow.isMaximized()) {
    mainWindow.maximize();
  } else {
    mainWindow.unmaximize();
  }
});
ipcMain.on(IpcEvents.rendererWindowClose, () => mainWindow.close());
