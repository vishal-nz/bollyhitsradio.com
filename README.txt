BOLLYHITS RADIO NETWORK — WEBSITE PACKAGE
=========================================

Contents
- index.html      Main responsive website
- styles.css      Design, layout and mobile styles
- config.js       Station names, API endpoints and stream URLs
- app.js          Station filtering, player controls and now-playing data

How to preview
1. Extract this ZIP.
2. Open index.html in a modern browser.
3. For best results, run it from a web server (rather than file://), because browsers may block API requests from local files.

How to publish
Upload all four files into the same folder on your web host, for example the public_html directory for bollyhitsradio.com.

Stations included
BollyHits Radio
BollyHits GOLD
BollyHits JOY
BollyHits Nadeem-Shravan
DesiZone Radio
Desi Hits 2000s
Nostalgic Bollywood 90s

API configuration
The four supplied BollyHits API endpoints are in config.js. The page refreshes metadata every 30 seconds. Browser CORS policy on a given host may prevent an API response from displaying; if that happens, configure a same-origin server-side proxy or enable CORS on the radio API server.

Important stream notes
- DesiZone streams are set to public relay URLs found on DesiZone's public station pages/directories.
- Only the BollyHits Radio stream URL is prefilled with a known public stream address. For BollyHits GOLD, JOY and Nadeem-Shravan, fill in the exact live stream URL in config.js if the existing stream URL is not known to you. Their API URLs are already configured for now-playing data.
- Stream URLs can change independently of API URLs. Test each station after uploading.
- The website does not include licensed music files; it connects to live radio streams.

Features
- Responsive desktop and mobile layout
- Sticky bottom player with play/pause, previous/next station and volume
- Seven station cards with filters
- Album artwork and live now-playing details when the API returns them
- Station metadata refreshes automatically

Branding
BollyHits Radio Network
“Where melody never dies…”

UPDATED MUSIC DASHBOARD
- All seven station tabs appear at the top of the page.
- Selecting a station updates Now Playing, Album Name, Custom Field, album art, next track, and recent track history when the station API supplies those fields.
- AzuraCast API fields are read from now_playing, playing_next and song_history.
- Custom Field is read from song custom_fields/custom_field when available.
- API response fields vary by station. Missing next-track, album, custom-field or history data is labelled rather than fabricated.
