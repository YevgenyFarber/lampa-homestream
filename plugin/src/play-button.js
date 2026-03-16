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
    var seasons = show.seasons || [];
    if (!seasons.length) seasons = [1];

    if (seasons.length === 1) {
        loadAndShowEpisodes(show, seasons[0]);
        return;
    }

    var items = [];
    for (var i = 0; i < seasons.length; i++) {
        items.push({
            title: Lampa.Lang.translate('local_media_season') + ' ' + seasons[i],
            season: seasons[i]
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
        episodes.forEach(function (ep) {
            var epLabel = 'S' + String(season).padStart(2, '0') + 'E' +
                String(ep.episode_number).padStart(2, '0');
            playlist.push({
                title: (show.title || '') + ' ' + epLabel + (ep.title ? ' — ' + ep.title : ''),
                url: streamUrl(ep.id)
            });
        });

        var items = [];
        episodes.forEach(function (ep, idx) {
            var epLabel = 'S' + String(season).padStart(2, '0') + 'E' +
                String(ep.episode_number).padStart(2, '0');
            var sizeStr = ep.file_size ? formatFileSize(ep.file_size) : '';

            items.push({
                title: ep.title || ('Episode ' + ep.episode_number),
                subtitle: epLabel + (ep.air_date ? ' • ' + formatDate(ep.air_date) : '') + (sizeStr ? ' • ' + sizeStr : ''),
                image: ep.still_url || '',
                idx: idx,
                episode_number: ep.episode_number
            });
        });

        showEpisodeOverlay(show, season, items, playlist);
    }).catch(function (err) {
        Lampa.Noty.show(Lampa.Lang.translate('local_media_error') + ': ' + err.message);
    });
}

function showEpisodeOverlay(show, season, items, playlist) {
    var overlay = $('<div class="lm-episodes-overlay"></div>');
    var panel = $('<div class="lm-episodes-panel"></div>');
    var title = $('<div class="lm-episodes-panel__title"></div>');
    title.text(show.title + ' — ' + Lampa.Lang.translate('local_media_season') + ' ' + season);
    panel.append(title);

    var list = $('<div class="lm-episodes-panel__list"></div>');
    var scroll = new Lampa.Scroll({ mask: true, over: true });
    scroll.minus();

    items.forEach(function (item) {
        var row = $('<div class="lm-ep-row selector"></div>');

        if (item.image) {
            var thumb = $('<div class="lm-ep-row__thumb"></div>');
            thumb.css('background-image', 'url(' + item.image + ')');
            var epNum = $('<div class="lm-ep-row__num"></div>');
            epNum.text(item.episode_number);
            thumb.append(epNum);
            row.append(thumb);
        } else {
            var numOnly = $('<div class="lm-ep-row__num-only"></div>');
            numOnly.text(item.episode_number);
            row.append(numOnly);
        }

        var info = $('<div class="lm-ep-row__info"></div>');
        var epTitle = $('<div class="lm-ep-row__title"></div>');
        epTitle.text(item.title);
        var epSub = $('<div class="lm-ep-row__sub"></div>');
        epSub.text(item.subtitle);
        info.append(epTitle);
        info.append(epSub);
        row.append(info);

        row.on('hover:enter', function () {
            closeOverlay();
            playExternalWithPlaylist(
                playlist[item.idx].url,
                playlist[item.idx].title,
                playlist
            );
        });

        row.on('hover:focus', function () {
            scroll.update(row);
        });

        scroll.append(row);
    });

    panel.append(scroll.render(true));
    overlay.append(panel);
    $('body').append(overlay);

    setTimeout(function () {
        try { Lampa.Layer.update(); } catch (e) {}
        overlay.addClass('lm-episodes-overlay--visible');
    }, 50);

    Lampa.Controller.add('lm_episodes', {
        toggle: function () {
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
        },
        up: function () {
            if (Navigator.canmove('up')) Navigator.move('up');
        },
        down: function () {
            if (Navigator.canmove('down')) Navigator.move('down');
        },
        right: function () {},
        left: function () {},
        back: function () {
            closeOverlay();
            if (show.seasons && show.seasons.length > 1) {
                showSeasonPicker(show);
            } else {
                Lampa.Controller.toggle('content');
            }
        }
    });
    Lampa.Controller.toggle('lm_episodes');

    function closeOverlay() {
        overlay.remove();
        scroll.destroy();
        Lampa.Controller.toggle('content');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    var months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
        'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    var day = parseInt(parts[2]);
    var month = parseInt(parts[1]) - 1;
    return day + ' ' + (months[month] || parts[1]);
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
