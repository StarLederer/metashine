import "./index.css";
import { ipcRenderer, IpcRendererEvent } from "electron";
import $ from "jquery";

var ui = {
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

// Async message handler
ipcRenderer.on("file-approved", (event: IpcRendererEvent, file) => {
	console.log("adding file " + file.name + "...");
	ui.fileList.append(`
        <div class="file-card">
            <h3>${file.name}</h3>
        </div>
    `);
});
