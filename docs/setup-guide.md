# Setup Guide

## Prerequisites

- A NAS or server with media files accessible via SMB (Windows sharing / Samba)
- Docker installed on the NAS/server (or Python 3.11+)
- A TMDB API key (free at https://www.themoviedb.org/settings/api)
- Lampa installed on an Android device or Android TV

## Step 1: Configure the Backend

Create a config directory and config file:

```bash
mkdir -p lampa-local-media/config
```

Create `lampa-local-media/config/config.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 9090

shares:
  - name: "Movies"
    type: "movies"
    smb_url: "smb://YOUR_NAS_IP/movies"
    username: "YOUR_SMB_USER"
    password: "${SMB_PASSWORD}"

  - name: "TV Shows"
    type: "tv"
    smb_url: "smb://YOUR_NAS_IP/tv"
    username: "YOUR_SMB_USER"
    password: "${SMB_PASSWORD}"

tmdb:
  api_key: "${TMDB_API_KEY}"
  language: "en"
```

## Step 2: Start the Backend

### Docker (recommended)

```bash
cd lampa-local-media

docker run -d \
  --name lampa-local-media \
  -p 9090:9090 \
  -v $(pwd)/config:/config \
  -v $(pwd)/data:/data \
  -e SMB_PASSWORD=your_smb_password \
  -e TMDB_API_KEY=your_tmdb_key \
  --restart unless-stopped \
  ghcr.io/YOUR_USERNAME/lampa-local-media-backend:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"
services:
  lampa-local-media:
    image: ghcr.io/YOUR_USERNAME/lampa-local-media-backend:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config:/config
      - ./data:/data
    environment:
      - SMB_PASSWORD=your_smb_password
      - TMDB_API_KEY=your_tmdb_key
    restart: unless-stopped
```

Then: `docker-compose up -d`

### Python (no Docker)

```bash
cd backend
pip install -e .
SMB_PASSWORD=secret TMDB_API_KEY=key lampa-local-media
```

## Step 3: Verify the Backend

Open in a browser:
- `http://YOUR_SERVER_IP:9090/api/health` — should show `{"status": "ok"}`
- `http://YOUR_SERVER_IP:9090/api/status` — should show connected shares

Wait for the initial scan to complete (check `scan_in_progress` in status).

## Step 4: Install the Plugin

1. Open Lampa on your device
2. Navigate to **Settings → Plugins**
3. Add the plugin URL
4. Restart Lampa

## Step 5: Configure the Plugin

1. Navigate to **Settings → Local Media**
2. Enter the backend address: `YOUR_SERVER_IP:9090`
3. Go back to the main menu
4. Click **Local Media** in the side menu
5. You should see your poster wall

## Updating

**Backend:** Pull the new Docker image and restart:
```bash
docker pull ghcr.io/YOUR_USERNAME/lampa-local-media-backend:latest
docker-compose up -d
```

**Plugin:** The plugin auto-updates when you restart Lampa (loads fresh from URL).
