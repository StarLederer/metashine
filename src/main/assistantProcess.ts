import { ipcMain, IpcMainEvent } from 'electron';
import Soundcloud, { SoundcloudTrackSearchV2 } from 'soundcloud.ts';
import * as Spotify from 'spotify-api.js';
import IpcEvents from '../common/IpcEvents';

function setUpAssistantProcess(): void {
  // Soudcloud API
  const soundcloud = new Soundcloud(
    process.env.SOUNDCLOUD_CLIENT_ID,
    process.env.SOUNDCLOUD_OAUTH_TOKEN
  );

  // Spotify API
  const spotify = new Spotify.Client({
    refreshToken: true,
    token: {
      clientID: process.env.SPOTIFY_CLIENT_ID as string,
      clientSecret: process.env.SPOTIFY_SECRET as string,
      // TODO: Check if the key is present.
      // Other developers might get confused otherwise
    },
    onReady() {
      // console.log(spotify);
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
    }
  );
}

export default setUpAssistantProcess;
