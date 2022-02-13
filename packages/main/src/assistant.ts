import type { IpcMainEvent } from 'electron';
import { ipcMain } from 'electron';
import type { SoundcloudTrackSearchV2 } from 'soundcloud.ts';
import Soundcloud from 'soundcloud.ts';
import * as Spotify from 'spotify-api.js';
import IpcEvents from '../../common/IpcEvents';

function setUpAssistantProcess(): void {
  // Soudcloud API
  const soundcloud = new Soundcloud();

  // Spotify API
  const spotify = new Spotify.Client({
    refreshToken: true,
    token: {
      clientID: 'e2323c89d0964354b86641fb730ef675',
      clientSecret: '2e88b4690b194326aab451ea3d2e5ff2',
      // not sure if i was supposed to keep these a secret, but here you go world
    },
  });

  // Search event
  ipcMain.on(
    IpcEvents.processAssistantSearch,
    (event: IpcMainEvent, searchString: string) => {
      soundcloud.tracks
        .searchV2({ q: searchString })
        .then((res: SoundcloudTrackSearchV2) => {
          res.collection = res.collection.slice(0, 5);
          event.sender.send(IpcEvents.renderSearchSoundcloud, res);
        })
        .catch((error) => {
          console.log(error);
        });

      spotify.tracks
        .search(searchString)
        .then((res: Spotify.Track[]) => {
          event.sender.send(IpcEvents.renderSearchSpotify, res.slice(0, 5));
        })
        .catch((error) => {
          console.log(error);
        });
    },
  );
}

export default setUpAssistantProcess;
