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

export function debounce(fn, delay) {
    var timer;
    return function () {
        var args = arguments;
        var ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
}
