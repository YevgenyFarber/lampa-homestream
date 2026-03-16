import { PLUGIN_COMPONENT, PLUGIN_COMPONENT_EPISODES } from './constants';
import { getEpisodes, streamUrl } from './api-client';
import { formatFileSize, playExternalWithPlaylist } from './utils';

export function EpisodeComponent(object) {
    var html = $('<div></div>');
    var scroll;
    var show;

    this.create = function () {
        var self = this;
        this.activity.loader(true);

        show = this.activity.params && this.activity.params.local_media_show;
        if (!show) {
            this.activity.loader(false);
            return;
        }

        loadSeasons(self, 1);
    };

    function loadSeasons(self, season) {
        getEpisodes(show.tmdb_id || show.id, season)
            .then(function (data) {
                self.activity.loader(false);
                renderEpisodes(data, self);
            })
            .catch(function (err) {
                self.activity.loader(false);
                var errEl = Lampa.Template.js(PLUGIN_COMPONENT + '_error');
                errEl.find('.lm-error__text').text(err.message);
                errEl.find('.lm-error__retry').text(Lampa.Lang.translate('local_media_retry'));
                errEl.find('.lm-error__retry').on('hover:enter', function () {
                    html.empty();
                    scroll = null;
                    self.activity.loader(true);
                    loadSeasons(self, season);
                });
                html.append(errEl);
            });
    }

    function renderEpisodes(data, self) {
        html.empty();
        scroll = null;

        scroll = new Lampa.Scroll({ mask: true, over: true });
        html.append(scroll.render(true));

        if (show.season_count && show.season_count > 1) {
            for (var s = 1; s <= show.season_count; s++) {
                (function (sn) {
                    var active = sn === (data.season || 1);
                    var bg = active ? 'background:#fff;color:#000;' : 'background:#404040;color:#fff;';
                    var btn = $('<div class="selector" style="padding:0.6em 1.2em;margin:0.3em;border-radius:0.4em;font-size:1.1em;display:inline-block;' + bg + '"></div>');
                    btn.text(Lampa.Lang.translate('local_media_season') + ' ' + sn);
                    btn.on('hover:enter', function () {
                        html.empty();
                        scroll = null;
                        self.activity.loader(true);
                        loadSeasons(self, sn);
                    });
                    btn.on('hover:focus', function () {
                        scroll.update(btn);
                    });
                    scroll.append(btn);
                })(s);
            }
        }

        var episodes = data.episodes || [];
        var playlist = [];

        episodes.forEach(function (ep) {
            playlist.push({
                title: (show.title || '') + ' S' +
                    String(data.season || 1).padStart(2, '0') + 'E' +
                    String(ep.episode_number).padStart(2, '0') +
                    (ep.title ? ' - ' + ep.title : ''),
                url: streamUrl(ep.id)
            });
        });

        episodes.forEach(function (ep, idx) {
            var item = Lampa.Template.js(PLUGIN_COMPONENT + '_episode_item');

            item.find('.lm-episode__num').text(
                'E' + String(ep.episode_number).padStart(2, '0')
            );
            item.find('.lm-episode__title').text(ep.title || 'Episode ' + ep.episode_number);

            var info = '';
            if (ep.air_date) info += ep.air_date;
            if (ep.file_size) info += (info ? ' • ' : '') + formatFileSize(ep.file_size);
            item.find('.lm-episode__info').text(info);

            item.on('hover:enter', function () {
                playExternalWithPlaylist(playlist[idx].url, playlist[idx].title, playlist);
            });

            item.on('hover:focus', function () {
                scroll.update(item);
                if (ep.still_url) {
                    Lampa.Background.immediately(ep.still_url);
                } else if (show.backdrop_url) {
                    Lampa.Background.immediately(show.backdrop_url);
                }
            });

            scroll.append(item);
        });

        self.activity.toggle();
    }

    this.background = function () {
        if (show && show.backdrop_url) {
            Lampa.Background.immediately(show.backdrop_url);
        }
    };

    this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
        this.background();

        Lampa.Controller.add('content', {
            invisible: true,
            toggle: function () {
                Lampa.Controller.collectionSet(html);
                Lampa.Controller.collectionFocus(false, html);
            },
            left: function () {
                if (Navigator.canmove('left')) Navigator.move('left');
                else Lampa.Controller.toggle('menu');
            },
            up: function () {
                if (Navigator.canmove('up')) Navigator.move('up');
                else Lampa.Controller.toggle('head');
            },
            right: function () {
                Navigator.move('right');
            },
            down: function () {
                Navigator.move('down');
            },
            back: function () { Lampa.Activity.backward(); }
        });
        Lampa.Controller.toggle('content');
    };

    this.pause = function () {};
    this.stop = function () {};
    this.render = function () { return html; };
    this.destroy = function () {
        if (scroll) scroll.destroy();
        html.remove();
    };
}
