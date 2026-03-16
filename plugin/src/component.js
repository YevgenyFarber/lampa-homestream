import { PLUGIN_COMPONENT, PLUGIN_COMPONENT_EPISODES, PLUGIN_COMPONENT_UNMATCHED } from './constants';
import { getLibrary, streamUrl } from './api-client';
import { getBackendUrl, formatFileSize } from './utils';

export function MainComponent(object) {
    var html = Lampa.Template.js(PLUGIN_COMPONENT + '_main');
    var body = html.find('.lm-main__body');
    var scroll, data;

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
        body.append(scroll.render(true));

        var hasContent = false;

        if (lib.movies && lib.movies.length) {
            hasContent = true;
            renderSection(Lampa.Lang.translate('local_media_movies'), lib.movies, 'movie', scroll);
        }

        if (lib.shows && lib.shows.length) {
            hasContent = true;
            renderSection(Lampa.Lang.translate('local_media_shows'), lib.shows, 'tv', scroll);
        }

        if (lib.unmatched && lib.unmatched.length) {
            hasContent = true;
            var unmatchedSection = Lampa.Template.js(PLUGIN_COMPONENT + '_section');
            unmatchedSection.find('.lm-section__title').text(
                Lampa.Lang.translate('local_media_unmatched') + ' (' + lib.unmatched.length + ')'
            );

            var unmatchedBtn = document.createElement('div');
            unmatchedBtn.className = 'lm-card selector';
            unmatchedBtn.style.cssText = 'background:#404040;padding:1.5em;border-radius:0.6em;width:auto;float:none;display:inline-block;';
            unmatchedBtn.textContent = Lampa.Lang.translate('local_media_unmatched') + ' →';
            unmatchedBtn.addEventListener('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('local_media_unmatched'),
                    component: PLUGIN_COMPONENT_UNMATCHED,
                    page: 1
                });
            });
            unmatchedSection.find('.lm-section__body').append(unmatchedBtn);
            scroll.append(unmatchedSection);
        }

        if (!hasContent) {
            showEmpty(Lampa.Lang.translate('local_media_empty_library'));
        }

        self.activity.toggle();
    }

    function renderSection(title, items, mediaType, scroll) {
        var section = Lampa.Template.js(PLUGIN_COMPONENT + '_section');
        section.find('.lm-section__title').text(title + ' (' + items.length + ')');

        var sectionBody = section.find('.lm-section__body');

        items.forEach(function (item) {
            var card = Lampa.Template.js(PLUGIN_COMPONENT + '_card');

            if (item.poster_url) {
                var imgEl = card.find('.lm-card__img');
                var el = imgEl[0] || imgEl;
                if (el && el.style) el.style.backgroundImage = 'url(' + item.poster_url + ')';
            }

            card.find('.lm-card__title').text(item.title || item.file_name || 'Unknown');

            var info = '';
            if (item.year) info += item.year;
            if (item.vote_average) info += (info ? ' • ' : '') + '★ ' + item.vote_average.toFixed(1);
            if (item.season_count) info += (info ? ' • ' : '') + item.season_count + ' seasons';
            card.find('.lm-card__info').text(info);

            card.on('hover:enter', function () {
                if (mediaType === 'tv' && item.tmdb_id) {
                    Lampa.Activity.push({
                        url: '',
                        title: item.title,
                        component: PLUGIN_COMPONENT_EPISODES,
                        page: 1,
                        local_media_show: item
                    });
                } else if (item.tmdb_id) {
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
                    Lampa.Player.play({
                        title: item.title || item.file_name,
                        url: streamUrl(item.id)
                    });
                }
            });

            card.on('hover:focus', function () {
                if (scroll) scroll.update(card);
                if (item.backdrop_url) {
                    Lampa.Background.immediately(item.backdrop_url);
                }
            });

            sectionBody.append(card);
        });

        scroll.append(section);
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
        body.empty();
        body.append(errEl);
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
            right: function () { Navigator.move('right'); },
            down: function () { Navigator.move('down'); },
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
