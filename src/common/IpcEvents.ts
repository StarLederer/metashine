export const IpcEvents = {
  mainFileApproved: 'file-approved',
  mainSelectionUpdated: 'main-request-update-selection',
  renderAlbumArt: 'render-album-art',
  renderError: 'render-meta',
  renderMeta: 'render-error',
  renderNoFileDOM: 'main-request-remove-file-dom',
  renderSoundcloudSearch: 'render-soundcloud-search',

  rendererAlbumArtReceived: 'album-art-received',
  rendererFileReceived: 'file-received',
  rendererRequestRemoveAlbumArt: 'remove-album-art',
  rendererRequestRemoveFile: 'request-remove-file',
  processAssistantSearch: 'opent-assistat',
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
  rendererWindowCollapse: 'window-collapse',
  rendererWindowToggleSize: 'window-toggle-size',
};
