import "./index.css";
import "./tags.css";
import "./files.css";
import { clipboard, ipcRenderer, IpcRendererEvent } from "electron";
import $ from "jquery";
import * as NodeID3 from "node-id3";
import { IpcEvents } from "./common/IpcEvents";

const ui = {
	windowControls: {
		close: $("#window-control-close"),
		toggleSize: $("#window-control-toggle-size"),
		collapse: $("#window-control-colapse"),
	},
	selctions: {
		tags: $("#tags-section"),
		files: $("#files-section"),
	},
	saveButton: $("#tags-save"),
	tagFileds: {
		trackTitle: $("#track-title"),
		trackArtist: $("#track-artist"),
		trackNumber: $("#track-number"),
		albumTitle: $("#album-title"),
		albumArtist: $("#album-artist"),
		year: $("#year"),
		albumArt: $("#album-art-input"),
	},
	fileList: $("#file-list"),
};

//
//
// Files
ui.selctions.files.on("dragenter dragover", (event) => {
	event.preventDefault();
	event.stopPropagation();
});
ui.selctions.files.on("drop", (event) => {
	event.preventDefault();
	event.stopPropagation();

	for (let i = 0; i < event.originalEvent.dataTransfer.files.length; ++i) {
		const f = event.originalEvent.dataTransfer.files[i];
		ipcRenderer.send(IpcEvents.rendererFileReceived, {
			path: f.path,
			name: f.name,
		});
	}
});

//
//
// Window controls
ui.windowControls.collapse.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send(IpcEvents.rendererWindowCollaps);
});
ui.windowControls.toggleSize.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send(IpcEvents.rendererWindowToggleSize);
});
ui.windowControls.close.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send(IpcEvents.rendererWindowClose);
});

//
//
// Tag UI
ui.saveButton.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();

	ipcRenderer.send(IpcEvents.rendererRequestSaveMeta, {
		title: ui.tagFileds.trackTitle.val(),
		artist: ui.tagFileds.trackArtist.val(),
		trackNumber: ui.tagFileds.trackNumber.val(),
		album: ui.tagFileds.albumTitle.val(),
		performerInfo: ui.tagFileds.albumArtist.val(),
		year: ui.tagFileds.year.val(),
	});
});

ui.tagFileds.albumArt.on("dragenter dragover", (event: JQuery.DragEvent) => {
	event.preventDefault();
	event.stopPropagation();
});
ui.tagFileds.albumArt.on("drop", (event: JQuery.DropEvent) => {
	event.preventDefault();
	event.stopPropagation();

	const file = event.originalEvent.dataTransfer.files[0];
	file.arrayBuffer().then((buffer) => {
		ipcRenderer.send(IpcEvents.rendererAlbumArtReceived, file.name, buffer);
	});
});
ui.tagFileds.albumArt.on("mouseup", (event: JQuery.MouseUpEvent) => {
	if (event.which == 3) {
		event.stopPropagation();

		const availableFormats = clipboard.availableFormats();
		if (availableFormats.includes("image/png") || availableFormats.includes("image/jpeg")) {
			ipcRenderer.send(IpcEvents.rendererAlbumArtReceived, ".png", clipboard.readImage().toPNG());
		}
	}
});

ipcRenderer.on(IpcEvents.mainRequestRenderMeta, (event: IpcRendererEvent, meta: NodeID3.Tags) => {
	ui.tagFileds.trackTitle.val(meta.title);
	ui.tagFileds.trackArtist.val(meta.artist);
	ui.tagFileds.trackNumber.val(meta.trackNumber);
	ui.tagFileds.albumTitle.val(meta.album);
	ui.tagFileds.albumArtist.val(meta.performerInfo);
	ui.tagFileds.year.val(meta.year);

	const albumCover = meta.image as any;
	if (albumCover.imageBuffer) {
		const base64String = _arrayBufferToBase64(albumCover.imageBuffer);
		setAlbumArt(`data:${albumCover.mime};base64,${base64String}`);
	} else ui.tagFileds.albumArt.html("");
});
ipcRenderer.on(IpcEvents.mainRequestRenderAlbumArt, (event: IpcRendererEvent, mime: string, buffer: Buffer) => {
	const base64String = _arrayBufferToBase64(buffer);
	setAlbumArt(`data:${mime};base64,${base64String}`);
});
function setAlbumArt(src: string) {
	ui.tagFileds.albumArt.html(`<img src="${src}" alt="Album art" />`);
}

//
//
// File UI
ipcRenderer.on(IpcEvents.mainFileApproved, (event: IpcRendererEvent, file) => {
	// console.log("adding file " + file.name + "...");

	const fileEntry = $(`
						<div class="row file-entry">
							<div>${file.name}</div>
							<div>${file.type}</div>
							<div>${file.location}</div>
							<div class="hidden">${file.path}</div>
						</div>
						`);

	ui.fileList.append(fileEntry);
	fileEntry.on("click", onFileEntryClicked);
});

function onFileEntryClicked(e: JQuery.ClickEvent) {
	$(".file-entry").removeClass("selected");
	$(e.target).addClass("selected");
	ipcRenderer.send(IpcEvents.rendererRequestLoadMeta, $(e.target).children().eq(3).text());
}

function _arrayBufferToBase64(buffer: Buffer): string {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

//
//
// Popups
ipcRenderer.on(IpcEvents.mainRequestRenderError, (event: IpcRendererEvent, error: Error) => {
	alert(`
		Error: ${error.name}\n
		${error.message}\n
		\n
		Please send a screenshot of this to me
	`);
});
