import { PLUGIN_COMPONENT } from './constants';

export function registerStyles() {
    Lampa.Template.add(PLUGIN_COMPONENT + '_style', '<style>' +
    // Main container
    '.lm-main { padding: 1em; }' +

    // Section
    '.lm-section { margin-bottom: 2em; }' +
    '.lm-section__head { padding: 0.5em 0; }' +
    '.lm-section__title { font-size: 1.6em; font-weight: 600; color: #fff; }' +
    '.lm-section__body { display: flex; flex-wrap: wrap; }' +

    // Card (poster style)
    '.lm-card { display: inline-block; vertical-align: top; width: 12em; padding: 0.5em; cursor: pointer; position: relative; }' +
    '.lm-card__img-box { position: relative; padding-top: 150%; border-radius: 0.5em; overflow: hidden; background: #2a2a2a; }' +
    '.lm-card__img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; background-repeat: no-repeat; }' +
    '.lm-card__title { font-size: 1.1em; font-weight: 500; margin-top: 0.5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; }' +
    '.lm-card__info { font-size: 0.9em; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
    '.lm-card.focus::after, .lm-card.hover::after {' +
        'content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;' +
        'border: 0.3em solid #fff; border-radius: 0.7em; pointer-events: none; z-index: 2;' +
    '}' +
    '.lm-card.focus .lm-card__title, .lm-card.hover .lm-card__title { color: #fff; }' +

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

    // Button focus
    '.lm-btn.focus, .lm-btn.hover { background: #fff !important; color: #000 !important; }' +

    // Episode overlay panel
    '.lm-episodes-overlay { position: fixed; top: 0; right: -30em; width: 30em; height: 100%; z-index: 999; transition: right 0.3s ease; }' +
    '.lm-episodes-overlay--visible { right: 0; }' +
    '.lm-episodes-panel { width: 100%; height: 100%; background: rgba(20,20,20,0.97); display: flex; flex-direction: column; }' +
    '.lm-episodes-panel__title { padding: 1.5em; font-size: 1.3em; font-weight: 600; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }' +
    '.lm-episodes-panel__list { flex: 1; overflow: hidden; }' +

    // Episode row
    '.lm-ep-row { display: flex; align-items: center; padding: 0.8em 1.2em; cursor: pointer; position: relative; }' +
    '.lm-ep-row.focus, .lm-ep-row.hover { background: rgba(255,255,255,0.1); }' +
    '.lm-ep-row.focus::before, .lm-ep-row.hover::before {' +
        'content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 0.25em; background: #3388ff;' +
    '}' +
    '.lm-ep-row__thumb { width: 8em; height: 4.5em; border-radius: 0.4em; background-size: cover; background-position: center; background-color: #333; flex-shrink: 0; position: relative; overflow: hidden; }' +
    '.lm-ep-row__num { position: absolute; bottom: 0.3em; left: 0.4em; background: rgba(0,0,0,0.7); color: #fff; padding: 0.1em 0.4em; border-radius: 0.2em; font-size: 0.85em; font-weight: 700; }' +
    '.lm-ep-row__num-only { width: 3em; text-align: center; font-size: 1.3em; font-weight: 700; color: rgba(255,255,255,0.4); flex-shrink: 0; }' +
    '.lm-ep-row__info { flex: 1; margin-left: 1em; overflow: hidden; }' +
    '.lm-ep-row__title { font-size: 1.1em; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
    '.lm-ep-row__sub { font-size: 0.85em; color: rgba(255,255,255,0.5); margin-top: 0.2em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
    '.lm-ep-row__progress { height: 0.2em; background: rgba(255,255,255,0.15); border-radius: 0.1em; margin-top: 0.4em; overflow: hidden; }' +
    '.lm-ep-row__progress-fill { height: 100%; background: #3388ff; border-radius: 0.1em; transition: width 0.3s; }' +
    '.lm-ep-row__progress-fill--done { background: #4caf50; }' +

    '</style>');
}
