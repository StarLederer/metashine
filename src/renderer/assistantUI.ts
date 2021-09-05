import { ipcRenderer, IpcRendererEvent } from 'electron';
import $ from 'jquery';
import { SoundcloudTrackSearchV2 } from 'soundcloud.ts';
import Spotify from 'spotify-api.js';

import IpcEvents from '../common/IpcEvents';
import {
  updateTrackTitle,
  updateTrackArtist,
  updateTrackNumber,
  updateAlbumTitle,
  updateAlbumArtist,
  updateYear,
  updateAlbumArt,
} from './tagUI';
import { urlToBuffer } from '../common/util';

interface AssistantUIParameters {
  searchInput: JQuery<HTMLInputElement>;
  searchAll: JQuery<HTMLElement>;
  // searchSoundcloud: JQuery<HTMLElement>;
  // searchSpotify: JQuery<HTMLElement>;
  searchResultsSpotify: JQuery<HTMLElement>;
  searchResultsSoundcloud: JQuery<HTMLElement>;
}

class SearchResultComponent {
  private element: JQuery<HTMLElement>;

  public get jQueryHTMLElement() {
    return this.element;
  }

  constructor(trackTitle: string, trackArtist: string, albumArtSrc?: string) {
    this.element = $(`
    <div class="search-result">
      <div class="suggestions">
        <div class="container">
          <h5 class="track-title-suggestion-header" style="display: none">Possible track titles</h5>
          <div class="track-title-suggestions"></div>

          <h5 class="track-artist-suggestion-header" style="display: none">Possible track artists</h5>
          <div class="track-artist-suggestions"></div>

          <h5 class="track-number-suggestion-header" style="display: none">Possible track artists</h5>
          <div class="track-number-suggestions"></div>

          <h5 class="album-title-suggestion-header" style="display: none">Possible album titles</h5>
          <div class="album-title-suggestions"></div>

          <h5 class="album-artist-suggestion-header" style="display: none">Possible album artists</h5>
          <div class="album-artist-suggestions"></div>

          <h5 class="year-suggestion-header" style="display: none">Possible release years</h5>
          <div class="year-suggestions"></div>
        </div>
      </div>
      <div class="preview">
        <img
          src="${albumArtSrc ?? ''}"
          class="album-art"
        />

        <h4 class="track-info">
          <span class="track-title">${trackTitle}</span>
          <span class="track-artist">${trackArtist}</span>
        </h4>
      </div>
    </div>
    `);

    this.element.find('.preview').on('click', () => {
      if (this.element.hasClass('open')) {
        this.element.removeClass('open');
        this.element.children('.suggestions')[0].style.removeProperty('height');
      } else {
        this.element.addClass('open');
        this.element.children('.suggestions')[0].style.height = `${this.element
          .find('.container')
          .outerHeight()}px
          `;
      }
    });
  }

  setAlbumArt(url: string, extension: string): void {
    this.element.find('.album-art').on('click', (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();

      const bufferPromise = urlToBuffer(url);
      bufferPromise
        .then((buffer) => {
          updateAlbumArt(buffer, extension);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }

  addPossibleTrackTitles(suggestions: string[]) {
    if (suggestions.length <= 0) return;

    this.element.find('.track-title-suggestion-header').css('display', '');

    const suggestionDiv = this.element.find('.track-title-suggestions');
    for (let i = 0; i < suggestions.length; ++i) {
      const button = $(`
      <button>${suggestions[i]}</button>
    `);
      button.on('click', () => {
        updateTrackTitle(suggestions[i]);
      });
      suggestionDiv.append(button);
    }
  }

  addPossibleTrackArtists(suggestions: string[]) {
    if (suggestions.length <= 0) return;

    this.element.find('.track-artist-suggestion-header').css('display', '');

    const suggestionDiv = this.element.find('.track-artist-suggestions');
    for (let i = 0; i < suggestions.length; ++i) {
      const button = $(`
      <button>${suggestions[i]}</button>
    `);
      button.on('click', () => {
        updateTrackArtist(suggestions[i]);
      });
      suggestionDiv.append(button);
    }
  }

  addPossibleTrackNumbers(suggestions: string[]) {
    if (suggestions.length <= 0) return;

    this.element.find('.track-number-suggestion-header').css('display', '');

    const suggestionDiv = this.element.find('.track-number-suggestions');
    for (let i = 0; i < suggestions.length; ++i) {
      const button = $(`
      <button>${suggestions[i]}</button>
    `);
      button.on('click', () => {
        updateTrackNumber(suggestions[i]);
      });
      suggestionDiv.append(button);
    }
  }

  addPossibleAlbumTitles(suggestions: string[]) {
    if (suggestions.length <= 0) return;

    this.element.find('.album-title-suggestion-header').css('display', '');

    const suggestionDiv = this.element.find('.album-title-suggestions');
    for (let i = 0; i < suggestions.length; ++i) {
      const button = $(`
      <button>${suggestions[i]}</button>
    `);
      button.on('click', () => {
        updateAlbumTitle(suggestions[i]);
      });
      suggestionDiv.append(button);
    }
  }

  addPossibleAlbumArtists(suggestions: string[]) {
    if (suggestions.length <= 0) return;

    this.element.find('.album-artist-suggestion-header').css('display', '');

    const suggestionDiv = this.element.find('.album-artist-suggestions');
    for (let i = 0; i < suggestions.length; ++i) {
      const button = $(`
      <button>${suggestions[i]}</button>
    `);
      button.on('click', () => {
        updateAlbumArtist(suggestions[i]);
      });
      suggestionDiv.append(button);
    }
  }

  addPossibleYears(suggestions: string[]) {
    if (suggestions.length <= 0) return;

    this.element.find('.year-suggestion-header').css('display', '');

    const suggestionDiv = this.element.find('.year-suggestions');
    for (let i = 0; i < suggestions.length; ++i) {
      const button = $(`
      <button>${suggestions[i]}</button>
    `);
      button.on('click', () => {
        updateYear(suggestions[i]);
      });
      suggestionDiv.append(button);
    }
  }
}

function analyzeSoundcloudTracktitle(title: string): string[] {
  // Generate suggestions
  const suggestions: string[] = [];

  suggestions.push(title);

  if (title.indexOf(' - ') >= 0) suggestions.push(...title.split(' - '));

  return suggestions;
}

function setupAssistantUI(params: AssistantUIParameters): void {
  // Soundcloud search button
  params.searchAll.on('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    params.searchResultsSpotify.empty();
    params.searchResultsSoundcloud.empty();
    ipcRenderer.send(
      IpcEvents.processAssistantSearch,
      params.searchInput.val()
    );
  });

  // Render Soundcloud search results
  ipcRenderer.on(
    IpcEvents.renderSearchSoundcloud,
    (event: IpcRendererEvent, res: SoundcloudTrackSearchV2) => {
      params.searchResultsSoundcloud.empty();

      for (let i = 0; i < res.collection.length; ++i) {
        const searchCard = new SearchResultComponent(
          res.collection[i].title,
          res.collection[i].user.username,
          res.collection[i].artwork_url
        );

        // Album art
        searchCard.setAlbumArt(
          res.collection[i].artwork_url?.replace('-large', '-t500x500'),
          '.jpg'
        );
        searchCard.addPossibleTrackTitles(
          analyzeSoundcloudTracktitle(res.collection[i].title)
        );
        searchCard.addPossibleTrackArtists([res.collection[i].user.username]);
        searchCard.addPossibleAlbumTitles(
          analyzeSoundcloudTracktitle(res.collection[i].title)
        );
        searchCard.addPossibleAlbumArtists([res.collection[i].user.username]);
        searchCard.addPossibleYears(
          res.collection[i].release_date ? [res.collection[i].release_date] : []
        );

        params.searchResultsSoundcloud.append(searchCard.jQueryHTMLElement);
      }
    }
  );

  // Render Spotify search results
  ipcRenderer.on(
    IpcEvents.renderSearchSpotify,
    (event: IpcRendererEvent, res: Spotify.Track[]) => {
      params.searchResultsSpotify.empty();
      res.forEach((track: Spotify.Track) => {
        const trackArtistString: string = (() => {
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

        const searchCard = new SearchResultComponent(
          track.name,
          trackArtistString,
          track.album?.images[2].url
        );

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

          searchCard.setAlbumArt(track.album.images[0].url, '.jpeg');
          searchCard.addPossibleAlbumTitles([track.album.name]);
          searchCard.addPossibleAlbumArtists([albumArtistString]);
          searchCard.addPossibleYears([track.album.releaseDate.split('-')[0]]);
        }
        searchCard.addPossibleTrackTitles([track.name]);
        searchCard.addPossibleTrackArtists([trackArtistString]);
        searchCard.addPossibleTrackNumbers([track.trackNumber + '']);

        params.searchResultsSpotify.append(searchCard.jQueryHTMLElement);
      });
    }
  );
}

export default setupAssistantUI;
