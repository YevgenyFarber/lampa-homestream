import { getBackendUrl } from './utils';
import { STORAGE_CACHE_KEY, STORAGE_CACHE_TIME, CACHE_TTL_MS } from './constants';

function request(path) {
    var base = getBackendUrl();
    if (!base) return Promise.reject(new Error('Backend URL not configured'));

    return fetch(base + path)
        .then(function (r) {
            if (!r.ok) {
                return r.json().then(function (body) {
                    var msg = (body && body.error && body.error.message) || ('HTTP ' + r.status);
                    throw new Error(msg);
                }).catch(function (e) {
                    if (e.message && e.message !== ('HTTP ' + r.status))
                        throw e;
                    throw new Error('HTTP ' + r.status);
                });
            }
            return r.json();
        });
}

export function getHealth() {
    return request('/api/health');
}

export function getStatus() {
    return request('/api/status');
}

export function getLibrary(useCache) {
    if (useCache !== false) {
        var cached = Lampa.Storage.get(STORAGE_CACHE_KEY, null);
        var cachedTime = Lampa.Storage.get(STORAGE_CACHE_TIME, 0);
        if (cached && (Date.now() - cachedTime) < CACHE_TTL_MS) {
            return Promise.resolve(cached);
        }
    }

    return request('/api/library').then(function (data) {
        Lampa.Storage.set(STORAGE_CACHE_KEY, data);
        Lampa.Storage.set(STORAGE_CACHE_TIME, Date.now());
        return data;
    });
}

export function getMovies() {
    return request('/api/movies');
}

export function getShows() {
    return request('/api/shows');
}

export function getEpisodes(showId, season) {
    return request('/api/shows/' + showId + '/seasons/' + season + '/episodes');
}

export function getUnmatched() {
    return request('/api/unmatched');
}

export function triggerRescan() {
    var base = getBackendUrl();
    if (!base) return Promise.reject(new Error('Backend URL not configured'));

    return fetch(base + '/api/rescan', { method: 'POST' })
        .then(function (r) { return r.json(); });
}

export function streamUrl(itemId) {
    var base = getBackendUrl();
    if (!base) return '';
    return base + '/api/stream/' + itemId;
}
