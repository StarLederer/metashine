import { app, BrowserWindow, IpcMain, ipcMain, IpcRendererEvent } from "electron";
import { IpcMainEvent } from "electron/main";
import path from "path";
import * as mm from "music-metadata";
import * as NodeID3 from "node-id3";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	// eslint-disable-line global-require
	app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = (): void => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 1200,
		minWidth: 800,
		minHeight: 200,
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
	mainWindow.webContents.openDevTools();
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

//
//
// Files
ipcMain.on("file-received", (event: IpcMainEvent, file: File) => {
	const outFile = {
		name: path.basename(file.path, path.extname(file.path)),
		type: path.extname(file.path.toLowerCase()).substring(1),
		location: path.dirname(file.path),
		path: file.path,
		meta: {},
	};

	if (file.name.toLowerCase().endsWith("mp3")) {
		mm.parseFile(file.path)
			.then((value) => {
				outFile.meta = value;
				event.sender.send("file-approved", outFile);
			})
			.catch((error: Error) => {
				console.error(error.message);
			});
	}
});

//
//
// Tags
let currentFilePath: string;
let currentMeta = getNewMeta();

ipcMain.on("load-meta", (event: IpcMainEvent, path: string) => {
	currentFilePath = path;
	currentMeta = getNewMeta();

	mm.parseFile(path)
		.then((value) => {
			currentMeta.title = value.common.title;
			currentMeta.artist = value.common.artist;
			if (value.common.track.no) currentMeta.trackNumber = value.common.track.no.toString();
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
				};
			} else currentMeta.image = getNewFrontCover();

			event.sender.send("render-meta", currentMeta);
		})
		.catch((error) => {
			console.error(error.message);
		});
});

ipcMain.on("save-meta", (event: IpcMainEvent, meta) => {
	const tags: NodeID3.Tags = {
		// const tags = {
		title: meta.title,
		artist: meta.artist,
		trackNumber: meta.trackNumber,
		album: meta.album,
		performerInfo: meta.performerInfo,
		year: meta.year,
		image: null as any,
	};

	if (currentMeta.image) {
		const currentCover = currentMeta.image as any;

		tags.image = {
			mime: currentCover.mime,
			type: {
				id: currentCover.type.id,
				name: currentCover.type.name,
			},
			description: currentCover.description,
			imageBuffer: currentCover.imageBuffer,
		};
	}

	try {
		console.log(tags);
		NodeID3.update(tags, currentFilePath);
	} catch (error) {
		console.error(error);
	}
});

ipcMain.on("album-art-received", (event: IpcMainEvent, name: string, buffer: ArrayBuffer) => {
	const frontCover = currentMeta.image as any;

	const fileNameLowerCase = name.toLowerCase();
	if (fileNameLowerCase.endsWith("png")) {
		frontCover.mime = "image/png";
	} else if (fileNameLowerCase.endsWith("jpg") || fileNameLowerCase.endsWith("jpeg")) {
		frontCover.mime = "image/jpeg";
	} else return;

	frontCover.imageBuffer = Buffer.from(buffer);
	currentMeta.image = frontCover;

	event.sender.send("render-album-art", frontCover.mime, frontCover.imageBuffer);
});

function getNewMeta(): NodeID3.Tags {
	return {
		image: getNewFrontCover(),
	};
}

function getNewFrontCover() {
	return {
		mime: "",
		type: {
			id: 3,
			name: "",
		},
		description: "",
		imageBuffer: null as Buffer,
	};
}

//
//
// Window controls
ipcMain.on("window-collapse", () => mainWindow.minimize());
ipcMain.on("window-toggle-size", () => {
	if (!mainWindow.isMaximized()) {
		mainWindow.maximize();
	} else {
		mainWindow.unmaximize();
	}
});
ipcMain.on("window-close", () => mainWindow.close());
