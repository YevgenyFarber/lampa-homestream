import { PLUGIN_COMPONENT_EPISODES } from './constants';
import { getEpisodes, streamUrl } from './api-client';
import { formatFileSize } from './utils';

export function EpisodeComponent(object) {
    var html = $('<div></div>');
    var scroll;
    var show;
    var season;

    this.create = function () {
        var self = this;
        this.activity.loader(true);

        show = object.local_media_show;
        season = object.local_media_season || (show.seasons && show.seasons[0]) || 1;

        if (!show) {
            this.activity.loader(false);
            return;
        }

        loadEpisodes(self, season);
    };

    function loadEpisodes(self, s) {
        season = s;

        getEpisodes(show.tmdb_id || show.id, season)
            .then(function (data) {
                self.activity.loader(false);
                renderEpisodes(data, self);
            })
            .catch(function (err) {
                self.activity.loader(false);
                Lampa.Noty.show(err.message);
            });
    }

    function renderEpisodes(data, self) {
        html.empty();
        scroll = new Lampa.Scroll({ mask: true, over: true });
        scroll.minus();
        html.append(scroll.render(true));

        var seasons = show.seasons || [];
        if (seasons.length > 1) {
            for (var i = 0; i < seasons.length; i++) {
                (function (sn) {
                    var active = sn === season;
                    var bg = active ? 'background:#fff;color:#000;' : 'background:#404040;color:#fff;';
                    var btn = $('<div class="selector" style="padding:0.6em 1.2em;margin:0.3em;border-radius:0.4em;font-size:1.1em;display:inline-block;' + bg + '"></div>');
                    btn.text(Lampa.Lang.translate('local_media_season') + ' ' + sn);
                    btn.on('hover:enter', function () {
                        html.empty();
                        scroll = null;
                        self.activity.loader(true);
                        loadEpisodes(self, sn);
                    });
                    btn.on('hover:focus', function () {
                        scroll.update(btn);
                    });
                    scroll.append(btn);
                })(seasons[i]);
            }
        }

        var episodes = data.episodes || [];
        var playlist = [];

        episodes.forEach(function (ep) {
            var epLabel = 'S' + String(season).padStart(2, '0') + 'E' +
                String(ep.episode_number).padStart(2, '0');
            playlist.push({
                title: (show.title || '') + ' ' + epLabel + (ep.title ? ' — ' + ep.title : ''),
                url: streamUrl(ep.id)
            });
        });

        episodes.forEach(function (ep, idx) {
            var epLabel = 'S' + String(season).padStart(2, '0') + 'E' +
                String(ep.episode_number).padStart(2, '0');
            var sizeStr = ep.file_size ? formatFileSize(ep.file_size) : '';

            var element = {
                title: epLabel + (ep.title ? ' — ' + ep.title : ''),
                quality: sizeStr,
                info: ep.air_date ? ' • ' + ep.air_date : ''
            };

            var item = Lampa.Template.get('online', element);
            item.addClass('video--stream selector');

            var hash = Lampa.Utils.hash(
                show.tmdb_id + '_s' + season + '_e' + ep.episode_number
            );
            var view = Lampa.Timeline.view(hash);
            item.append(Lampa.Timeline.render(view));

            item.on('hover:enter', function () {
                Lampa.Player.play({
                    url: playlist[idx].url,
                    title: playlist[idx].title,
                    timeline: view
                });

                Lampa.Player.playlist(playlist.map(function (p, pi) {
                    var epHash = Lampa.Utils.hash(
                        show.tmdb_id + '_s' + season + '_e' + episodes[pi].episode_number
                    );
                    return {
                        url: p.url,
                        title: p.title,
                        timeline: Lampa.Timeline.view(epHash)
                    };
                }));
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
