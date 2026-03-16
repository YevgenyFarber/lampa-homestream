import { PLUGIN_COMPONENT, PLUGIN_COMPONENT_EPISODES, PLUGIN_COMPONENT_UNMATCHED, PLUGIN_NAME, PLUGIN_VERSION } from './constants';
import { registerLang } from './lang';
import { registerTemplates } from './templates';
import { registerStyles } from './styles';
import { registerSettings } from './settings';
import { addMenuItem } from './menu';
import { MainComponent } from './component';
import { EpisodeComponent } from './episode-component';
import { UnmatchedComponent } from './unmatched-component';
import { registerPlayButton } from './play-button';

(function () {
    'use strict';

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
