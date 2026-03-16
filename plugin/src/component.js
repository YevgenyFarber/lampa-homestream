import { PLUGIN_COMPONENT, PLUGIN_COMPONENT_UNMATCHED } from './constants';
import { getLibrary, streamUrl } from './api-client';
import { getBackendUrl, formatFileSize, playExternal } from './utils';

export function MainComponent(object) {
    var html = $('<div></div>');
    var scroll, data;
    var last_focused;

    this.create = function () {
        var self = this;
        this.activity.loader(true);

        if (!getBackendUrl()) {
            showEmpty(Lampa.Lang.translate('local_media_no_backend'));
            this.activity.loader(false);
            return;
        }

        getLibrary()
            .then(function (lib) {
                data = lib;
                self.activity.loader(false);
                renderLibrary(lib, self);
            })
            .catch(function (err) {
                self.activity.loader(false);
                showError(err.message, function () {
                    self.create();
                });
            });
    };

    function renderLibrary(lib, self) {
        scroll = new Lampa.Scroll({ mask: true, over: true });
        scroll.minus();
        html.append(scroll.render(true));

        setTimeout(function () {
            try { Lampa.Layer.update(); } catch(e) {}
        }, 100);

        var hasContent = false;

        if (lib.movies && lib.movies.length) {
            hasContent = true;
            addSectionTitle(Lampa.Lang.translate('local_media_movies') + ' (' + lib.movies.length + ')');
            lib.movies.forEach(function (item) {
                addCard(item, 'movie');
            });
        }

        if (lib.shows && lib.shows.length) {
            hasContent = true;
            addSectionTitle(Lampa.Lang.translate('local_media_shows') + ' (' + lib.shows.length + ')');
            lib.shows.forEach(function (item) {
                addCard(item, 'tv');
            });
        }

        if (lib.unmatched && lib.unmatched.length) {
            hasContent = true;
            addSectionTitle(Lampa.Lang.translate('local_media_unmatched') + ' (' + lib.unmatched.length + ')');

            var unmatchedBtn = $('<div class="lm-btn selector" style="background:#404040;padding:1.5em;border-radius:0.6em;display:block;margin:0.5em;clear:both;"></div>');
            unmatchedBtn.text(Lampa.Lang.translate('local_media_unmatched') + ' →');
            unmatchedBtn.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('local_media_unmatched'),
                    component: PLUGIN_COMPONENT_UNMATCHED,
                    page: 1
                });
            });
            unmatchedBtn.on('hover:focus', function () {
                last_focused = unmatchedBtn;
                scroll.update(unmatchedBtn);
            });
            scroll.append(unmatchedBtn);
        }

        if (!hasContent) {
            showEmpty(Lampa.Lang.translate('local_media_empty_library'));
            return;
        }

        self.activity.toggle();
    }

    function addSectionTitle(text) {
        var title = $('<div style="padding:1.2em;font-size:1.4em;font-weight:600;display:block;"></div>');
        title.text(text);
        scroll.append(title);
    }

    function addCard(item, mediaType) {
        var card = Lampa.Template.js(PLUGIN_COMPONENT + '_card');

        if (item.poster_url) {
            var el = card.find('.lm-card__img');
            if (el && el.length) el[0].style.backgroundImage = 'url(' + item.poster_url + ')';
            else if (el && el.style) el.style.backgroundImage = 'url(' + item.poster_url + ')';
        }

        card.find('.lm-card__title').text(item.title || item.file_name || 'Unknown');

        var info = '';
        if (item.year) info += item.year;
        if (item.vote_average) info += (info ? ' • ' : '') + '★ ' + item.vote_average.toFixed(1);
        if (item.season_count) info += (info ? ' • ' : '') + item.season_count + ' seasons';
        card.find('.lm-card__info').text(info);

        card.on('hover:enter', function () {
            if (item.tmdb_id) {
                Lampa.Activity.push({
                    url: '',
                    component: 'full',
                    id: item.tmdb_id,
                    method: mediaType === 'tv' ? 'tv' : 'movie',
                    card: {
                        id: item.tmdb_id,
                        source: 'tmdb',
                        type: mediaType,
                        title: item.title,
                        original_title: item.original_title
                    }
                });
            } else {
                playExternal(streamUrl(item.id), item.title || item.file_name);
            }
        });

        card.on('hover:focus', function () {
            last_focused = card;
            scroll.update(card);
            if (item.backdrop_url) {
                Lampa.Background.immediately(item.backdrop_url);
            }
        });

        scroll.append(card);
    }

    function showEmpty(text) {
        var empty = new Lampa.Empty({ descr: text });
        html.empty();
        html.append(empty.render(true));
        this && this.start && (this.start = empty.start);
    }

    function showError(message, retryFn) {
        var errEl = Lampa.Template.js(PLUGIN_COMPONENT + '_error');
        errEl.find('.lm-error__text').text(
            Lampa.Lang.translate('local_media_error') + ': ' + message
        );
        errEl.find('.lm-error__retry').text(Lampa.Lang.translate('local_media_retry'));
        errEl.find('.lm-error__retry').on('hover:enter', retryFn);
        html.empty();
        html.append(errEl);
    }

    this.background = function () {
        Lampa.Background.immediately('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPkQ0rHRgAAAABJRU5ErkJggg==');
    };

    this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
        this.background();

        Lampa.Controller.add('content', {
            invisible: true,
            toggle: function () {
                if (scroll) {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last_focused || false, scroll.render());
                }
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

        if (last_focused && scroll) {
            setTimeout(function () {
                scroll.update(last_focused);
            }, 10);
        }
    };

    this.pause = function () {};
    this.stop = function () {};
    this.render = function () { return html; };
    this.destroy = function () {
        if (scroll) scroll.destroy();
        html.remove();
    };
}
