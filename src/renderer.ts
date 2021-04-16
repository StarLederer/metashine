import "./index.css";
import "./tags.css";
import "./files.css";
import { ipcRenderer, IpcRendererEvent } from "electron";
import $ from "jquery";
import * as NodeID3 from "node-id3";

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
		ipcRenderer.send("file-received", {
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
	ipcRenderer.send("window-collapse");
});
ui.windowControls.toggleSize.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send("window-toggle-size");
});
ui.windowControls.close.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send("window-close");
});

//
//
// Tag UI
ui.saveButton.on("click", (e) => {
	e.preventDefault();
	e.stopPropagation();

	ipcRenderer.send("save-meta", {
		title: ui.tagFileds.trackTitle.val(),
		artist: ui.tagFileds.trackArtist.val(),
		trackNumber: ui.tagFileds.trackNumber.val(),
		album: ui.tagFileds.albumTitle.val(),
		performerInfo: ui.tagFileds.albumArtist.val(),
		year: ui.tagFileds.year.val(),
	});
});

ui.tagFileds.albumArt.on("dragenter dragover", (event) => {
	event.preventDefault();
	event.stopPropagation();
});
ui.tagFileds.albumArt.on("drop", (event) => {
	event.preventDefault();
	event.stopPropagation();

	const file = event.originalEvent.dataTransfer.files[0];
	file.arrayBuffer().then((buffer) => {
		ipcRenderer.send("album-art-received", file.name, buffer);
	});
});

ipcRenderer.on("render-meta", (event: IpcRendererEvent, meta: NodeID3.Tags) => {
	ui.tagFileds.trackTitle.val(meta.title);
	ui.tagFileds.trackArtist.val(meta.artist);
	ui.tagFileds.trackNumber.val(meta.trackNumber);
	ui.tagFileds.albumTitle.val(meta.album);
	ui.tagFileds.albumArtist.val(meta.performerInfo);
	ui.tagFileds.year.val(meta.year);

	const albumCover = meta.image as any;
	if (albumCover.imageBuffer) {
		const base64String = _arrayBufferToBase64(albumCover.imageBuffer);
		ui.tagFileds.albumArt.html(`<img src="data:${albumCover.mime};base64,${base64String}" alt="Album art" />`);
	} else ui.tagFileds.albumArt.html("");
});
ipcRenderer.on("render-album-art", (event: IpcRendererEvent, mime: string, buffer: Buffer) => {
	const base64String = _arrayBufferToBase64(buffer);
	ui.tagFileds.albumArt.html(`<img src="data:${mime};base64,${base64String}" alt="Album art" />`);
});

//
//
// File UI
ipcRenderer.on("file-approved", (event: IpcRendererEvent, file) => {
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
	ipcRenderer.send("load-meta", $(e.target).children().eq(3).text());
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
ipcRenderer.on("render-error", (event: IpcRendererEvent, error: Error) => {
	alert(`
		Error: ${error.name}\n
		${error.message}\n
		\n
		Please send a screenshot of this to me
	`);
});
