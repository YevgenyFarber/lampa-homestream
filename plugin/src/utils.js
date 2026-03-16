import { STORAGE_BACKEND_URL } from './constants';

export function getBackendUrl() {
    var url = Lampa.Storage.get(STORAGE_BACKEND_URL, '');
    if (!url) return '';
    if (url.indexOf('http') === -1) url = 'http://' + url;
    return url.replace(/\/+$/, '');
}

export function formatFileSize(bytes) {
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

/**
 * Play a video URL using the external/third-party player on Android,
 * falling back to Lampa's built-in player on other platforms.
 */
export function playExternal(url, title) {
    if (typeof AndroidJS !== 'undefined' && AndroidJS.openPlayer) {
        var json = JSON.stringify({ url: url, title: title || '' });
        AndroidJS.openPlayer(url, json);
    } else {
        Lampa.Player.play({ title: title || '', url: url });
    }
}

/**
 * Play a video with playlist support via external player.
 */
export function playExternalWithPlaylist(url, title, playlist) {
    if (typeof AndroidJS !== 'undefined' && AndroidJS.openPlayer) {
        var json = JSON.stringify({
            url: url,
            title: title || '',
            playlist: playlist || []
        });
        AndroidJS.openPlayer(url, json);
    } else {
        Lampa.Player.play({ title: title || '', url: url });
        if (playlist && playlist.length) {
            Lampa.Player.playlist(playlist);
        }
    }
}

export function debounce(fn, delay) {
    var timer;
    return function () {
        var args = arguments;
        var ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
}
