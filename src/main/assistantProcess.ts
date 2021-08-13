import { ipcMain, IpcMainEvent } from 'electron';
import Soundcloud, { SoundcloudTrackSearchV2 } from 'soundcloud.ts';
import { IpcEvents } from '../common/IpcEvents';

function setUpAssistantProcess() {
  ipcMain.on(
    IpcEvents.processAssistantSearch,
    (event: IpcMainEvent, searchString: string) => {
      const soundcloud = new Soundcloud(
        process.env.SOUNDCLOUD_CLIENT_ID,
        process.env.SOUNDCLOUD_OAUTH_TOKEN
      );
      soundcloud.tracks
        .searchV2({ q: searchString })
        .then((res: SoundcloudTrackSearchV2) => {
          for (let i = 0; i < res.collection.length; ++i) {
            res.collection[i].artwork_url = res.collection[
              i
            ].artwork_url?.replace('-large', '-t500x500');
          }
          event.sender.send(IpcEvents.renderSoundcloudSearch, res);
        });
    }
  );
}

export { setUpAssistantProcess };
