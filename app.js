(() => {
  const stations = window.RADIO_STATIONS || [];
  const audio = document.getElementById("radio-audio");
  const grid = document.getElementById("station-grid");
  const tabs = document.getElementById("channel-tabs");
  const playToggle = document.getElementById("play-toggle");
  const dockTitle = document.getElementById("dock-title");
  const dockSubtitle = document.getElementById("dock-subtitle");
  const dockStatus = document.getElementById("dock-status");
  const dockArt = document.getElementById("dock-art");
  const dockLive = document.getElementById("dock-live");
  const progressInput = document.getElementById("track-progress");
  const elapsedLabel = document.getElementById("track-elapsed");
  const remainingLabel = document.getElementById("track-remaining");
  const toast = document.getElementById("toast");
  let activeId = null, playing = false, toastTimer;
  let trackStartedAt = 0, trackElapsedBase = 0, trackDuration = 0, trackSignature = "";
  const trackData = {};
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const safeArt = url => /^https?:\/\//i.test(String(url || "")) ? String(url) : "";
  function notify(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3200); }
  function currentStation() { return stations.find(s => s.id === activeId); }
  function songFrom(item) { return item?.song || item || {}; }
  function artFor(song) { return safeArt(song?.art || song?.artwork || song?.album_art || ""); }
  function songTitle(song) { return song?.title || song?.text || "Song information unavailable"; }
  function songArtist(song) { return song?.artist || song?.artist_name || "Artist information unavailable"; }
  function songAlbum(song) { return song?.album || song?.album_name || "—"; }
  function customFields(song) {
    const fields = song?.custom_fields || song?.customFields || song?.custom_field || song?.customField;
    if (!fields) return "—";
    if (typeof fields === "string") return fields;
    if (Array.isArray(fields)) return fields.map(x => typeof x === "string" ? x : `${x.name || x.key || "Field"}: ${x.value ?? ""}`).join(" · ") || "—";
    if (typeof fields === "object") return Object.entries(fields).map(([k,v]) => `${k}: ${v}`).join(" · ") || "—";
    return String(fields);
  }
  function getNow(station) { return songFrom(trackData[station.id]?.now_playing || trackData[station.id]?.nowPlaying || {}); }
  function asSeconds(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value > 100000 ? value / 1000 : value;
    if (typeof value === "string" && value.trim()) {
      if (/^\d+:\d{1,2}(?::\d{1,2})?$/.test(value.trim())) {
        const parts = value.trim().split(":").map(Number);
        return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      }
      const n = Number(value); if (Number.isFinite(n)) return n;
    }
    return 0;
  }
  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(value || 0));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), sec = seconds % 60;
    return h ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}` : `${m}:${String(sec).padStart(2,"0")}`;
  }
  function trackTiming(now) {
    const duration = asSeconds(now?.duration ?? now?.song?.duration ?? now?.length ?? now?.song?.length);
    const elapsed = asSeconds(now?.elapsed ?? now?.elapsed_seconds ?? now?.played ?? now?.progress);
    return {duration, elapsed: duration > 0 ? Math.min(elapsed, duration) : 0};
  }
  function refreshTrackClock(now, force = false) {
    const signature = `${activeId}|${songTitle(now)}|${songArtist(now)}|${trackTiming(now).duration}`;
    const timing = trackTiming(now);
    if (force || signature !== trackSignature) {
      trackSignature = signature; trackDuration = timing.duration; trackElapsedBase = timing.elapsed; trackStartedAt = Date.now();
    } else if (timing.duration > 0) {
      // Re-sync from the radio API on each refresh to limit drift.
      trackDuration = timing.duration; trackElapsedBase = timing.elapsed; trackStartedAt = Date.now();
    }
    renderProgress();
  }
  function currentElapsed() {
    if (!trackDuration) return 0;
    return Math.min(trackDuration, trackElapsedBase + (playing ? Math.max(0, (Date.now() - trackStartedAt) / 1000) : 0));
  }
  function renderProgress() {
    const elapsed = currentElapsed();
    if (trackDuration > 0) {
      progressInput.disabled = false; progressInput.max = String(trackDuration); progressInput.value = String(Math.min(elapsed, trackDuration));
      elapsedLabel.textContent = formatTime(elapsed); remainingLabel.textContent = `-${formatTime(Math.max(0, trackDuration - elapsed))}`;
      try { if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) navigator.mediaSession.setPositionState({duration: trackDuration, playbackRate: playing ? 1 : 0, position: elapsed}); } catch (_) {}
    } else {
      progressInput.disabled = true; progressInput.max = "100"; progressInput.value = "0";
      elapsedLabel.textContent = "LIVE"; remainingLabel.textContent = "--:--";
    }
  }
  function updateMediaSession(now, station) {
    if (!("mediaSession" in navigator)) return;
    const art = artFor(now);
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songTitle(now), artist: songArtist(now) === "Artist information unavailable" ? station.name : songArtist(now),
        album: songAlbum(now) === "—" ? station.name : songAlbum(now),
        artwork: art ? [{src: art, sizes: "96x96"}, {src: art, sizes: "256x256"}, {src: art, sizes: "512x512"}] : []
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
      ["play", "pause", "previoustrack", "nexttrack"].forEach(action => {
        try { navigator.mediaSession.setActionHandler(action, action === "play" ? togglePlay : action === "pause" ? () => { audio.pause(); playing = false; updateDock(); } : action === "previoustrack" ? () => cycleStation(-1) : () => cycleStation(1)); } catch (_) {}
      });
      renderProgress();
    } catch (_) {}
  }
  function getListenerCount(station) {
    const data = trackData[station.id] || {};
    const candidates = [data.listeners?.current, data.listeners?.total, data.station?.listeners?.current, data.station?.listeners?.total, data.listeners_current, data.listener_count, data.listeners];
    const count = candidates.find(value => typeof value === "number" && Number.isFinite(value));
    return count === undefined ? null : count;
  }
  function getNext(station) { return songFrom(trackData[station.id]?.playing_next || trackData[station.id]?.next_song || trackData[station.id]?.next || {}); }
  function getHistory(station) { const d = trackData[station.id] || {}; return d.song_history || d.history || d.track_history || []; }
  function artMarkup(url, fallbackClass = "") { const src = safeArt(url); return src ? `<img src="${escapeHTML(src)}" alt="Album artwork" loading="lazy" onerror="this.remove();this.parentElement.textContent='♫'">` : "♫"; }
  function renderTabs() {
    tabs.innerHTML = stations.map(s => `<button class="channel-tab ${s.id === activeId ? "active" : ""}" role="tab" aria-selected="${s.id === activeId}" data-station-tab="${escapeHTML(s.id)}"><span class="tab-live"></span>${escapeHTML(s.name)}</button>`).join("");
  }
  function renderGrid(filter = document.querySelector(".filter.active")?.dataset.filter || "all") {
    grid.innerHTML = stations.filter(s => filter === "all" || s.group === filter).map(s => {
      const now = getNow(s); const art = artFor(now);
      return `<article class="station-card ${s.id === activeId ? "active-card" : ""}" data-id="${escapeHTML(s.id)}" data-group="${escapeHTML(s.group)}" tabindex="0">
      <div class="card-top"><div class="station-logo ${escapeHTML(s.logoClass || "")}">${escapeHTML(s.short)}</div><span class="station-tag">${escapeHTML(s.tag)}</span></div>
      <h3>${escapeHTML(s.name)}</h3><p>${escapeHTML(s.description)}</p>
      <div class="track-info"><div class="track-art">${artMarkup(art)}</div><div class="track-meta"><strong>${escapeHTML(songTitle(now))}</strong><span>${escapeHTML(songArtist(now))}</span></div><button class="card-play" data-play="${escapeHTML(s.id)}" aria-label="Play ${escapeHTML(s.name)}">${s.id === activeId && playing ? "Ⅱ" : "▶"}</button></div></article>`;
    }).join("");
  }
  function renderMusicPanel() {
    const s = currentStation(); if (!s) return;
    const now = getNow(s), next = getNext(s), history = getHistory(s);
    document.getElementById("now-station").textContent = s.name.toUpperCase();
    const listeners = getListenerCount(s);
    document.getElementById("listener-count").textContent = listeners === null ? "—" : listeners.toLocaleString();
    document.getElementById("listener-count").parentElement.setAttribute("aria-label", listeners === null ? "Listener count unavailable" : `${listeners} current listeners`);
    document.getElementById("now-title").textContent = songTitle(now);
    document.getElementById("now-artist").textContent = songArtist(now);
    document.getElementById("now-album").textContent = songAlbum(now);
    document.getElementById("now-custom").textContent = customFields(now);
    document.getElementById("now-art").innerHTML = artMarkup(artFor(now));
    const nextSong = next && (next.title || next.text || next.song || next.artist) ? next : null;
    document.getElementById("next-track").innerHTML = nextSong ? `<div class="mini-art">${artMarkup(artFor(nextSong))}</div><div class="list-track-meta"><strong>${escapeHTML(songTitle(nextSong))}</strong><span>${escapeHTML([songArtist(nextSong), songAlbum(nextSong) !== "—" ? songAlbum(nextSong) : ""].filter(Boolean).join(" · "))}</span></div>` : `<div class="mini-art">♫</div><div class="list-track-meta"><strong>Next track unavailable</strong><span>This station API hasn't supplied a next song.</span></div>`;
    const list = Array.isArray(history) ? history.slice(0,5) : [];
    document.getElementById("track-history").innerHTML = list.length ? list.map(entry => {
      const song = songFrom(entry); const when = entry.played_at ? new Date(Number(entry.played_at) * 1000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "Recently played";
      return `<div class="history-row"><div class="history-art">${artMarkup(artFor(song))}</div><div class="list-track-meta"><strong>${escapeHTML(songTitle(song))}</strong><span>${escapeHTML(songArtist(song))} · ${escapeHTML(when)}</span></div></div>`;
    }).join("") : `<div class="history-empty">No track history was returned for this station yet.</div>`;
  }
  function updateDock() {
    const s = currentStation(); if (!s) return;
    const now = getNow(s);
    dockTitle.textContent = songTitle(now);
    dockSubtitle.textContent = [s.name, songArtist(now) !== "Artist information unavailable" ? songArtist(now) : "", songAlbum(now) !== "—" ? songAlbum(now) : ""].filter(Boolean).join(" • ");
    dockStatus.textContent = playing ? "NOW PLAYING" : "READY TO PLAY";
    dockLive.textContent = playing ? "LIVE ON AIR" : "LIVE RADIO";
    playToggle.textContent = playing ? "Ⅱ" : "▶";
    playToggle.setAttribute("aria-label", playing ? "Pause radio" : "Play radio");
    dockArt.innerHTML = artFor(now) ? artMarkup(artFor(now)) : escapeHTML(s.short);
    updateMediaSession(now, s);
    renderTabs(); renderGrid(); renderMusicPanel();
  }
  async function chooseStation(id, autoplay = true) {
    const s = stations.find(item => item.id === id); if (!s) return;
    activeId = id;
    if (!s.stream) {
      audio.pause(); playing = false; audio.removeAttribute("src"); audio.load(); updateDock();
      notify(`Add the live stream URL for ${s.name} in config.js to enable playback.`); return;
    }
    audio.pause(); playing = false; audio.src = s.stream; audio.load(); updateDock();
    if (autoplay) {
      try { await audio.play(); playing = true; updateDock(); }
      catch (e) { playing = false; updateDock(); notify("Playback did not start. Check this station's stream URL or try another station."); }
    }
  }
  async function togglePlay() {
    if (!activeId) { await chooseStation(stations[0]?.id, true); return; }
    const s = currentStation();
    if (!s?.stream) { notify(`A stream URL is needed for ${s?.name || "this station"}.`); return; }
    if (audio.paused) { try { await audio.play(); playing = true; } catch (e) { playing = false; notify("Could not start this stream. Check the stream URL or try another station."); } }
    else { audio.pause(); playing = false; }
    updateDock();
  }
  function cycleStation(direction) { const i = stations.findIndex(s => s.id === activeId); chooseStation(stations[(i + direction + stations.length) % stations.length].id, true); }
  tabs.addEventListener("click", e => { const tab = e.target.closest("[data-station-tab]"); if (tab) chooseStation(tab.dataset.stationTab, true); });
  grid.addEventListener("click", e => { const btn = e.target.closest("[data-play]"); if (btn) { chooseStation(btn.dataset.play, true); return; } const card = e.target.closest(".station-card"); if (card) chooseStation(card.dataset.id, true); });
  grid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("station-card")) { e.preventDefault(); chooseStation(e.target.dataset.id, true); } });
  document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn)); renderGrid(btn.dataset.filter); }));
  playToggle.addEventListener("click", togglePlay);
  document.getElementById("prev-station").addEventListener("click", () => cycleStation(-1));
  document.getElementById("next-station").addEventListener("click", () => cycleStation(1));
  document.getElementById("volume").addEventListener("input", e => audio.volume = Number(e.target.value));
  audio.addEventListener("playing", () => { playing = true; updateDock(); });
  audio.addEventListener("pause", () => { playing = false; updateDock(); });
  audio.addEventListener("timeupdate", renderProgress);
  progressInput.addEventListener("input", () => { /* Internet radio streams generally cannot seek; progress is informational. */ });
  audio.addEventListener("error", () => { playing = false; updateDock(); });
  async function fetchNowPlaying(station) {
    if (!station.api) return;
    try {
      const response = await fetch(station.api, {cache:"no-store"}); if (!response.ok) throw new Error("API request failed");
      trackData[station.id] = await response.json();
      if (activeId === station.id) { refreshTrackClock(getNow(station)); updateDock(); } else { renderTabs(); renderGrid(); }
    } catch (err) { /* Some radio hosts block cross-origin browser API requests; configure CORS or a same-origin proxy if needed. */ }
  }
  audio.volume = 0.8;
  renderTabs(); renderGrid();
  if (stations.length) { activeId = stations[0].id; updateDock(); }
  stations.forEach(fetchNowPlaying);
  setInterval(() => stations.forEach(fetchNowPlaying), 30000);
  setInterval(renderProgress, 1000);
})();
