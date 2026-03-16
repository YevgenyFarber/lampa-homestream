var STORAGE_KEY = 'lm_watch_progress';

function _getAll() {
    return Lampa.Storage.get(STORAGE_KEY, {});
}

function _saveAll(data) {
    Lampa.Storage.set(STORAGE_KEY, data);
}

export function getProgress(episodeId) {
    var all = _getAll();
    return all[episodeId] || null;
}

export function setProgress(episodeId, time, duration) {
    var all = _getAll();
    var percent = duration > 0 ? Math.min((time / duration) * 100, 100) : 0;
    all[episodeId] = {
        time: Math.floor(time),
        duration: Math.floor(duration),
        percent: Math.round(percent),
        timestamp: Date.now()
    };
    _saveAll(all);
}

export function markStarted(episodeId) {
    var all = _getAll();
    if (!all[episodeId]) {
        all[episodeId] = { time: 0, duration: 0, percent: 0, timestamp: Date.now() };
        _saveAll(all);
    }
}

export function markWatched(episodeId) {
    var all = _getAll();
    all[episodeId] = { time: 0, duration: 0, percent: 100, timestamp: Date.now() };
    _saveAll(all);
}

export function initPlayerTracking() {
    var currentEpisodeId = null;

    Lampa.Storage.listener.follow('change', function (e) {
        if (e.name === 'lm_now_playing') {
            currentEpisodeId = e.value || null;
        }
    });

    Lampa.Listener.follow('player', function (e) {
        if (!currentEpisodeId) {
            currentEpisodeId = Lampa.Storage.get('lm_now_playing', null);
        }
        if (!currentEpisodeId) return;

        if (e.type === 'timeupdate') {
            var time = e.current || 0;
            var duration = e.duration || 0;
            if (duration > 0 && time > 5) {
                setProgress(currentEpisodeId, time, duration);
            }
        }

        if (e.type === 'ended') {
            markWatched(currentEpisodeId);
            Lampa.Storage.set('lm_now_playing', '');
            currentEpisodeId = null;
        }

        if (e.type === 'destroy') {
            Lampa.Storage.set('lm_now_playing', '');
            currentEpisodeId = null;
        }
    });
}
