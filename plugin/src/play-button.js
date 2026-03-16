import { getLibrary, getEpisodes, streamUrl } from './api-client';
import { getBackendUrl, formatFileSize } from './utils';

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
                    openShowModal(localItem, card);
                } else {
                    playMovie(localItem, card);
                }
            });

            btnArea.append(btn);
        }).catch(function () {});
    });
}

function playMovie(localItem, card) {
    var original = card.original_title || card.original_name || localItem.original_title || localItem.title;
    var hash = Lampa.Utils.hash(original);
    var view = Lampa.Timeline.view(hash);

    var element = {
        url: streamUrl(localItem.id),
        title: localItem.title || card.title,
        timeline: view
    };

    Lampa.Player.play(element);
    Lampa.Player.playlist([element]);
}

function openShowModal(show, card) {
    var seasons = show.seasons || [];
    if (!seasons.length) seasons = [1];

    if (seasons.length === 1) {
        loadAndShowEpisodes(show, card, seasons[0]);
    } else {
        var items = [];
        for (var i = 0; i < seasons.length; i++) {
            items.push({
                title: Lampa.Lang.translate('local_media_season') + ' ' + seasons[i],
                season: seasons[i]
            });
        }
        Lampa.Select.show({
            title: Lampa.Lang.translate('title_season'),
            items: items,
            onBack: function () {
                Lampa.Controller.toggle('content');
            },
            onSelect: function (a) {
                loadAndShowEpisodes(show, card, a.season);
            }
        });
    }
}

function loadAndShowEpisodes(show, card, season) {
    Lampa.Modal.open({
        title: '',
        html: $('<div class="broadcast__scan"><div></div></div>'),
        onBack: function () {
            Lampa.Modal.close();
            Lampa.Controller.toggle('content');
        }
    });

    getEpisodes(show.tmdb_id || show.id, season).then(function (data) {
        renderEpisodeModal(show, card, season, data);
    }).catch(function (err) {
        Lampa.Modal.close();
        Lampa.Noty.show(err.message || 'Error');
        Lampa.Controller.toggle('content');
    });
}

function renderEpisodeModal(show, card, season, data) {
    var html = $('<div class="torrent-files"></div>');
    var playlist = [];
    var episodes = data.episodes || [];
    var original = card.original_name || card.original_title || show.original_title || show.title;
    var scroll_to_element;

    episodes.forEach(function (ep, idx) {
        var epNum = ep.episode_number || (idx + 1);

        // Same hash as Lampa's Timeline.watchedEpisode() and torrent EpisodeParser
        var hashStr = [season, season > 10 ? ':' : '', epNum, original].join('');
        var hash = Lampa.Utils.hash(hashStr);
        var view = Lampa.Timeline.view(hash);

        var exe = 'mkv';
        if (ep.file_path) {
            var parts = ep.file_path.split('.');
            if (parts.length > 1) exe = parts.pop().toLowerCase();
        }

        var fname = ep.title || ('Episode ' + epNum);
        var airDate = '--';
        if (ep.air_date) {
            try { airDate = Lampa.Utils.parseTime(ep.air_date).full; }
            catch (e) { airDate = ep.air_date; }
        }
        var size = ep.file_size ? formatFileSize(ep.file_size) : '';
        var img = ep.still_url || './img/img_broken.svg';

        var element = {
            season: season,
            episode: epNum,
            fname: fname,
            air_date: airDate,
            size: size,
            exe: exe,
            img: img,
            url: streamUrl(ep.id),
            title: (show.title || card.title || '') + ' S' +
                String(season).padStart(2, '0') + 'E' +
                String(epNum).padStart(2, '0') + ' - ' + fname,
            timeline: view
        };

        if (img !== './img/img_broken.svg') element.thumbnail = img;

        var item;
        try {
            item = Lampa.Template.get('torrent_file_serial', element);
            item.find('.torrent-serial__content').append(Lampa.Timeline.render(view));
        } catch (e) {
            item = $('<div class="selector torrent-file" style="padding:1em;margin:0.3em 0"></div>');
            item.html('<b>' + epNum + '</b> ' + fname +
                ' <span style="opacity:0.5">' + size + ' .' + exe + '</span>');
            item.append(Lampa.Timeline.render(view));
        }

        if (view.percent > 0) scroll_to_element = item;

        playlist.push(element);

        item.on('hover:enter', function () {
            if (card.id) {
                try { Lampa.Favorite.add('history', card, 100); } catch (e) {}
            }

            Lampa.Player.play(element);

            Lampa.Player.callback(function () {
                Lampa.Controller.toggle('modal');
            });

            Lampa.Player.playlist(playlist);
        });

        item.on('visible', function () {
            var imgEl = item.find('img');
            if (imgEl.length && imgEl.attr('data-src')) {
                imgEl[0].onload = function () { imgEl.addClass('loaded'); };
                imgEl[0].src = imgEl.attr('data-src');
            }
        });

        html.append(item);
    });

    if (episodes.length === 0) {
        html = $('<div style="padding:2em;text-align:center;opacity:0.5">' +
            Lampa.Lang.translate('empty_title') + '</div>');
    } else {
        Lampa.Modal.title(Lampa.Lang.translate('title_files'));
    }

    Lampa.Modal.update(html);

    if (scroll_to_element) {
        Lampa.Controller.collectionFocus(scroll_to_element, Lampa.Modal.scroll().render());
    }
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
