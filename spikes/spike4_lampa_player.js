/**
 * Spike 4: Test Lampa.Player.play() with an HTTP URL from a LAN backend.
 *
 * Prerequisites:
 *   - Serve a small test video on your LAN:
 *     python -m http.server 9091 --directory /path/to/folder/with/test.mp4
 *   - Install this plugin in Lampa and set the video URL in settings
 *
 * Expected outcome:
 *   - Clicking "Play Test" in the side menu plays the video via Lampa's player
 */
(function () {
    'use strict';

    if (window.plugin_spike4_loaded) return;
    window.plugin_spike4_loaded = true;

    function Spike4Component(object) {
        var html = document.createElement('div');
        html.style.padding = '2em';
        html.style.color = '#fff';
        html.style.fontSize = '1.4em';

        this.create = function () {
            var videoUrl = Lampa.Storage.get('spike4_video_url', '');
            if (!videoUrl) {
                html.innerHTML = '<p>Set a video URL in Settings → Spike4</p>';
                this.activity.loader(false);
                return;
            }

            var url = videoUrl;
            if (url.indexOf('http') === -1) url = 'http://' + url;

            html.innerHTML = '<p>Press Enter to play: ' + url + '</p>';

            var playBtn = document.createElement('div');
            playBtn.className = 'selector';
            playBtn.style.cssText = 'background:#404040;padding:1em 2em;border-radius:0.5em;display:inline-block;margin-top:1em;';
            playBtn.textContent = 'Play Video';
            playBtn.addEventListener('hover:enter', function () {
                Lampa.Player.play({ title: 'Spike4 Test Video', url: url });
                Lampa.Player.playlist([{ title: 'Spike4 Test Video', url: url }]);
            });
            html.appendChild(playBtn);

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

    function startSpike4() {
        var manifest = {
            type: 'plugin',
            version: '0.0.1',
            name: 'Spike4',
            description: 'LAN HTTP playback test',
            component: 'spike4'
        };

        Lampa.Manifest.plugins = manifest;
        Lampa.Component.add(manifest.component, Spike4Component);

        Lampa.SettingsApi.addComponent({
            component: 'spike4_config',
            name: 'Spike4',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>'
        });
        Lampa.SettingsApi.addParam({
            component: 'spike4_config',
            param: { name: 'spike4_video_url', type: 'input', placeholder: '192.168.1.100:9091/test.mp4', default: '' },
            field: { name: 'Video URL', description: 'Full HTTP URL to a test video file' }
        });

        function addMenu() {
            var button = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></div><div class="menu__text">Spike4</div></li>');
            button.on('hover:enter', function () {
                Lampa.Activity.push({ url: '', title: 'Spike4', component: 'spike4', page: 1 });
            });
            $('.menu .menu__list').eq(0).append(button);
        }

        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addMenu(); });
    }

    startSpike4();
})();
