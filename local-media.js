(function () {
    'use strict';

    var PLUGIN_NAME = 'LocalMedia';
    var PLUGIN_VERSION = '0.1.0';
    var PLUGIN_COMPONENT = 'local_media';
    var PLUGIN_COMPONENT_EPISODES = 'local_media_episodes';
    var PLUGIN_COMPONENT_UNMATCHED = 'local_media_unmatched';
    var SETTINGS_COMPONENT = 'local_media_settings';

    var STORAGE_BACKEND_URL = 'local_media_backend_url';
    var STORAGE_CACHE_KEY = 'local_media_cache';
    var STORAGE_CACHE_TIME = 'local_media_cache_time';
    var CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    function registerLang() {
        Lampa.Lang.add({
            local_media_title: {
                ru: 'Локальные медиа',
                en: 'Local Media',
                uk: 'Локальні медіа',
                zh: '本地媒体'
            },
            local_media_settings_title: {
                ru: 'Локальные медиа',
                en: 'Local Media',
                uk: 'Локальні медіа',
                zh: '本地媒体'
            },
            local_media_backend_url: {
                ru: 'Адрес бэкенда',
                en: 'Backend URL',
                uk: 'Адреса бекенду',
                zh: '后端地址'
            },
            local_media_backend_url_desc: {
                ru: 'IP и порт бэкенда, например 192.168.1.100:9090',
                en: 'Backend IP and port, e.g. 192.168.1.100:9090',
                uk: 'IP та порт бекенду, напр. 192.168.1.100:9090',
                zh: '后端IP和端口，例如 192.168.1.100:9090'
            },
            local_media_rescan: {
                ru: 'Пересканировать библиотеку',
                en: 'Rescan Library',
                uk: 'Пересканувати бібліотеку',
                zh: '重新扫描媒体库'
            },
            local_media_rescan_desc: {
                ru: 'Запустить повторное сканирование SMB-папок',
                en: 'Trigger a new scan of SMB shares',
                uk: 'Запустити повторне сканування SMB-тек',
                zh: '触发SMB共享的新扫描'
            },
            local_media_rescan_started: {
                ru: 'Сканирование запущено',
                en: 'Scan started',
                uk: 'Сканування запущено',
                zh: '扫描已开始'
            },
            local_media_no_backend: {
                ru: 'Укажите адрес бэкенда в настройках',
                en: 'Set backend URL in settings',
                uk: 'Вкажіть адресу бекенду в налаштуваннях',
                zh: '请在设置中配置后端地址'
            },
            local_media_loading: {
                ru: 'Загрузка библиотеки...',
                en: 'Loading library...',
                uk: 'Завантаження бібліотеки...',
                zh: '正在加载媒体库...'
            },
            local_media_error: {
                ru: 'Ошибка подключения к бэкенду',
                en: 'Backend connection error',
                uk: 'Помилка підключення до бекенду',
                zh: '后端连接错误'
            },
            local_media_movies: {
                ru: 'Фильмы',
                en: 'Movies',
                uk: 'Фільми',
                zh: '电影'
            },
            local_media_shows: {
                ru: 'Сериалы',
                en: 'TV Shows',
                uk: 'Серіали',
                zh: '电视剧'
            },
            local_media_unmatched: {
                ru: 'Нераспознанные файлы',
                en: 'Unmatched Files',
                uk: 'Нерозпізнані файли',
                zh: '未匹配文件'
            },
            local_media_play_local: {
                ru: 'Воспроизвести локально',
                en: 'Play Local',
                uk: 'Відтворити локально',
                zh: '本地播放'
            },
            local_media_empty_library: {
                ru: 'Медиатека пуста',
                en: 'Library is empty',
                uk: 'Медіатека порожня',
                zh: '媒体库为空'
            },
            local_media_season: {
                ru: 'Сезон',
                en: 'Season',
                uk: 'Сезон',
                zh: '第'
            },
            local_media_episode: {
                ru: 'Серия',
                en: 'Episode',
                uk: 'Серія',
                zh: '集'
            },
            local_media_retry: {
                ru: 'Повторить',
                en: 'Retry',
                uk: 'Повторити',
                zh: '重试'
            }
        });
    }

    function registerTemplates() {
        Lampa.Template.add(PLUGIN_COMPONENT + '_main', '<div class="lm-main">' +
            '<div class="lm-main__body"></div>' +
        '</div>');

        Lampa.Template.add(PLUGIN_COMPONENT + '_section', '<div class="lm-section">' +
            '<div class="lm-section__head">' +
                '<div class="lm-section__title"></div>' +
            '</div>' +
            '<div class="lm-section__body"></div>' +
        '</div>');

        Lampa.Template.add(PLUGIN_COMPONENT + '_card', '<div class="lm-card selector">' +
            '<div class="lm-card__img-box">' +
                '<div class="lm-card__img"></div>' +
            '</div>' +
            '<div class="lm-card__title"></div>' +
            '<div class="lm-card__info"></div>' +
        '</div>');

        Lampa.Template.add(PLUGIN_COMPONENT + '_episode_item', '<div class="lm-episode selector">' +
            '<div class="lm-episode__num"></div>' +
            '<div class="lm-episode__body">' +
                '<div class="lm-episode__title"></div>' +
                '<div class="lm-episode__info"></div>' +
            '</div>' +
        '</div>');

        Lampa.Template.add(PLUGIN_COMPONENT + '_unmatched_item', '<div class="lm-unmatched selector">' +
            '<div class="lm-unmatched__icon">' +
                '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 ' +
                    '2l5 5h-5V4zM6 20V4h5v7h7v9H6z" fill="currentColor"/>' +
                '</svg>' +
            '</div>' +
            '<div class="lm-unmatched__name"></div>' +
            '<div class="lm-unmatched__size"></div>' +
        '</div>');

        Lampa.Template.add(PLUGIN_COMPONENT + '_loading', '<div class="lm-loading">' +
            '<div class="lm-loading__text"></div>' +
            '<div class="broadcast__scan"><div></div></div>' +
        '</div>');

        Lampa.Template.add(PLUGIN_COMPONENT + '_error', '<div class="lm-error">' +
            '<div class="lm-error__text"></div>' +
            '<div class="lm-error__retry selector"></div>' +
        '</div>');
    }

    function registerStyles() {
        Lampa.Template.add(PLUGIN_COMPONENT + '_style', '<style>' +
        // Main container
        '.lm-main { padding: 1em; }' +

        // Section
        '.lm-section { margin-bottom: 2em; }' +
        '.lm-section__head { padding: 0.5em 0; }' +
        '.lm-section__title { font-size: 1.6em; font-weight: 600; color: #fff; }' +
        '.lm-section__body { display: flex; flex-wrap: wrap; }' +

        // Card (poster style)
        '.lm-card { float: left; width: 12em; padding: 0.5em; cursor: pointer; position: relative; }' +
        '.lm-card__img-box { position: relative; padding-top: 150%; border-radius: 0.5em; overflow: hidden; background: #2a2a2a; }' +
        '.lm-card__img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; background-repeat: no-repeat; }' +
        '.lm-card__title { font-size: 1.1em; font-weight: 500; margin-top: 0.5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; }' +
        '.lm-card__info { font-size: 0.9em; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
        '.lm-card.focus .lm-card__img-box::after, .lm-card.hover .lm-card__img-box::after {' +
            'content: ""; position: absolute; top: -0.3em; left: -0.3em; right: -0.3em; bottom: -0.3em;' +
            'border: 0.2em solid #fff; border-radius: 0.7em; pointer-events: none; z-index: 1;' +
        '}' +

        // Episode list
        '.lm-episode { display: flex; align-items: center; padding: 1em 1.5em; margin: 0.3em 0; background: #2a2a2a; border-radius: 0.6em; position: relative; }' +
        '.lm-episode__num { font-size: 1.4em; font-weight: 700; min-width: 3em; text-align: center; color: rgba(255,255,255,0.5); }' +
        '.lm-episode__body { flex: 1; margin-left: 1em; }' +
        '.lm-episode__title { font-size: 1.2em; font-weight: 500; color: #fff; }' +
        '.lm-episode__info { font-size: 0.9em; color: rgba(255,255,255,0.5); margin-top: 0.2em; }' +
        '.lm-episode.focus::after, .lm-episode.hover::after {' +
            'content: ""; position: absolute; top: -0.3em; left: -0.3em; right: -0.3em; bottom: -0.3em;' +
            'border: 0.2em solid #fff; border-radius: 0.9em; pointer-events: none;' +
        '}' +

        // Unmatched file
        '.lm-unmatched { display: flex; align-items: center; padding: 1em 1.5em; margin: 0.3em 0; background: #2a2a2a; border-radius: 0.6em; position: relative; }' +
        '.lm-unmatched__icon { opacity: 0.5; margin-right: 1.5em; }' +
        '.lm-unmatched__icon svg { width: 2em; height: 2em; }' +
        '.lm-unmatched__name { flex: 1; font-size: 1.2em; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
        '.lm-unmatched__size { margin-left: 1em; color: rgba(255,255,255,0.5); white-space: nowrap; }' +
        '.lm-unmatched.focus::after, .lm-unmatched.hover::after {' +
            'content: ""; position: absolute; top: -0.3em; left: -0.3em; right: -0.3em; bottom: -0.3em;' +
            'border: 0.2em solid #fff; border-radius: 0.9em; pointer-events: none;' +
        '}' +

        // Loading
        '.lm-loading { text-align: center; padding: 3em; }' +
        '.lm-loading__text { font-size: 1.4em; margin-bottom: 1.5em; color: #fff; }' +

        // Error
        '.lm-error { text-align: center; padding: 3em; }' +
        '.lm-error__text { font-size: 1.3em; color: #e74c3c; margin-bottom: 1.5em; }' +
        '.lm-error__retry { display: inline-block; padding: 0.8em 2em; background: #404040; border-radius: 0.5em; color: #fff; font-size: 1.1em; }' +
        '.lm-error__retry.focus, .lm-error__retry.hover { background: #fff; color: #000; }' +

        '</style>');
    }

    function getBackendUrl() {
        var url = Lampa.Storage.get(STORAGE_BACKEND_URL, '');
        if (!url) return '';
        if (url.indexOf('http') === -1) url = 'http://' + url;
        return url.replace(/\/+$/, '');
    }

    function formatFileSize(bytes) {
        if (!bytes) return '';
        var units = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = 0;
        var size = bytes;
        while (size >= 1024 && i < units.length - 1) {
            size /= 1024;
            i++;
        }
        return size.toFixed(1) + ' ' + units[i];
    }

    function request(path) {
        var base = getBackendUrl();
        if (!base) return Promise.reject(new Error('Backend URL not configured'));

        return fetch(base + path)
            .then(function (r) {
                if (!r.ok) {
                    return r.json().then(function (body) {
                        var msg = (body && body.error && body.error.message) || ('HTTP ' + r.status);
                        throw new Error(msg);
                    }).catch(function (e) {
                        if (e.message && e.message !== ('HTTP ' + r.status))
                            throw e;
                        throw new Error('HTTP ' + r.status);
                    });
                }
                return r.json();
            });
    }

    function getLibrary(useCache) {
        if (useCache !== false) {
            var cached = Lampa.Storage.get(STORAGE_CACHE_KEY, null);
            var cachedTime = Lampa.Storage.get(STORAGE_CACHE_TIME, 0);
            if (cached && (Date.now() - cachedTime) < CACHE_TTL_MS) {
                return Promise.resolve(cached);
            }
        }

        return request('/api/library').then(function (data) {
            Lampa.Storage.set(STORAGE_CACHE_KEY, data);
            Lampa.Storage.set(STORAGE_CACHE_TIME, Date.now());
            return data;
        });
    }

    function getEpisodes(showId, season) {
        return request('/api/shows/' + showId + '/seasons/' + season + '/episodes');
    }

    function getUnmatched() {
        return request('/api/unmatched');
    }

    function triggerRescan() {
        var base = getBackendUrl();
        if (!base) return Promise.reject(new Error('Backend URL not configured'));

        return fetch(base + '/api/rescan', { method: 'POST' })
            .then(function (r) { return r.json(); });
    }

    function streamUrl(itemId) {
        var base = getBackendUrl();
        if (!base) return '';
        return base + '/api/stream/' + itemId;
    }

    var MENU_ICON$1 = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>' +
        '</svg>';

    function registerSettings() {
        Lampa.SettingsApi.addComponent({
            component: SETTINGS_COMPONENT,
            name: Lampa.Lang.translate('local_media_settings_title'),
            icon: MENU_ICON$1
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: {
                name: STORAGE_BACKEND_URL,
                type: 'input',
                placeholder: '192.168.1.100:9090',
                values: '',
                default: ''
            },
            field: {
                name: Lampa.Lang.translate('local_media_backend_url'),
                description: Lampa.Lang.translate('local_media_backend_url_desc')
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: {
                name: 'local_media_rescan_btn',
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('local_media_rescan'),
                description: Lampa.Lang.translate('local_media_rescan_desc')
            },
            onChange: function () {
                if (!getBackendUrl()) {
                    Lampa.Noty.show(Lampa.Lang.translate('local_media_no_backend'));
                    return;
                }
                triggerRescan()
                    .then(function () {
                        Lampa.Noty.show(Lampa.Lang.translate('local_media_rescan_started'));
                    })
                    .catch(function (e) {
                        Lampa.Noty.show(Lampa.Lang.translate('local_media_error') + ': ' + e.message);
                    });
            }
        });
    }

    var MENU_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>' +
        '</svg>';

    function addMenuItem() {
        var button = $('<li class="menu__item selector">' +
            '<div class="menu__ico">' + MENU_ICON + '</div>' +
            '<div class="menu__text">' + Lampa.Lang.translate('local_media_title') + '</div>' +
        '</li>');

        button.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: Lampa.Lang.translate('local_media_title'),
                component: PLUGIN_COMPONENT,
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(button);
    }

    function MainComponent(object) {
        var html = Lampa.Template.js(PLUGIN_COMPONENT + '_main');
        var body = html.find('.lm-main__body');
        var scroll;

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

                var unmatchedBtn = $('<div class="selector" style="background:#404040;padding:1.5em;border-radius:0.6em;display:inline-block;margin:0.5em;"></div>');
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
                    scroll.update(unmatchedBtn);
                });
                scroll.append(unmatchedBtn);
            }

            if (!hasContent) {
                showEmpty(Lampa.Lang.translate('local_media_empty_library'));
            }

            self.activity.toggle();
        }

        function addSectionTitle(text) {
            var title = $('<div class="lm-section__title" style="clear:both;padding:1.2em;font-size:1.4em;font-weight:600;"></div>');
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

    function EpisodeComponent(object) {
        var html = Lampa.Template.js(PLUGIN_COMPONENT + '_main');
        var body = html.find('.lm-main__body');
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
                        body.empty();
                        self.activity.loader(true);
                        loadSeasons(self, season);
                    });
                    body.append(errEl);
                });
        }

        function renderEpisodes(data, self) {
            scroll = new Lampa.Scroll({ mask: true, over: true });
            body.append(scroll.render(true));

            if (show.season_count && show.season_count > 1) {
                for (var s = 1; s <= show.season_count; s++) {
                    (function (sn) {
                        var active = sn === (data.season || 1);
                        var bg = active ? 'background:#fff;color:#000;' : 'background:#404040;color:#fff;';
                        var btn = $('<div class="selector" style="padding:0.6em 1.2em;margin:0.3em;border-radius:0.4em;font-size:1.1em;display:inline-block;' + bg + '"></div>');
                        btn.text(Lampa.Lang.translate('local_media_season') + ' ' + sn);
                        btn.on('hover:enter', function () {
                            body.empty();
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
                    Lampa.Player.play(playlist[idx]);
                    Lampa.Player.playlist(playlist);
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

    function UnmatchedComponent(object) {
        var html = Lampa.Template.js(PLUGIN_COMPONENT + '_main');
        var body = html.find('.lm-main__body');
        var scroll;

        this.create = function () {
            var self = this;
            this.activity.loader(true);

            getUnmatched()
                .then(function (data) {
                    self.activity.loader(false);
                    renderFiles(data.unmatched || data, self);
                })
                .catch(function (err) {
                    self.activity.loader(false);
                    var errEl = Lampa.Template.js(PLUGIN_COMPONENT + '_error');
                    errEl.find('.lm-error__text').text(err.message);
                    errEl.find('.lm-error__retry').text(Lampa.Lang.translate('local_media_retry'));
                    errEl.find('.lm-error__retry').on('hover:enter', function () {
                        body.empty();
                        self.create();
                    });
                    body.append(errEl);
                });
        };

        function renderFiles(files, self) {
            scroll = new Lampa.Scroll({ mask: true, over: true });
            body.append(scroll.render(true));

            if (!files || !files.length) {
                var empty = new Lampa.Empty({ descr: Lampa.Lang.translate('local_media_empty_library') });
                scroll.append(empty.render(true));
                self.activity.toggle();
                return;
            }

            files.forEach(function (file) {
                var item = Lampa.Template.js(PLUGIN_COMPONENT + '_unmatched_item');
                item.find('.lm-unmatched__name').text(file.file_name || file.file_path || 'Unknown');
                item.find('.lm-unmatched__size').text(formatFileSize(file.file_size));

                item.on('hover:enter', function () {
                    Lampa.Player.play({
                        title: file.file_name || file.file_path,
                        url: streamUrl(file.id)
                    });
                });

                item.on('hover:focus', function () {
                    scroll.update(item);
                });

                scroll.append(item);
            });

            self.activity.toggle();
        }

        this.start = function () {
            if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;

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

    /**
     * Injects a "Play Local" button into native Lampa TMDB detail pages
     * when the displayed item has a local file available.
     */
    function registerPlayButton() {
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
                    Lampa.Player.play({
                        title: localItem.title || card.title || card.name,
                        url: streamUrl(localItem.id)
                    });
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

    (function () {

        if (window.plugin_local_media_loaded) return;
        window.plugin_local_media_loaded = true;

        function startPlugin() {
            registerLang();

            var manifest = {
                type: 'plugin',
                version: PLUGIN_VERSION,
                name: PLUGIN_NAME,
                description: 'Browse and play local media from SMB shares with TMDB metadata',
                component: PLUGIN_COMPONENT
            };

            Lampa.Manifest.plugins = manifest;

            registerTemplates();
            registerStyles();

            Lampa.Component.add(PLUGIN_COMPONENT, MainComponent);
            Lampa.Component.add(PLUGIN_COMPONENT_EPISODES, EpisodeComponent);
            Lampa.Component.add(PLUGIN_COMPONENT_UNMATCHED, UnmatchedComponent);

            registerPlayButton();

            function onReady() {
                registerSettings();
                addMenuItem();
                $('body').append(Lampa.Template.get(PLUGIN_COMPONENT + '_style', {}, true));
            }

            if (window.appready) {
                onReady();
            } else {
                Lampa.Listener.follow('app', function (e) {
                    if (e.type === 'ready') onReady();
                });
            }
        }

        startPlugin();
    })();

})();
