<script lang="ts">
  import type { IpcRendererEvent } from 'electron';
  import type {
    SoundcloudTrackSearchV2,
    SoundcloudTrackV2,
  } from 'soundcloud.ts';
  import type { Track as SpotifyTrack } from 'spotify-api.js';

  import type { SeachResultSuggestion, SearchResult } from './Result.svelte';
  import IpcEvents from '../../../../common/IpcEvents';
  import Result from './Result.svelte';

  /**
   * Search results
   */

  const results: {
    spotify: SearchResult[];
    soundcloud: SearchResult[];
  } = {
    spotify: [],
    soundcloud: [],
  };

  async function applyAlbumArt(url: string, extension: string): Promise<void> {
    try {
      const res = await fetch(url);
      const data = await res.arrayBuffer();

      let MIMEType;
      if (extension === 'png') {
        MIMEType = 'image/png';
      } else if (
        extension === 'jpg'
        || extension === 'jpeg'
      ) {
        MIMEType = 'image/jpeg';
      }

      window.tags.updateFrame({
        APIC: {
          MIMEType,
          pictureType: '3',
          description: '',
          data,
        },
      });
    } catch (error: any) {
      alert(error);
    }
  }

  /**
   * Search
   */

  let searchString;

  function search() {
    window.electron.send(IpcEvents.renderer.wants.toSearchForTags, searchString ?? '');
  }

  // Spotify
  window.electron.on(
    IpcEvents.main.wants.toRender.searchResultsFrom.spotify,
    (event: IpcRendererEvent, res: SpotifyTrack[]) => {
      const newSpotifyResults: SearchResult[] = [];

      res.forEach((track: SpotifyTrack) => {
        const trackArtistsString: string = (() => {
          let artists = '';
          track.artists.forEach((artist, i) => {
            if (i !== 0) {
              if (i + 1 >= track.artists.length) artists += ' & ';
              else artists += ', ';
            }
            artists += artist.name;
          });
          return artists;
        })();

        const suggestions: SeachResultSuggestion[] = [];

        suggestions.push({
          lablel: 'Track title',
          buttons: [
            {
              label: track.name,
              apply() {
                window.tags.updateFrame({ TIT2: track.name });
              },
            },
          ],
        });
        suggestions.push({
          lablel: 'Track artist',
          buttons: [
            {
              label: trackArtistsString,
              apply() {
                window.tags.updateFrame({ TPE1: trackArtistsString });
              },
            },
          ],
        });
        suggestions.push({
          lablel: 'Track number',
          buttons: [
            {
              label: `${track.trackNumber}`,
              apply() {
                window.tags.updateFrame({ TRCK: `${track.trackNumber}` });
              },
            },
          ],
        });

        if (track.album) {
          const albumArtistString: string = (() => {
            let artists = '';
            track.album.artists.forEach((artist, i) => {
              if (i !== 0) {
                if (i + 1 >= track.artists.length) artists += ' & ';
                else artists += ', ';
              }
              artists += artist.name;
            });
            return artists;
          })();

          suggestions.push({
            lablel: 'Album title',
            buttons: [
              {
                label: track.album.name,
                apply() {
                  window.tags.updateFrame({ TALB: track.album.name });
                },
              },
            ],
          });
          suggestions.push({
            lablel: 'Album artist',
            buttons: [
              {
                label: albumArtistString,
                apply() {
                  window.tags.updateFrame({ TPE2: albumArtistString });
                },
              },
            ],
          });
          suggestions.push({
            lablel: 'Year',
            buttons: [
              {
                label: track.album.releaseDate.split('-')[0],
                apply() {
                  window.tags.updateFrame({ TYER: track.album.releaseDate.split('-')[0] });
                },
              },
            ],
          });
        }

        newSpotifyResults.push({
          trackTitle: track.name,
          trackArtist: trackArtistsString,
          albumArtSrc: track.album?.images[2].url,
          isOpen: false,
          suggestions,
          albumArt: {
            url: track.album.images[0].url,
            extension: '.jpeg',
          },
        });
      });

      results.spotify = newSpotifyResults;
    },
  );

  // Soundcloud

  function analyzeSoundcloudTracktitle(title: string): string[] {
    // Generate suggestions
    const suggestions: string[] = [];

    suggestions.push(title);

    if (title.indexOf(' - ') >= 0) suggestions.push(...title.split(' - '));

    return suggestions;
  }

  window.electron.on(
    IpcEvents.main.wants.toRender.searchResultsFrom.soundcloud,
    (event: IpcRendererEvent, res: SoundcloudTrackSearchV2) => {
      const newSoundcloudResults: SearchResult[] = [];

      res.collection.forEach((track: SoundcloudTrackV2) => {
        const trackTitles: SeachResultSuggestion = {
          lablel: 'Possible track titles',
          buttons: [],
        };
        const titles = analyzeSoundcloudTracktitle(track.title);
        titles.forEach((title) => {
          trackTitles.buttons.push({
            label: title,
            apply() {
              window.tags.updateFrame({ TIT2: title });
            },
          });
        });

        const albumTitles: SeachResultSuggestion = {
          lablel: 'Possible track titles',
          buttons: [],
        };
        titles.forEach((title) => {
          albumTitles.buttons.push({
            label: title,
            apply() {
              window.tags.updateFrame({ TALB: title });
            },
          });
        });

        newSoundcloudResults.push({
          trackTitle: track.title,
          trackArtist: track.user.username,
          albumArtSrc: track.artwork_url,
          isOpen: false,
          suggestions: [
            trackTitles,
            {
              lablel: 'Possible track artists',
              buttons: [{
                label: track.user.username,
                apply() {
                  window.tags.updateFrame({ TPE2: track.user.username });
                },
              }],
            },
            {
              lablel: 'Possible track numbers',
              buttons: [
                {
                  label: '1',
                  apply() {
                    window.tags.updateFrame({ TRCK: '1' });
                  },
                },
                {
                  label: '2',
                  apply() {
                    window.tags.updateFrame({ TRCK: '1' });
                  },
                },
                {
                  label: '3',
                  apply() {
                    window.tags.updateFrame({ TRCK: '1' });
                  },
                },
              ],
            },
            albumTitles,
            {
              lablel: 'Possible album artists',
              buttons: [
                {
                  label: track.user.username,
                  apply() {
                    window.tags.updateFrame({ TPE2: track.user.username });
                  },
                },
              ],
            },
            {
              lablel: 'Possible years',
              buttons: track.release_date
                ? [
                  {
                    label: track.release_date,
                    apply() {
                      window.tags.updateFrame({ TYER: track.release_date });
                    },
                  },
                ]
                : [],
            },
          ],
          albumArt: {
            url: track.artwork_url?.replace('-large', '-t500x500'),
            extension: '.jpg',
          },
        });
      });

      results.soundcloud = newSoundcloudResults;
    },
  );
</script>

<div id="assistant-tab">
  <form action="" class="search afterline" on:submit|preventDefault={search}>
    <input
      id="search-input"
      type="text"
      placeholder="Search"
      bind:value={searchString}
    />
    <div class="search-buttons">
      <button id="search-all">search</button>
      <!--
        <button id="search-soundcloud">Search Soundcloud</button>
        <button id="search-spotify">Search Spotify</button>
      -->
    </div>
  </form>

  <h3>Spotify</h3>
  <div id="search-results-spotify">
    {#each results.spotify as result}
      <Result
        {result}
        on:albumArt={(e) => {
          applyAlbumArt(e.detail.url, e.detail.extension);
        }}
      />
    {/each}
  </div>

  <h3>Soundcloud</h3>
  <div id="search-results-soundcloud">
    {#each results.soundcloud as result}
      <Result
        {result}
        on:albumArt={(e) => {
          applyAlbumArt(e.detail.url, e.detail.extension);
        }}
      />
    {/each}
  </div>
</div>
