# Discovery Spikes

Run these before full implementation to validate critical unknowns.

## Spike 1: SMB Connectivity
```bash
pip install smbprotocol
python spike1_smb_connect.py --host NAS_IP --share media --user admin --password secret
```
Validates: smbprotocol can connect, list dirs, and read file bytes.

## Spike 2: Filename Parsing
```bash
pip install guessit
python spike2_guessit_parse.py
```
Validates: guessit correctly parses 20 representative filenames.

## Spike 3: Lampa WebView Fetch
1. Run a test HTTP server: `python -m http.server 9090`
2. Host `spike3_lampa_fetch.js` on any HTTP server
3. Add plugin URL in Lampa Settings → Plugins
4. Set backend URL in Settings → Spike3
5. Click "Spike3" in side menu

Validates: WebView `fetch()` works to LAN HTTP endpoints.

## Spike 4: Lampa Player with HTTP URL
1. Serve a test video: `python -m http.server 9091`
2. Host `spike4_lampa_player.js` and install in Lampa
3. Set video URL in Settings → Spike4
4. Click "Spike4" → "Play Video"

Validates: `Lampa.Player.play({url})` works with LAN HTTP URLs.

## Spike 5: Native TMDB Detail Page
1. Host `spike5_lampa_detail.js` and install in Lampa
2. Click "Spike5" → click any movie/show
3. Verify native detail page opens
4. Verify "Spike5 Button" appears in the button area

Validates: `Lampa.Activity.push({component:'full'})` opens native detail pages,
and `Lampa.Listener.follow('full')` can inject buttons.
