const IpcEvents = {
  main: {
    wants: {
      toRender: {
        error: 'render-error',
        meta: 'render-meta',
        noFileDOM: 'main-request-remove-file-dom',
        searchResultsFrom: {
          soundcloud: 'render-search-soundcloud',
          spotify: 'render-search-spotify',
        },
      },
    },
    has: {
      approvedFile: 'file-approved',
      updatedSelection: 'main-request-update-selection',
      updatedFiles: 'main-files-updated',
    },
  },

  renderer: {
    wants: {
      window: {
        toClose: 'window-close',
        toCollapse: 'window-collapse',
        toToggleSize: 'window-toggle-size',
      },
      toWriteUpdate: 'save-meta',
      toSearchForTags: 'opent-assistat',
      toRemoveFile: 'request-remove-file',
      toSelectFile: 'renderer-selection-file-selected',
      toToggleFile: 'renderer-selection-file-toggled',
      toRefresh: {
        files: 'rednerer-request-update-files',
        selection: 'rednerer-request-update-selection',
      },
    },
    has: {
      receivedFile: 'file-received',
    },
  },
};

export default IpcEvents;
