import { ipcRenderer, IpcRendererEvent } from 'electron';
import $ from 'jquery';
import { SoundcloudTrackSearchV2 } from 'soundcloud.ts';

import IpcEvents from '../common/IpcEvents';
import { updateAlbumArt, updateTrackArtist, updateTrackTitle } from './tagUI';
import { urlToBuffer } from '../common/util';

interface AssistantUIParameters {
  searchInput: JQuery<HTMLInputElement>;
  searchSoundcloud: JQuery<HTMLElement>;
  searchResults: JQuery<HTMLElement>;
}

function setupAssistantUI(params: AssistantUIParameters): void {
  // Soundcloud search button
  params.searchSoundcloud.on('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    params.searchResults.empty();
    ipcRenderer.send(
      IpcEvents.processAssistantSearch,
      params.searchInput.val()
    );
  });

  // Render soundcloud search results
  ipcRenderer.on(
    IpcEvents.renderSoundcloudSearch,
    (event: IpcRendererEvent, res: SoundcloudTrackSearchV2) => {
      params.searchResults.empty();

      for (let i = 0; i < res.collection.length; ++i) {
        const searchCard = $(`
        <div class="search-result">
          <div class="suggestions">
            <div class="container">
              <h5>Possible track titles</h5>
              <div class="track-title-suggestions"></div>
  
              <h5>Possible track artists</h5>
              <div class="track-artist-suggestions"></div>
            </div>
          </div>
          <div class="preview">
            <img
              src="${res.collection[i].artwork_url ?? ''}"
              class="album-art"
            />
  
            <h4 class="track-info">
              <span class="track-title">${res.collection[i].title}</span>
              <span class="track-artist">${
                res.collection[i].user.username
              }</span>
            </h4>
          </div>
        </div>
        `);

        // Album art
        if (res.collection[i].artwork_url) {
          urlToBuffer(res.collection[i].artwork_url)
            .then((buffer) => {
              searchCard.find('.album-art').on('click', (clickEvent) => {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
                updateAlbumArt(buffer, res.collection[i].artwork_url);
              });
            })
            .catch((error) => {
              event.sender.on(IpcEvents.renderError, error);
            });
        }

        // Track title
        {
          const suggestionDiv = searchCard.find('.track-title-suggestions');

          const rawSuggestion = res.collection[i].title;

          // Generate suggestions
          const suggestions: string[] = [];

          suggestions.push(rawSuggestion);

          if (rawSuggestion.indexOf(' - ') >= 0)
            suggestions.push(...rawSuggestion.split(' - '));

          // Add suggestion buttons
          for (let j = 0; j < suggestions.length; ++j) {
            const button = $(`
            <button>${suggestions[j]}</button>
          `);
            button.on('click', () => {
              updateTrackTitle(suggestions[j]);
            });
            suggestionDiv.append(button);
          }
        }

        // Track artist
        {
          const button = $(`
            <button>${res.collection[i].user.username}</button>
          `);
          button.on('click', () => {
            updateTrackArtist(res.collection[i].user.username);
          });
          searchCard.find('.track-artist-suggestions').append(button);
        }

        searchCard.find('.preview').on('click', () => {
          if (searchCard.hasClass('open')) {
            searchCard.removeClass('open');
            searchCard
              .children('.suggestions')[0]
              .style.removeProperty('height');
          } else {
            searchCard.addClass('open');
            searchCard.children('.suggestions')[0].style.height = `${searchCard
              .find('.container')
              .outerHeight()}px
              `;
          }
        });

        params.searchResults.append(searchCard);
      }
    }
  );
}

export default setupAssistantUI;
