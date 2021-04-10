import "./assets/mp3-tag-assistant-icons/css/mp3-tag-assistant-icons.css";
import "./index.css";
import "./tags.css";
import "./files.css";
import { ipcRenderer, IpcRendererEvent } from "electron";
import $ from "jquery";

let ui = {
	windowControls: {
		close: $("#window-control-close"),
		toggleSize: $("#window-control-toggle-size"),
		collapse: $("#window-control-colapse"),
	},
	selctions: {
		tags: $("#tags-section"),
		files: $("#files-section"),
	},
	fileList: $("#file-list"),
};

document.addEventListener("drop", (event) => {
	event.preventDefault();
	event.stopPropagation();

	for (let i = 0; i < event.dataTransfer.files.length; ++i) {
		let f = event.dataTransfer.files[i];
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
// File UI
/**
 * @description Adds file entries to the UI.
 */
ipcRenderer.on("file-approved", (event: IpcRendererEvent, file) => {
	console.log("adding file " + file.name + "...");
	ui.fileList
		.append(
			`
			<div class="row file-entry">
				<div class="col">${file.name}</div>
				<div class="col">${file.type}</div>
				<div class="col">${file.location}</div>
			</div>
			`
		)
		.on("click", onFileEntryClicked);
});

function onFileEntryClicked(e: JQuery.ClickEvent) {
	$(".file-entry").removeClass("selected");
	$(e.target).addClass("selected");
}
