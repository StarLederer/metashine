import { clipboard, contextBridge, ipcRenderer } from 'electron';

const apiKey = 'electron';
/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api: ElectronApi = {
  versions: process.versions,
  send(event: string, ...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    ipcRenderer.send(event, ...args);
  },
  on(event: string, listener) {
    ipcRenderer.on(event, listener);
  },
  clipboard: {
    availableFormats() {
      return clipboard.availableFormats();
    },
    writeText(text: string) {
      clipboard.writeText(text);
    },
    readImagePNG(): Buffer {
      return clipboard.readImage().toPNG();
    },
  },
};

/**
 * The "Main World" is the JavaScript context that your main renderer code runs in.
 * By default, the page you load in your renderer executes code in this world.
 *
 * @see https://www.electronjs.org/docs/api/context-bridge
 */
contextBridge.exposeInMainWorld(apiKey, api);
