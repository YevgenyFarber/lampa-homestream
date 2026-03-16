import { SETTINGS_COMPONENT, STORAGE_BACKEND_URL } from './constants';
import { triggerRescan, getHealth } from './api-client';
import { getBackendUrl } from './utils';

var MENU_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>' +
    '</svg>';

export function registerSettings() {
    Lampa.SettingsApi.addComponent({
        component: SETTINGS_COMPONENT,
        name: Lampa.Lang.translate('local_media_settings_title'),
        icon: MENU_ICON
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
