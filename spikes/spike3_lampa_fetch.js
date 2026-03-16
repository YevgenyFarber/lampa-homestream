/**
 * Spike 3: Minimal Lampa plugin to test fetch() to a LAN HTTP backend.
 *
 * Installation:
 *   1. Host this file (e.g. on a local HTTP server or GitHub Pages)
 *   2. Add the URL in Lampa → Settings → Plugins
 *   3. Restart Lampa
 *   4. Check if "Spike3" appears in the side menu
 *   5. Click it — should show the backend health response or an error
 *
 * Before testing:
 *   - Run a simple HTTP server on your LAN, e.g.:
 *     python -c "from http.server import *; import json; \
 *       class H(BaseHTTPRequestHandler): \
 *         def do_GET(self): self.send_response(200); self.send_header('Content-Type','application/json'); \
 *           self.send_header('Access-Control-Allow-Origin','*'); self.end_headers(); \
 *           self.wfile.write(json.dumps({'status':'ok','message':'spike3 works'}).encode()) \
 *       ; HTTPServer(('0.0.0.0',9090),H).serve_forever()"
 *   - Set the backend URL in Lampa Settings → Spike3 → Backend URL
 */
(function () {
    'use strict';

    if (window.plugin_spike3_loaded) return;
    window.plugin_spike3_loaded = true;

    function Spike3Component(object) {
        var html = document.createElement('div');
        html.style.padding = '2em';
        html.style.color = '#fff';
        html.style.fontSize = '1.4em';

        this.create = function () {
            this.activity.loader(true);
            var backendUrl = Lampa.Storage.get('spike3_backend_url', '');

            if (!backendUrl) {
                html.innerHTML = '<p>Set backend URL in Settings → Spike3</p>';
                this.activity.loader(false);
                return;
            }

            var url = backendUrl;
            if (url.indexOf('http') === -1) url = 'http://' + url;
            if (!url.endsWith('/')) url += '/';

            var self = this;
            html.innerHTML = '<p>Fetching ' + url + 'api/health ...</p>';

            fetch(url + 'api/health')
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    html.innerHTML = '<p style="color:lime">SUCCESS: ' + JSON.stringify(data) + '</p>';
                    self.activity.loader(false);
                })
                .catch(function (err) {
                    html.innerHTML = '<p style="color:red">FETCH FAILED: ' + err.message + '</p>' +
                        '<p>This means WebView blocks LAN fetch. Fallback: use AndroidJS.httpReq()</p>';
                    self.activity.loader(false);
                });
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {},
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { html.remove(); };
    }

    function startSpike3() {
        var manifest = {
            type: 'plugin',
            version: '0.0.1',
            name: 'Spike3',
            description: 'LAN fetch() connectivity test',
            component: 'spike3'
        };

        Lampa.Manifest.plugins = manifest;
        Lampa.Component.add(manifest.component, Spike3Component);

        Lampa.SettingsApi.addComponent({
            component: 'spike3_config',
            name: 'Spike3',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>'
        });
        Lampa.SettingsApi.addParam({
            component: 'spike3_config',
            param: { name: 'spike3_backend_url', type: 'input', placeholder: '192.168.1.100:9090', default: '' },
            field: { name: 'Backend URL', description: 'e.g. 192.168.1.100:9090' }
        });

        function addMenu() {
            var button = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg></div><div class="menu__text">Spike3</div></li>');
            button.on('hover:enter', function () {
                Lampa.Activity.push({ url: '', title: 'Spike3', component: 'spike3', page: 1 });
            });
            $('.menu .menu__list').eq(0).append(button);
        }

        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addMenu(); });
    }

    startSpike3();
})();
