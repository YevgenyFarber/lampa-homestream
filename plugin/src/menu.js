import { PLUGIN_COMPONENT, PLUGIN_NAME } from './constants';

var MENU_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>' +
    '</svg>';

export function addMenuItem() {
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
