import { getLibrary, streamUrl } from './api-client';
import { getBackendUrl, playExternal } from './utils';

/**
 * Injects a "Play Local" button into native Lampa TMDB detail pages
 * when the displayed item has a local file available.
 */
export function registerPlayButton() {
    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        if (!getBackendUrl()) return;

        var card = null;
        if (e.data && e.data.movie) card = e.data.movie;
        else if (e.data && e.data.card) card = e.data.card;

        if (!card || !card.id) return;

        var tmdbId = parseInt(card.id);
        if (!tmdbId) return;

        getLibrary(true).then(function (lib) {
            var localItem = findLocalItem(lib, tmdbId, card.name ? 'tv' : 'movie');
            if (!localItem) return;

            var btnArea = null;
            if (e.body) {
                btnArea = e.body.find('.full-start-new__buttons, .full-start__buttons');
            }
            if (!btnArea || !btnArea.length) return;

            if (btnArea.find('.lm-play-local-btn').length) return;

            var btn = $('<div class="full-start__button selector lm-play-local-btn">' +
                '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:1.5em;height:1.5em;margin-right:0.5em">' +
                '<path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>' +
                '</svg>' +
                '<span>' + Lampa.Lang.translate('local_media_play_local') + '</span>' +
            '</div>');

            btn.on('hover:enter', function () {
                playExternal(streamUrl(localItem.id), localItem.title || card.title || card.name);
            });

            btnArea.append(btn);
        }).catch(function () {
            // library not available, no button injected
        });
    });
}

function findLocalItem(lib, tmdbId, mediaType) {
    if (!lib) return null;

    if (mediaType === 'movie' && lib.movies) {
        for (var i = 0; i < lib.movies.length; i++) {
            if (lib.movies[i].tmdb_id === tmdbId) return lib.movies[i];
        }
    }
    if (mediaType === 'tv' && lib.shows) {
        for (var j = 0; j < lib.shows.length; j++) {
            if (lib.shows[j].tmdb_id === tmdbId) return lib.shows[j];
        }
    }

    // search both lists as fallback
    var all = (lib.movies || []).concat(lib.shows || []);
    for (var k = 0; k < all.length; k++) {
        if (all[k].tmdb_id === tmdbId) return all[k];
    }
    return null;
}
