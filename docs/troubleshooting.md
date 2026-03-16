# Troubleshooting

## Backend Issues

### "Cannot connect to SMB share"

1. Verify the SMB URL format: `smb://hostname_or_ip/share_name`
2. Check that the NAS/server is reachable from the backend machine: `ping hostname`
3. Verify credentials — try connecting with `smbclient` manually
4. Ensure SMB2 or SMB3 is enabled on the NAS (SMB1 is not supported)
5. Check firewall rules — port 445 must be open

### "TMDB API key is invalid"

1. Get a free key at https://www.themoviedb.org/settings/api
2. Set it via environment variable: `TMDB_API_KEY=your_key_here`
3. Or in config.yaml: `tmdb.api_key: "your_key_here"`

### Backend not starting

1. Check Docker logs: `docker logs lampa-local-media`
2. Verify config.yaml syntax: `python -c "import yaml; yaml.safe_load(open('config.yaml'))"`
3. Ensure port 9090 is not in use: `lsof -i :9090`

### Scan is slow

- First scan indexes all files. Subsequent scans are incremental (much faster).
- Large libraries (10,000+ files) may take several minutes initially.
- The API remains responsive during scanning.

## Plugin Issues

### "Set backend URL in settings"

1. Open Lampa Settings → Local Media
2. Enter your backend IP and port: `192.168.1.100:9090`
3. Do not include `http://` — the plugin adds it automatically

### "Backend connection error"

1. Verify the backend is running: open `http://backend_ip:9090/api/health` in a browser
2. Ensure the Lampa device is on the same network as the backend
3. Check that no firewall blocks port 9090
4. Try using the backend IP address instead of hostname

### No posters showing

1. Verify TMDB API key is valid: `http://backend_ip:9090/api/config/validate`
2. Check that files are matched: `http://backend_ip:9090/api/library`
3. Unmatched files appear without posters — this is expected

### Video won't play

1. Try a different external player (VLC, MX Player)
2. Check the stream URL works in a browser: `http://backend_ip:9090/api/stream/ITEM_ID`
3. Ensure the file format is supported by your player
4. Check backend logs for streaming errors

### Plugin not showing in Lampa

1. Verify the plugin URL is correct in Lampa Settings → Plugins
2. Restart Lampa after adding the plugin
3. Check that the JavaScript file is accessible: open the URL in a browser
