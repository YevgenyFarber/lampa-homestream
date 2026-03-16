import { PLUGIN_COMPONENT } from './constants';

export function registerTemplates() {
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
