# Configuration Reference

The backend is configured via a YAML file. By default it looks for `/config/config.yaml` (Docker) or `config.yaml` (local).

Environment variables can be interpolated using `${VAR_NAME}` syntax.

## Server

```yaml
server:
  host: "0.0.0.0"    # Bind address
  port: 9090          # HTTP port
```

## Shares

Each share maps to an SMB network path.

```yaml
shares:
  - name: "Movies"              # Display name (used internally)
    type: "movies"               # "movies" or "tv" — helps the matcher
    smb_url: "smb://host/share"  # SMB URL to the share root
    username: "user"             # SMB username
    password: "${SMB_PASSWORD}"  # SMB password (use env var)
```

Multiple shares are supported. Each is scanned independently.

## TMDB

```yaml
tmdb:
  api_key: "${TMDB_API_KEY}"     # TMDB API v3 key
  language: "en"                  # Language for metadata (en, ru, etc.)
```

Get a free API key at https://www.themoviedb.org/settings/api

## Scanner

```yaml
scanner:
  extensions:                     # File extensions to index
    - ".mkv"
    - ".mp4"
    - ".avi"
    - ".m4v"
    - ".ts"
    - ".mov"
    - ".wmv"
    - ".flv"
    - ".webm"
  exclude_patterns:               # Glob patterns to skip
    - "**/sample/**"
    - "**/extras/**"
    - "**/.recycle/**"
  scan_interval_hours: 6          # Auto-rescan interval (0 = manual only)
```

## Data Directory

```yaml
data_dir: "./data"                # Where SQLite database is stored
```

In Docker, mount a volume to `/data` for persistence.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SMB_PASSWORD` | SMB share password |
| `TMDB_API_KEY` | TMDB API key |
| `LLM_CONFIG_PATH` | Alternative config file path |
