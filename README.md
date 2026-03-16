# Lampa Local Media

Browse and play local media files from SMB shares inside [Lampa](https://github.com/lampa-app/LAMPA), with full TMDB metadata — posters, descriptions, genres, and ratings.

## How It Works

A **Python backend** connects to your NAS/server SMB shares, scans media files, parses filenames, matches them against TMDB, and serves a REST API. A **Lampa plugin** fetches the library and renders a poster wall inside Lampa's UI. Playback is streamed over HTTP from the backend.

## Quick Start

### 1. Start the Backend

```bash
# Copy example config
cp backend/config.example.yaml config.yaml
# Edit config.yaml with your SMB share details and TMDB API key

# Run with Docker
docker-compose -f backend/docker-compose.yml up -d

# Or run directly with Python
cd backend
pip install -e .
lampa-local-media
```

### 2. Install the Plugin

1. Open Lampa on your device
2. Go to **Settings → Plugins**
3. Add plugin URL: `https://YOUR_GITHUB_PAGES_URL/local-media.js`
4. Restart Lampa
5. Go to **Settings → Local Media** and enter your backend address (e.g. `192.168.1.100:9090`)
6. Click **Local Media** in the side menu

## Features

- Poster wall with TMDB metadata for matched movies and TV shows
- Season/episode browser for TV shows with playlist support
- "Play Local" button injected into native Lampa detail pages
- Automatic filename parsing via guessit
- NFO sidecar support (Kodi-style TMDB/IMDB IDs)
- HTTP streaming with seeking support (Range requests)
- Incremental scanning (skips unchanged files)
- Unmatched file browser with direct playback
- Multi-language UI (English, Russian, Ukrainian, Chinese)
- Settings page with rescan trigger and connection status

## Configuration

See [docs/config-reference.md](docs/config-reference.md) for all options.

Example `config.yaml`:
```yaml
server:
  host: "0.0.0.0"
  port: 9090

shares:
  - name: "Movies"
    type: "movies"
    smb_url: "smb://192.168.1.100/media/movies"
    username: "media_user"
    password: "${SMB_PASSWORD}"
  - name: "TV Shows"
    type: "tv"
    smb_url: "smb://192.168.1.100/media/tv"
    username: "media_user"
    password: "${SMB_PASSWORD}"

tmdb:
  api_key: "${TMDB_API_KEY}"
  language: "en"
```

## Folder Structure

See [docs/folder-naming.md](docs/folder-naming.md) for recommended naming.

```
Movies/
├── The Matrix (1999)/
│   └── The.Matrix.1999.1080p.mkv
├── Inception (2010)/
│   └── Inception.2010.mkv

TV Shows/
├── Breaking Bad/
│   ├── Season 01/
│   │   ├── Breaking.Bad.S01E01.mkv
│   │   └── Breaking.Bad.S01E02.mkv
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/status` | Share connectivity and stats |
| `GET /api/library` | Full library with metadata |
| `GET /api/movies` | Matched movies |
| `GET /api/shows` | Matched TV shows |
| `GET /api/shows/{id}/seasons/{n}/episodes` | Episodes |
| `GET /api/unmatched` | Unmatched files |
| `GET /api/stream/{item_id}` | Stream media file |
| `POST /api/rescan` | Trigger library rescan |

## Development

```bash
# Backend
cd backend
pip install -e ".[dev]"
pytest tests/ -v

# Plugin
cd plugin
npm install
npm run build
```

## License

MIT
