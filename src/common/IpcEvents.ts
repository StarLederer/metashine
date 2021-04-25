export const IpcEvents = {
  mainFileApproved: 'file-approved',
  mainSelectionUpdated: 'main-request-update-selection',
  mainRequestRemoveFileDOM: 'main-request-remove-file-dom',
  mainRequestRenderError: 'render-meta',
  mainRequestRenderAlbumArt: 'render-album-art',
  mainRequestRenderMeta: 'render-error',

  rendererAlbumArtReceived: 'album-art-received',
  rendererFileReceived: 'file-received',
  rendererRequestRemoveAlbumArt: 'remove-album-art',
  rendererRequestRemoveFile: 'request-remove-file',
  rendererRequestSaveMeta: 'save-meta',
  rendererSelectionFileSelected: 'renderer-selection-file-selected',
  rendererSelectionFileToggled: 'renderer-selection-file-toggled',

  rendererTagTitleUpdated: 'tag-title-updated',
  rendererTagArtistUpdated: 'tag-artist-updated',
  rendererTagTrackUpdated: 'tag-track-updated',
  rendererTagAlbumUpdated: 'tag-album-updated',
  rendererTagAlbumArtistUpdated: 'tag-album-artist-updated',
  rendererTagYearUpdated: 'tag-year-updated',

  rendererWindowClose: 'window-close',
  rendererWindowCollaps: 'window-collapse',
  rendererWindowToggleSize: 'window-toggle-size',
};
