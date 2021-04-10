import { app, BrowserWindow, IpcMain, ipcMain, IpcRendererEvent } from "electron";
import { IpcMainEvent } from "electron/main";
import path from "path";
import * as mm from "music-metadata";
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	// eslint-disable-line global-require
	app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = (): void => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		height: 1200,
		width: 1000,
		frame: false,
		icon: "./src/assets/app-icon.png",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	// and load the index.html of the app.
	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

	// Open the DevTools.
	//mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// Event handler for asynchronous incoming messages
ipcMain.on("file-received", (event: IpcMainEvent, file) => {
	const outFile = {
		name: path.basename(file.path, path.extname(file.path)),
		type: path.extname(file.path.toLowerCase()).substring(1),
		location: path.dirname(file.path),
		meta: {},
	};

	// console.log(outFile.name);
	// console.log(outFile.type);
	// console.log(outFile.location);

	if (file.name.endsWith("mp3")) {
		mm.parseFile(file.path)
			.then((value) => {
				outFile.meta = value;
				event.sender.send("file-approved", outFile);
			})
			.catch((error) => {
				console.error(error.message);
			});
	}
});

// window controls
ipcMain.on("window-collapse", () => mainWindow.minimize());
ipcMain.on("window-toggle-size", () => {
	if (!mainWindow.isMaximized()) {
		mainWindow.maximize();
	} else {
		mainWindow.unmaximize();
	}
});
ipcMain.on("window-close", () => mainWindow.close());
