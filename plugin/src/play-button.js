import { getLibrary, getEpisodes, streamUrl } from './api-client';
import { getBackendUrl, playExternal, playExternalWithPlaylist, formatFileSize } from './utils';

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

        var mediaType = card.name ? 'tv' : 'movie';

        getLibrary(true).then(function (lib) {
            var localItem = findLocalItem(lib, tmdbId, mediaType);
            if (!localItem) return;

            var btnArea = null;
            if (e.object && e.object.activity && e.object.activity.render) {
                var render = e.object.activity.render();
                btnArea = $(render).find('.full-start-new__buttons, .full-start__buttons');
            }
            if ((!btnArea || !btnArea.length) && e.body) {
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
                if (mediaType === 'tv') {
                    showSeasonPicker(localItem);
                } else {
                    playExternal(streamUrl(localItem.id), localItem.title || card.title);
                }
            });

            btnArea.append(btn);
        }).catch(function () {});
    });
}

function showSeasonPicker(show) {
    var seasonCount = show.season_count || 1;

    if (seasonCount === 1) {
        loadAndShowEpisodes(show, 1);
        return;
    }

    var items = [];
    for (var s = 1; s <= seasonCount; s++) {
        items.push({
            title: Lampa.Lang.translate('local_media_season') + ' ' + s,
            season: s
        });
    }

    Lampa.Select.show({
        title: show.title || 'Select Season',
        items: items,
        onSelect: function (a) {
            loadAndShowEpisodes(show, a.season);
        },
        onBack: function () {
            Lampa.Controller.toggle('content');
        }
    });
}

function loadAndShowEpisodes(show, season) {
    Lampa.Noty.show(Lampa.Lang.translate('local_media_loading'));

    getEpisodes(show.tmdb_id || show.id, season).then(function (data) {
        var episodes = data.episodes || [];
        if (!episodes.length) {
            Lampa.Noty.show('No episodes found');
            return;
        }

        var playlist = [];
        var items = [];

        episodes.forEach(function (ep) {
            var epTitle = 'S' + String(season).padStart(2, '0') + 'E' +
                String(ep.episode_number).padStart(2, '0');
            if (ep.title) epTitle += ' — ' + ep.title;

            var info = '';
            if (ep.file_size) info = ' (' + formatFileSize(ep.file_size) + ')';

            playlist.push({
                title: (show.title || '') + ' ' + epTitle,
                url: streamUrl(ep.id)
            });

            items.push({
                title: epTitle + info,
                idx: items.length
            });
        });

        Lampa.Select.show({
            title: show.title + ' — ' + Lampa.Lang.translate('local_media_season') + ' ' + season,
            items: items,
            onSelect: function (a) {
                playExternalWithPlaylist(
                    playlist[a.idx].url,
                    playlist[a.idx].title,
                    playlist
                );
            },
            onBack: function () {
                if (show.season_count > 1) {
                    showSeasonPicker(show);
                } else {
                    Lampa.Controller.toggle('content');
                }
            }
        });
    }).catch(function (err) {
        Lampa.Noty.show(Lampa.Lang.translate('local_media_error') + ': ' + err.message);
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

    var all = (lib.movies || []).concat(lib.shows || []);
    for (var k = 0; k < all.length; k++) {
        if (all[k].tmdb_id === tmdbId) return all[k];
    }
    return null;
}
