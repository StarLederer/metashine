export const IpcEvents = {
	mainFileApproved: "file-approved",
	mainRequestRenderError: "render-meta",
	mainRequestRenderAlbumArt: "render-album-art",
	mainRequestRenderMeta: "render-error",

	rendererAlbumArtReceived: "album-art-received",
	rendererFileReceived: "file-received",
	rendererRequestLoadMeta: "load-meta",
	rendererRequestRemoveAlbumArt: "remove-album-art",
	rendererRequestSaveMeta: "save-meta",

	rendererTagTitleUpdated: "tag-title-updated",
	rendererTagArtistUpdated: "tag-artist-updated",
	rendererTagTrackUpdated: "tag-track-updated",
	rendererTagAlbumUpdated: "tag-album-updated",
	rendererTagAlbumArtistUpdated: "tag-album-artist-updated",
	rendererTagYearUpdated: "tag-year-updated",

	rendererWindowClose: "window-close",
	rendererWindowCollaps: "window-collapse",
	rendererWindowToggleSize: "window-toggle-size",
};
