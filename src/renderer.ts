import "./assets/mp3-tag-assistant-icons/css/mp3-tag-assistant-icons.css";
import "./index.css";
import "./tags.css";
import "./files.css";
import { ipcRenderer, IpcRendererEvent } from "electron";
import $ from "jquery";

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
		albumArt: $("#album-art"),
	},
	fileList: $("#file-list"),
};

document.addEventListener("drop", (event) => {
	event.preventDefault();
	event.stopPropagation();

	for (let i = 0; i < event.dataTransfer.files.length; ++i) {
		const f = event.dataTransfer.files[i];
		ipcRenderer.send("file-received", {
			path: f.path,
			name: f.name,
		});
	}
});

document.addEventListener("dragover", (e) => {
	e.preventDefault();
	e.stopPropagation();
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
		track: {
			no: ui.tagFileds.trackNumber.val(),
		},
		album: ui.tagFileds.albumTitle.val(),
		albumartist: ui.tagFileds.albumArtist.val(),
		year: ui.tagFileds.year.val(),
	});
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

/**
 * @description Puts provided metadata into the tags section
 */
ipcRenderer.on("render-meta", (event: IpcRendererEvent, meta) => {
	console.log(meta);

	ui.tagFileds.trackTitle.val(meta.common.title);
	ui.tagFileds.trackArtist.val(meta.common.artist);
	ui.tagFileds.trackNumber.val(meta.common.track.no);
	ui.tagFileds.albumTitle.val(meta.common.album);
	ui.tagFileds.albumArtist.val(meta.common.albumartist);
	ui.tagFileds.year.val(meta.common.year);

	const base64String = _arrayBufferToBase64(meta.common.picture[0].data);
	console.log(`data:${meta.common.picture[0].format};base64,${base64String}`);
	ui.tagFileds.albumArt.attr("src", `data:${meta.common.picture[0].format};base64,${base64String}`);
});

function _arrayBufferToBase64(buffer: Array<number>): string {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}
