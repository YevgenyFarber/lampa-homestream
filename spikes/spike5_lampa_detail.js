/**
 * Spike 5: Test opening Lampa's native TMDB detail page from plugin code.
 *
 * Tests:
 *   1. Lampa.Activity.push() with component 'full' and a TMDB movie ID
 *   2. Lampa.Listener.follow('full', ...) to inject a custom button
 *
 * Expected outcome:
 *   - Clicking "Open The Matrix" opens Lampa's native detail page for TMDB ID 603
 *   - A "Spike5 Button" appears in the detail page's button area
 */
(function () {
    'use strict';

    if (window.plugin_spike5_loaded) return;
    window.plugin_spike5_loaded = true;

    // Listen for detail page builds to inject a custom button
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            var btnArea = null;
            if (e.body) btnArea = e.body.find('.full-start-new__buttons, .full-start__buttons');
            if (btnArea && btnArea.length) {
                var exists = btnArea.find('.spike5-btn');
                if (exists.length) return;

                var btn = $('<div class="full-start__button selector spike5-btn"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:1.5em;height:1.5em"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg><span>Spike5 Button</span></div>');
                btn.on('hover:enter', function () {
                    Lampa.Noty.show('Spike5 button clicked! Injection works.');
                });
                btnArea.append(btn);
            }
        }
    });

    function Spike5Component(object) {
        var html = document.createElement('div');
        html.style.padding = '2em';
        html.style.color = '#fff';
        html.style.fontSize = '1.4em';

        this.create = function () {
            // Test items: well-known TMDB IDs
            var testItems = [
                { tmdb_id: 603, title: 'The Matrix', type: 'movie' },
                { tmdb_id: 550, title: 'Fight Club', type: 'movie' },
                { tmdb_id: 1396, title: 'Breaking Bad', type: 'tv' }
            ];

            var container = document.createElement('div');
            container.innerHTML = '<p>Click an item to test opening native Lampa detail page:</p>';

            testItems.forEach(function (item) {
                var btn = document.createElement('div');
                btn.className = 'selector';
                btn.style.cssText = 'background:#404040;padding:1em 2em;border-radius:0.5em;margin:0.5em 0;display:inline-block;margin-right:1em;';
                btn.textContent = item.title + ' (' + item.type + ' #' + item.tmdb_id + ')';
                btn.addEventListener('hover:enter', function () {
                    // This is the critical test: can we open a native detail page?
                    Lampa.Activity.push({
                        url: '',
                        component: 'full',
                        id: item.tmdb_id,
                        method: item.type,
                        card: {
                            id: item.tmdb_id,
                            source: 'tmdb',
                            type: item.type,
                            title: item.title
                        }
                    });
                });
                container.appendChild(btn);
            });

            html.appendChild(container);
            this.activity.loader(false);
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(html);
                    Lampa.Controller.collectionFocus(false, html);
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { html.remove(); };
    }

    function startSpike5() {
        var manifest = {
            type: 'plugin',
            version: '0.0.1',
            name: 'Spike5',
            description: 'Native TMDB detail page test',
            component: 'spike5'
        };

        Lampa.Manifest.plugins = manifest;
        Lampa.Component.add(manifest.component, Spike5Component);

        function addMenu() {
            var button = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/></svg></div><div class="menu__text">Spike5</div></li>');
            button.on('hover:enter', function () {
                Lampa.Activity.push({ url: '', title: 'Spike5', component: 'spike5', page: 1 });
            });
            $('.menu .menu__list').eq(0).append(button);
        }

        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addMenu(); });
    }

    startSpike5();
})();
