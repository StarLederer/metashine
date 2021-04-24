import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import * as path from 'path';
import { format as formatUrl } from 'url';
import * as mm from 'music-metadata';
import * as NodeID3 from 'node-id3';

import { IpcEvents } from '../common/IpcEvents';
import { SupportedFormat } from '../common/SupportedFormats';
import { NodeID3Image } from '../common/NodeID3Image';
import { ISuppotedFile } from '../common/SupportedFile';
import { FileCategory } from '../common/FileCategory';

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 1200,
    minWidth: 800,
    minHeight: 200,
    frame: false,
    icon: './src/assets/app-icon.png',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

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

  // window.on('closed', () => {
  //   mainWindow = null;
  // });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

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
      event.sender.send(IpcEvents.mainRequestRemoveFileDOM, filePath);
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
      mainWindow.webContents.send(IpcEvents.mainRequestRenderError, error);
    });

  return supportedFile;
}

//
//
// Tags
let currentFilePath: string;
let currentFileFormat: SupportedFormat;
let currentMeta = getNewMeta();

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
  IpcEvents.rendererRequestLoadMeta,
  (event: IpcMainEvent, filePath: string) => {
    if (filePath == currentFilePath) return;

    currentFilePath = filePath;
    currentMeta = getNewMeta();
    switch (path.extname(filePath.toLowerCase()).substring(1)) {
      case SupportedFormat.MP3:
        currentFileFormat = SupportedFormat.MP3;
        break;
      case SupportedFormat.WAV:
        currentFileFormat = SupportedFormat.WAV;
        break;
    }

    mm.parseFile(filePath)
      .then((value) => {
        currentMeta.title = value.common.title;
        currentMeta.artist = value.common.artist;
        if (value.common.track.no)
          currentMeta.trackNumber = value.common.track.no.toString();
        // currentMeta.trackNumber = "69";
        currentMeta.album = value.common.album;
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
        } else currentMeta.image = getNewFrontCover();

        event.sender.send(IpcEvents.mainRequestRenderMeta, currentMeta, value);
      })
      .catch((error: Error) => {
        event.sender.send(IpcEvents.mainRequestRenderError, error);
      });
  }
);

ipcMain.on(IpcEvents.rendererRequestSaveMeta, (event: IpcMainEvent) => {
  if (currentFileFormat == SupportedFormat.MP3) {
    const result = NodeID3.update(currentMeta, currentFilePath);
    if (result === true) {
      // success
    } else {
      event.sender.send(IpcEvents.mainRequestRenderError, result as Error);
    }
  } else if (currentFileFormat == SupportedFormat.WAV) {
    event.sender.send(
      IpcEvents.mainRequestRenderError,
      new Error(
        'Saving WAVs is not supported and there currently is no plan to add support for that. Please encode your music in MP3'
      )
    );
  }
});

ipcMain.on(
  IpcEvents.rendererAlbumArtReceived,
  (event: IpcMainEvent, name: string, buffer: ArrayBuffer) => {
    const frontCover = currentMeta.image as NodeID3Image;

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

    event.sender.send(IpcEvents.mainRequestRenderAlbumArt, frontCover);
  }
);

ipcMain.on(IpcEvents.rendererRequestRemoveAlbumArt, (event: IpcMainEvent) => {
  currentMeta.image = getNewFrontCover();
  event.sender.send(IpcEvents.mainRequestRenderAlbumArt, currentMeta.image);
});

function getNewMeta(): NodeID3.Tags {
  return {
    image: getNewFrontCover(),
  };
}

function getNewFrontCover(): NodeID3Image {
  return {
    mime: '',
    type: {
      id: 3,
      name: '',
    },
    description: '',
    imageBuffer: (null as unknown) as Buffer,
  };
}

//
//
// Window controls
ipcMain.on(IpcEvents.rendererWindowCollaps, () => mainWindow.minimize());
ipcMain.on(IpcEvents.rendererWindowToggleSize, () => {
  if (!mainWindow.isMaximized()) {
    mainWindow.maximize();
  } else {
    mainWindow.unmaximize();
  }
});
ipcMain.on(IpcEvents.rendererWindowClose, () => mainWindow.close());
