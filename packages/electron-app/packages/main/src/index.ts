import {
  app, BrowserWindow, shell, ipcMain,
} from 'electron';
import { join } from 'path';

import IpcEvents from '../../common/IpcEvents';
import type { ISuppotedFile } from '../../common/SupportedFile';
import setUpAssistantProcess from './assistant';
import setupFilesProcess from './files';
import setupTagsProcess from './tags';

const isSingleInstance = app.requestSingleInstanceLock();
const isDevelopment = process.env.MODE === 'development';

if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}

app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

const loadedFiles = new Map<string, ISuppotedFile>();

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false, // Use 'ready-to-show' event to show window
    webPreferences: {
      nativeWindowOpen: true,
      preload: join(__dirname, '../../preload/dist/index.js'),
    },
    frame: false,
  });

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();

    if (isDevelopment) {
      // mainWindow?.webContents.openDevTools();
    }
  });

  /**
   * External hyperlinks open in the default browser.
   *
   * @see https://stackoverflow.com/a/67409223
   */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  const pageUrl = isDevelopment && process.env.VITE_DEV_SERVER_URL !== undefined
    ? process.env.VITE_DEV_SERVER_URL
    : new URL(
      '../renderer/dist/index.html',
      `file://${__dirname}`,
    ).toString();

  // Processes
  setupTagsProcess(loadedFiles);
  setupFilesProcess(mainWindow, loadedFiles);
  setUpAssistantProcess();

  await mainWindow.loadURL(pageUrl);
};

app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(createWindow)
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Failed create window:', e);
  });

// Auto-updates
if (!isDevelopment) {
  app
    .whenReady()
    .then(() => import('electron-updater'))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Failed check updates:', e);
    });
}

//
//
// Window controls
ipcMain.on(IpcEvents.renderer.wants.window.toCollapse, () => mainWindow?.minimize());
ipcMain.on(IpcEvents.renderer.wants.window.toToggleSize, () => {
  if (!mainWindow?.isMaximized()) {
    mainWindow?.maximize();
  } else {
    mainWindow?.unmaximize();
  }
});
ipcMain.on(IpcEvents.renderer.wants.window.toClose, () => mainWindow?.close());
