const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

const SCOPES = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state",
  "user-library-read",
  "user-read-playback-position"
];

const NEWS_QUEUE_DONE_RATIO = 0.9;
const NEWS_QUEUE_RESUME_MONITOR_MS = 8000;
const RESUME_SEEK_TOLERANCE_MS = 5000;
const UNFINISHED_LIMIT = 10;
const UNFINISHED_MAX_STORED = 100;
const PLAYBACK_TRACKER_MS = 15000;

const STORE = {
  clientId: "spotify_remote_client_id",
  token: "spotify_remote_token",
  verifier: "spotify_remote_code_verifier",
  oauthState: "spotify_remote_oauth_state",
  deviceId: "spotify_remote_device_id",
  podcastConfig: "spotify_remote_podcast_config",
  podcastCategoryFilter: "spotify_remote_podcast_category_filter",
  configCategoryFilter: "spotify_remote_config_category_filter",
  typeFilter: "spotify_remote_type_filter",
  activeTab: "spotify_remote_active_tab",
  podcastSort: "spotify_remote_podcast_sort_v2",
  unfinishedEpisodes: "spotify_remote_unfinished_episodes"
};

const icons = {
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.2 6.5M3 12A9 9 0 0 1 18.2 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M21 4v6h-6M3 20v-6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  signOut: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};

const dom = {
  authState: document.querySelector("#authState"),
  clientIdInput: document.querySelector("#clientIdInput"),
  connectionStatus: document.querySelector("#connectionStatus"),
  configCount: document.querySelector("#configCount"),
  configCategoryFilter: document.querySelector("#configCategoryFilter"),
  configList: document.querySelector("#configList"),
  copyRedirectButton: document.querySelector("#copyRedirectButton"),
  deviceSelect: document.querySelector("#deviceSelect"),
  eventLog: document.querySelector("#eventLog"),
  closeEpisodesButton: document.querySelector("#closeEpisodesButton"),
  episodeCount: document.querySelector("#episodeCount"),
  episodeModal: document.querySelector("#episodeModal"),
  episodesList: document.querySelector("#episodesList"),
  episodeTitle: document.querySelector("#episodeTitle"),
  loadPodcastsButton: document.querySelector("#loadPodcastsButton"),
  loadConfigPodcastsButton: document.querySelector("#loadConfigPodcastsButton"),
  loginButton: document.querySelector("#loginButton"),
  newsQueueCount: document.querySelector("#newsQueueCount"),
  newsQueueList: document.querySelector("#newsQueueList"),
  nowPlaying: document.querySelector("#nowPlaying"),
  pauseButton: document.querySelector("#pauseButton"),
  playbackState: document.querySelector("#playbackState"),
  podcastCategoryFilter: document.querySelector("#podcastCategoryFilter"),
  podcastCount: document.querySelector("#podcastCount"),
  podcastSortSelect: document.querySelector("#podcastSortSelect"),
  podcastsList: document.querySelector("#podcastsList"),
  queueNewsButton: document.querySelector("#queueNewsButton"),
  refreshButton: document.querySelector("#refreshButton"),
  refreshNewsQueueButton: document.querySelector("#refreshNewsQueueButton"),
  redirectUriInput: document.querySelector("#redirectUriInput"),
  resultCount: document.querySelector("#resultCount"),
  resultsList: document.querySelector("#resultsList"),
  resultTypeButtons: document.querySelector("#resultTypeButtons"),
  resumeButton: document.querySelector("#resumeButton"),
  saveClientButton: document.querySelector("#saveClientButton"),
  scopeList: document.querySelector("#scopeList"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  signOutButton: document.querySelector("#signOutButton"),
  tabButtons: document.querySelectorAll(".tab-button"),
  tabPages: document.querySelectorAll(".tab-page"),
  refreshUnfinishedButton: document.querySelector("#refreshUnfinishedButton"),
  unfinishedCount: document.querySelector("#unfinishedCount"),
  unfinishedList: document.querySelector("#unfinishedList")
};

let devices = [];
let currentTypeFilter = localStorage.getItem(STORE.typeFilter) || "track,episode";
let currentTab = localStorage.getItem(STORE.activeTab) || "search";
let currentPodcastSort = localStorage.getItem(STORE.podcastSort) || "rank";
if (!["rank", "saved", "name"].includes(currentPodcastSort)) {
  currentPodcastSort = "rank";
  localStorage.setItem(STORE.podcastSort, currentPodcastSort);
}
let podcasts = [];
let podcastTotal = null;
let podcastsLoaded = false;
let newsQueueEpisodes = [];
let activeNewsQueueSession = null;
let newsQueueMonitorId = null;
let newsQueueMonitorRunning = false;
let unfinishedEpisodes = loadUnfinishedEpisodes();
let playbackTrackerId = null;
let playbackTrackerRunning = false;
let selectedPodcast = null;
let podcastConfig = loadPodcastConfig();
let podcastCategoryFilter = localStorage.getItem(STORE.podcastCategoryFilter) || "All";
let configCategoryFilter = localStorage.getItem(STORE.configCategoryFilter) || "All";
podcastCategoryFilter = normalizeCategoryFilter(podcastCategoryFilter);
configCategoryFilter = normalizeCategoryFilter(configCategoryFilter);

function setIcons() {
  dom.refreshButton.innerHTML = icons.refresh;
  dom.signOutButton.innerHTML = icons.signOut;
  dom.pauseButton.innerHTML = icons.pause;
  dom.resumeButton.innerHTML = icons.play;
  dom.closeEpisodesButton.innerHTML = icons.close;
  document.querySelector(".search-icon").innerHTML = icons.search;
}

function switchTab(tabName) {
  const nextTab = ["search", "podcasts", "news-queue", "unfinished", "config", "connection"].includes(tabName) ? tabName : "search";
  currentTab = nextTab;
  localStorage.setItem(STORE.activeTab, nextTab);

  dom.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === nextTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  dom.tabPages.forEach((page) => {
    const isActive = page.id === `page-${nextTab}`;
    page.classList.toggle("active", isActive);
    page.hidden = !isActive;
  });

  if ((nextTab === "podcasts" || nextTab === "news-queue" || nextTab === "config") && hasUsableToken()) {
    runAction(async () => {
      if (!podcastsLoaded) {
        await loadPodcasts();
      }

      if (nextTab === "news-queue") {
        await loadNewsQueue();
      }

      if (nextTab === "config") {
        renderConfig();
      }
    });
  }

  if (nextTab === "unfinished") {
    if (hasUsableToken()) {
      runAction(refreshUnfinishedEpisodes);
    } else {
      renderUnfinishedEpisodes();
    }
  }
}

function configuredClientId() {
  const saved = localStorage.getItem(STORE.clientId);
  const configured = window.SPOTIFY_REMOTE_CONFIG?.clientId;
  return (saved || configured || "").trim();
}

function tokenRecord() {
  try {
    return JSON.parse(localStorage.getItem(STORE.token) || "null");
  } catch {
    return null;
  }
}

function hasUsableToken() {
  const token = tokenRecord();
  return Boolean(token?.access_token);
}

function loadPodcastConfig() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE.podcastConfig) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePodcastConfig() {
  localStorage.setItem(STORE.podcastConfig, JSON.stringify(podcastConfig));
}

function loadUnfinishedEpisodes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE.unfinishedEpisodes) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUnfinishedEpisodes() {
  const entries = Object.values(unfinishedEpisodes)
    .filter((episode) => episode?.id && isEpisodeQueueEligible(episode))
    .sort((a, b) => (b.lastListenedAt || 0) - (a.lastListenedAt || 0))
    .slice(0, UNFINISHED_MAX_STORED);

  unfinishedEpisodes = Object.fromEntries(entries.map((episode) => [episode.id, episode]));
  localStorage.setItem(STORE.unfinishedEpisodes, JSON.stringify(unfinishedEpisodes));
}

function normalizeCategoryFilter(value) {
  return ["All", "News", "Other"].includes(value) ? value : "All";
}

function matchesCategoryFilter(show, filter) {
  const normalized = normalizeCategoryFilter(filter);
  return normalized === "All" || show.category === normalized;
}

function redirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function randomString(length = 64) {
  const source = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => source[value % source.length]).join("");
}

async function sha256(input) {
  const encoded = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", encoded);
}

function base64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function storeToken(payload) {
  const existing = tokenRecord() || {};
  const next = {
    ...existing,
    ...payload,
    refresh_token: payload.refresh_token || existing.refresh_token,
    expires_at: Date.now() + (payload.expires_in || 3600) * 1000 - 60000
  };
  localStorage.setItem(STORE.token, JSON.stringify(next));
}

function clearToken() {
  localStorage.removeItem(STORE.token);
  sessionStorage.removeItem(STORE.verifier);
  sessionStorage.removeItem(STORE.oauthState);
}

async function connectSpotify() {
  const clientId = configuredClientId();
  if (!clientId) {
    setEvent("Add a Spotify client ID before connecting.", "warning");
    dom.clientIdInput.focus();
    return;
  }

  const verifier = randomString(96);
  const challenge = base64Url(await sha256(verifier));
  const oauthState = randomString(32);

  sessionStorage.setItem(STORE.verifier, verifier);
  sessionStorage.setItem(STORE.oauthState, oauthState);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES.join(" "),
    redirect_uri: redirectUri(),
    state: oauthState,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  window.location.assign(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("error")) {
    setEvent(`Spotify rejected the connection: ${params.get("error")}`, "error");
    history.replaceState({}, "", window.location.pathname);
    return;
  }

  const code = params.get("code");
  if (!code) {
    return;
  }

  const expectedState = sessionStorage.getItem(STORE.oauthState);
  const actualState = params.get("state");
  if (!expectedState || expectedState !== actualState) {
    setEvent("Spotify sign-in state did not match. Start the connection again.", "error");
    clearToken();
    history.replaceState({}, "", window.location.pathname);
    return;
  }

  const verifier = sessionStorage.getItem(STORE.verifier);
  const clientId = configuredClientId();
  if (!verifier || !clientId) {
    setEvent("The saved Spotify sign-in session was missing.", "error");
    history.replaceState({}, "", window.location.pathname);
    return;
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw spotifyError(response, payload);
  }

  storeToken(payload);
  sessionStorage.removeItem(STORE.verifier);
  sessionStorage.removeItem(STORE.oauthState);
  history.replaceState({}, "", window.location.pathname);
  setEvent("Spotify connected.", "success");
}

async function refreshAccessToken() {
  const token = tokenRecord();
  const clientId = configuredClientId();
  if (!token?.refresh_token || !clientId) {
    clearToken();
    throw new Error("Connect Spotify again.");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: clientId
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    clearToken();
    throw spotifyError(response, payload);
  }

  storeToken(payload);
  return payload.access_token;
}

async function accessToken() {
  const token = tokenRecord();
  if (!token?.access_token) {
    return null;
  }

  if (token.expires_at && token.expires_at <= Date.now()) {
    return refreshAccessToken();
  }

  return token.access_token;
}

async function spotifyFetch(path, options = {}, retry = true) {
  const token = await accessToken();
  if (!token) {
    throw new Error("Connect Spotify first.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${SPOTIFY_API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && retry) {
    await refreshAccessToken();
    return spotifyFetch(path, options, false);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const payload = text ? safeJson(text) : null;

  if (!response.ok) {
    throw spotifyError(response, payload);
  }

  return payload;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function spotifyError(response, payload) {
  const message =
    payload?.error?.message ||
    payload?.error_description ||
    payload?.error ||
    payload?.message ||
    response.statusText ||
    "Spotify request failed";
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  return error;
}

function saveClientId() {
  const clientId = dom.clientIdInput.value.trim();
  if (clientId) {
    localStorage.setItem(STORE.clientId, clientId);
    setEvent("Client ID saved.", "success");
  } else {
    localStorage.removeItem(STORE.clientId);
    setEvent("Client ID cleared.", "warning");
  }
  renderAuth();
}

function signOut() {
  stopNewsQueueResumeMonitor();
  stopPlaybackTracker();
  clearToken();
  devices = [];
  podcasts = [];
  podcastTotal = null;
  podcastsLoaded = false;
  selectedPodcast = null;
  renderAuth();
  renderDevices();
  renderNow(null);
  renderEmpty(dom.resultsList, "Search results will appear here.");
  renderEmpty(dom.podcastsList, "Connect Spotify to load your followed podcasts.");
  renderEmpty(dom.newsQueueList, "Connect Spotify to build your news queue.");
  renderEmpty(dom.unfinishedList, "Connect Spotify to track unfinished episodes.");
  renderEmpty(dom.configList, "Connect Spotify to configure podcasts.");
  newsQueueEpisodes = [];
  renderEmpty(dom.newsQueueList, "Connect Spotify to build your news queue.");
  dom.newsQueueCount.textContent = "Today's News episodes under 90% played";
  dom.unfinishedCount.textContent = "10 most recent unfinished episodes";
  closeEpisodes();
  dom.podcastCount.textContent = "Saved shows from your Spotify library";
  dom.configCount.textContent = "Category and rank for followed podcasts";
  setEvent("Signed out.", "warning");
}

async function copyRedirectUri() {
  const value = redirectUri();
  dom.redirectUriInput.value = value;

  try {
    await navigator.clipboard.writeText(value);
    setEvent("Redirect URI copied.", "success");
  } catch {
    dom.redirectUriInput.select();
    document.execCommand("copy");
    setEvent("Redirect URI selected for copying.", "warning");
  }
}

async function loadDevices() {
  if (!hasUsableToken()) {
    renderDevices();
    return;
  }

  const payload = await spotifyFetch("/me/player/devices");
  devices = payload?.devices || [];
  renderDevices();

  if (devices.length) {
    setEvent(`Found ${devices.length} Spotify Connect device${devices.length === 1 ? "" : "s"}.`, "success");
  } else {
    setEvent("No Spotify Connect devices are available.", "warning");
  }
}

function renderDevices() {
  const selected = localStorage.getItem(STORE.deviceId) || "";
  dom.deviceSelect.replaceChildren();

  const activeOption = new Option("Active Spotify app", "");
  dom.deviceSelect.append(activeOption);

  let selectedStillExists = selected === "";
  devices.forEach((device) => {
    const status = device.is_active ? "active" : device.type || "device";
    const option = new Option(`${device.name} - ${status}`, device.id || "");
    option.disabled = Boolean(device.is_restricted || !device.id);
    dom.deviceSelect.append(option);
    if (device.id === selected && !option.disabled) {
      selectedStillExists = true;
    }
  });

  dom.deviceSelect.value = selectedStillExists ? selected : "";
  if (!selectedStillExists) {
    localStorage.removeItem(STORE.deviceId);
  }
}

async function searchSpotify(event) {
  event?.preventDefault();
  const query = dom.searchInput.value.trim();
  if (!query) {
    renderEmpty(dom.resultsList, "Search results will appear here.");
    dom.resultCount.textContent = "Tracks and episodes";
    return;
  }

  renderEmpty(dom.resultsList, "Searching Spotify...");
  const params = new URLSearchParams({
    q: query,
    type: currentTypeFilter,
    limit: "10",
    include_external: "audio"
  });

  const payload = await spotifyFetch(`/search?${params.toString()}`);
  const items = [
    ...(payload.tracks?.items || []).map(mapTrack),
    ...(payload.episodes?.items || []).map(mapEpisode)
  ].filter((item) => item.id);

  renderResults(items);
}

async function loadPodcasts() {
  if (!hasUsableToken()) {
    podcastsLoaded = false;
    renderEmpty(dom.podcastsList, "Connect Spotify to load your followed podcasts.");
    closeEpisodes();
    return;
  }

  renderEmpty(dom.podcastsList, "Loading followed podcasts...");
  closeEpisodes();

  const shows = [];
  let offset = 0;
  let total = null;

  do {
    const payload = await spotifyFetch(`/me/shows?limit=50&offset=${offset}`);
    const pageItems = payload?.items || [];
    total = payload?.total ?? total;
    shows.push(...pageItems.map((item, index) => mapShow(item, shows.length + index)).filter((show) => show.id));
    offset += payload?.limit || 50;

    if (!payload?.next || !pageItems.length || (Number.isFinite(total) && offset >= total)) {
      break;
    }
  } while (true);

  podcasts = shows;
  podcastTotal = total;
  reconcilePodcastConfig();
  podcastsLoaded = true;
  selectedPodcast = null;
  renderPodcasts();
  renderConfig();
  setEvent(`Loaded ${shows.length} followed podcast${shows.length === 1 ? "" : "s"}.`, "success");
}

function reconcilePodcastConfig() {
  const previousConfig = podcastConfig;
  let nextRank = podcasts.reduce((maxRank, show) => {
    const existingRank = previousConfig[show.id]?.rank;
    return Number.isInteger(existingRank) && existingRank > 0 ? Math.max(maxRank, existingRank) : maxRank;
  }, 0);
  const nextConfig = {};

  podcasts.forEach((show) => {
    const existing = previousConfig[show.id] || {};
    const existingRank = existing.rank;
    nextConfig[show.id] = {
      category: existing.category === "News" ? "News" : "Other",
      rank: Number.isInteger(existingRank) && existingRank > 0 ? existingRank : ++nextRank
    };
  });

  podcastConfig = nextConfig;
  normalizePodcastRanks();
  savePodcastConfig();

  podcasts.forEach((show) => {
    applyPodcastConfig(show);
  });
}

function applyPodcastConfig(show) {
  const config = podcastConfig[show.id] || {};
  show.category = config.category === "News" ? "News" : "Other";
  show.rank = Number.isInteger(config.rank) ? config.rank : show.savedIndex + 1;
}

function normalizePodcastRanks() {
  const ids = podcasts
    .slice()
    .sort((a, b) => {
      const aRank = podcastConfig[a.id]?.rank ?? a.savedIndex + 1;
      const bRank = podcastConfig[b.id]?.rank ?? b.savedIndex + 1;
      return aRank - bRank || a.savedIndex - b.savedIndex || a.name.localeCompare(b.name);
    })
    .map((show) => show.id);

  ids.forEach((id, index) => {
    podcastConfig[id].rank = index + 1;
  });
}

async function loadShowEpisodes(show, force = false) {
  if (show.episodesLoaded && !force) {
    return show.episodes;
  }

  const episodes = [];
  let offset = 0;
  let total = null;

  do {
    const params = new URLSearchParams({
      limit: "50",
      offset: String(offset),
      market: "US"
    });
    const payload = await spotifyFetch(`/shows/${encodeURIComponent(show.id)}/episodes?${params.toString()}`);
    const pageItems = payload?.items || [];
    total = payload?.total ?? total;
    episodes.push(...pageItems.filter(Boolean).map((episode) => mapShowEpisode(episode, show)).filter((episode) => episode.id));
    offset += payload?.limit || 50;

    if (!payload?.next || !pageItems.length || (Number.isFinite(total) && offset >= total)) {
      break;
    }
  } while (true);

  return episodes.sort((a, b) => b.releaseTimestamp - a.releaseTimestamp || a.name.localeCompare(b.name));
}

async function loadLatestShowEpisode(show, force = false) {
  if (!force) {
    if (show.latestEpisodeLoaded) {
      return show.latestEpisode;
    }

    if (show.episodesLoaded && show.episodes.length) {
      return show.episodes[0];
    }
  }

  const params = new URLSearchParams({
    limit: "1",
    offset: "0",
    market: "US"
  });
  const payload = await spotifyFetch(`/shows/${encodeURIComponent(show.id)}/episodes?${params.toString()}`);
  const episode = (payload?.items || [])
    .filter(Boolean)
    .map((item) => mapShowEpisode(item, show))
    .find((item) => item.id) || null;

  show.latestEpisode = episode;
  show.latestEpisodeLoaded = true;
  return episode;
}

function mapTrack(track) {
  return {
    id: track.id,
    kind: "track",
    uri: track.uri,
    name: track.name,
    subtitle: (track.artists || []).map((artist) => artist.name).join(", ") || "Unknown artist",
    context: track.album?.name || "Track",
    image: imageUrl(track.album?.images),
    duration: formatDuration(track.duration_ms),
    externalUrl: track.external_urls?.spotify
  };
}

function mapEpisode(episode) {
  const resumePoint = episode?.resume_point
    ? {
        fullyPlayed: episode.resume_point.fully_played === true,
        resumePositionMs: Number.isFinite(episode.resume_point.resume_position_ms) ? episode.resume_point.resume_position_ms : 0
      }
    : null;

  return {
    id: episode.id,
    kind: "episode",
    uri: episode.uri,
    name: episode.name,
    subtitle: episode.show?.name || episode.publisher || "Episode",
    context: episode.release_date || "Podcast",
    releaseDate: episode.release_date || "",
    image: imageUrl(episode.images) || imageUrl(episode.show?.images),
    duration: formatDuration(episode.duration_ms),
    durationMs: episode.duration_ms,
    description: episode.description || "",
    resumePoint,
    hasResumePoint: Boolean(resumePoint),
    externalUrl: episode.external_urls?.spotify
  };
}

function mapShowEpisode(episode, show) {
  const resumePoint = episode?.resume_point
    ? {
        fullyPlayed: episode.resume_point.fully_played === true,
        resumePositionMs: Number.isFinite(episode.resume_point.resume_position_ms) ? episode.resume_point.resume_position_ms : 0
      }
    : null;

  return {
    id: episode?.id,
    kind: "episode",
    uri: episode?.uri,
    name: episode?.name || "Untitled episode",
    subtitle: show.name,
    showId: show.id,
    showRank: show.rank,
    showCategory: show.category,
    context: episode?.release_date || "Episode",
    releaseDate: episode?.release_date || "",
    releaseTimestamp: releaseTimestamp(episode?.release_date, episode?.release_date_precision),
    image: imageUrl(episode?.images) || show.image,
    duration: formatDuration(episode?.duration_ms),
    durationMs: episode?.duration_ms,
    description: episode?.description || "",
    isPlayable: episode?.is_playable !== false,
    restrictionReason: episode?.restrictions?.reason || "",
    resumePoint,
    hasResumePoint: Boolean(resumePoint),
    externalUrl: episode?.external_urls?.spotify
  };
}

function mapShow(savedShow, savedIndex = 0) {
  const show = savedShow?.show || savedShow;
  return {
    id: show?.id,
    kind: "show",
    uri: show?.uri,
    name: show?.name || "Untitled podcast",
    subtitle: show?.publisher || "Podcast",
    context: show?.total_episodes ? `${show.total_episodes} episodes` : "Saved show",
    description: show?.description || "",
    image: imageUrl(show?.images),
    addedAt: savedShow?.added_at,
    savedIndex,
    category: "Other",
    rank: savedIndex + 1,
    externalUrl: show?.external_urls?.spotify,
    episodes: [],
    episodesLoaded: false,
    latestEpisode: null,
    latestEpisodeLoaded: false
  };
}

function renderResults(items) {
  dom.resultsList.replaceChildren();
  dom.resultCount.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;

  if (!items.length) {
    renderEmpty(dom.resultsList, "No results for that search.");
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "result-card";

    card.append(createArtwork(item));

    const copy = document.createElement("div");
    copy.className = "result-copy";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const subtitle = document.createElement("p");
    subtitle.textContent = item.subtitle;

    const detail = document.createElement("small");
    detail.textContent = [item.context, item.duration].filter(Boolean).join(" - ");

    const pill = document.createElement("span");
    pill.className = `pill ${item.kind}`;
    pill.textContent = item.kind === "track" ? "Song" : "Episode";

    copy.append(title, subtitle, detail, pill);

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const playButton = document.createElement("button");
    playButton.className = "icon-button primary-icon";
    playButton.type = "button";
    playButton.title = `Play ${item.name}`;
    playButton.setAttribute("aria-label", `Play ${item.name}`);
    playButton.innerHTML = icons.play;
    playButton.addEventListener("click", () => playItem(item));
    actions.append(playButton);

    if (item.externalUrl) {
      const openLink = document.createElement("a");
      openLink.className = "icon-button";
      openLink.href = item.externalUrl;
      openLink.target = "_blank";
      openLink.rel = "noreferrer";
      openLink.title = `Open ${item.name} in Spotify`;
      openLink.setAttribute("aria-label", `Open ${item.name} in Spotify`);
      openLink.innerHTML = icons.external;
      actions.append(openLink);
    }

    card.append(copy, actions);
    fragment.append(card);
  });

  dom.resultsList.append(fragment);
}

function renderPodcasts() {
  const shows = sortedPodcasts().filter((show) => matchesCategoryFilter(show, podcastCategoryFilter));
  dom.podcastsList.replaceChildren();

  const totalText = Number.isFinite(podcastTotal) && podcastTotal !== podcasts.length ? `${podcasts.length} of ${podcastTotal}` : `${podcasts.length}`;
  const filterText = podcastCategoryFilter === "All" ? "" : ` - ${podcastCategoryFilter}`;
  dom.podcastCount.textContent = `${shows.length} shown${filterText} (${totalText} saved)`;

  if (!shows.length) {
    renderEmpty(dom.podcastsList, `No ${podcastCategoryFilter === "All" ? "followed" : podcastCategoryFilter} podcasts found.`);
    return;
  }

  const fragment = document.createDocumentFragment();
  shows.forEach((show) => {
    const card = document.createElement("article");
    card.className = "podcast-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Show episodes for ${show.name}`);
    card.classList.toggle("active", selectedPodcast?.id === show.id);
    card.addEventListener("click", () => runAction(() => selectPodcast(show)));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        runAction(() => selectPodcast(show));
      }
    });

    card.append(createArtwork(show));

    const copy = document.createElement("div");
    copy.className = "result-copy";

    const title = document.createElement("h3");
    title.textContent = show.name;

    const publisher = document.createElement("p");
    publisher.textContent = show.subtitle;

    const detail = document.createElement("small");
    detail.textContent = `#${show.rank} - ${show.category} - ${show.context}`;

    const description = document.createElement("p");
    description.textContent = show.description || "Open this podcast in Spotify.";

    copy.append(title, publisher, detail, description);

    const actions = document.createElement("div");
    actions.className = "result-actions";

    if (show.externalUrl) {
      const openLink = document.createElement("a");
      openLink.className = "icon-button";
      openLink.href = show.externalUrl;
      openLink.target = "_blank";
      openLink.rel = "noreferrer";
      openLink.title = `Open ${show.name} in Spotify`;
      openLink.setAttribute("aria-label", `Open ${show.name} in Spotify`);
      openLink.innerHTML = icons.external;
      openLink.addEventListener("click", (event) => event.stopPropagation());
      actions.append(openLink);
    }

    card.append(copy, actions);
    fragment.append(card);
  });

  dom.podcastsList.append(fragment);
}

function renderConfig() {
  dom.configList.replaceChildren();

  if (!hasUsableToken()) {
    dom.configCount.textContent = "Category and rank for followed podcasts";
    renderEmpty(dom.configList, "Connect Spotify to configure podcasts.");
    return;
  }

  if (!podcastsLoaded) {
    dom.configCount.textContent = "Category and rank for followed podcasts";
    renderEmpty(dom.configList, "Load followed podcasts to configure them.");
    return;
  }

  const shows = podcasts
    .slice()
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .filter((show) => matchesCategoryFilter(show, configCategoryFilter));
  const filterText = configCategoryFilter === "All" ? "" : ` - ${configCategoryFilter}`;
  dom.configCount.textContent = `${shows.length} shown${filterText} (${podcasts.length} configured)`;

  if (!shows.length) {
    renderEmpty(dom.configList, `No ${configCategoryFilter === "All" ? "followed" : configCategoryFilter} podcasts found.`);
    return;
  }

  const fragment = document.createDocumentFragment();
  shows.forEach((show) => {
    const row = document.createElement("article");
    row.className = "config-card";

    row.append(createArtwork(show));

    const copy = document.createElement("div");
    copy.className = "result-copy";

    const title = document.createElement("h3");
    title.textContent = show.name;

    const detail = document.createElement("p");
    detail.textContent = `${show.subtitle} - ${show.context}`;

    copy.append(title, detail);

    const controls = document.createElement("div");
    controls.className = "config-controls";

    const categoryLabel = document.createElement("label");
    categoryLabel.className = "input-group";
    const categoryText = document.createElement("span");
    categoryText.textContent = "Category";
    const categorySelect = document.createElement("select");
    categorySelect.value = show.category;
    ["News", "Other"].forEach((category) => {
      categorySelect.append(new Option(category, category));
    });
    categorySelect.value = show.category;
    categorySelect.addEventListener("change", () => {
      setPodcastCategory(show.id, categorySelect.value);
    });
    categoryLabel.append(categoryText, categorySelect);

    const rankLabel = document.createElement("label");
    rankLabel.className = "input-group rank-group";
    const rankText = document.createElement("span");
    rankText.textContent = "Rank";
    const rankInput = document.createElement("input");
    rankInput.type = "number";
    rankInput.min = "1";
    rankInput.max = String(podcasts.length);
    rankInput.step = "1";
    rankInput.value = String(show.rank);
    rankInput.addEventListener("change", () => {
      setPodcastRank(show.id, rankInput.value);
    });
    rankLabel.append(rankText, rankInput);

    controls.append(categoryLabel, rankLabel);
    row.append(copy, controls);
    fragment.append(row);
  });

  dom.configList.append(fragment);
}

function setPodcastCategory(showId, category) {
  if (!podcastConfig[showId]) {
    return;
  }

  podcastConfig[showId].category = category === "News" ? "News" : "Other";
  const show = podcasts.find((item) => item.id === showId);
  if (show) {
    applyPodcastConfig(show);
  }

  savePodcastConfig();
  renderConfig();
  renderPodcasts();
  if (currentTab === "news-queue") {
    runAction(() => loadNewsQueue(true));
  }
}

function setPodcastCategoryFilter(value) {
  podcastCategoryFilter = normalizeCategoryFilter(value);
  localStorage.setItem(STORE.podcastCategoryFilter, podcastCategoryFilter);
  dom.podcastCategoryFilter.value = podcastCategoryFilter;
  renderPodcasts();
}

function setConfigCategoryFilter(value) {
  configCategoryFilter = normalizeCategoryFilter(value);
  localStorage.setItem(STORE.configCategoryFilter, configCategoryFilter);
  dom.configCategoryFilter.value = configCategoryFilter;
  renderConfig();
}

function setPodcastRank(showId, requestedRank) {
  const moving = podcasts.find((show) => show.id === showId);
  if (!moving) {
    return;
  }

  const parsed = Number.parseInt(requestedRank, 10);
  const targetRank = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), podcasts.length) : moving.rank;
  const ordered = podcasts.slice().sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  const remaining = ordered.filter((show) => show.id !== showId);
  remaining.splice(targetRank - 1, 0, moving);

  remaining.forEach((show, index) => {
    podcastConfig[show.id].rank = index + 1;
    applyPodcastConfig(show);
  });

  savePodcastConfig();
  renderConfig();
  renderPodcasts();
  if (currentTab === "news-queue") {
    runAction(() => loadNewsQueue(false));
  }
}

function sortedPodcasts() {
  const shows = podcasts.slice();

  if (currentPodcastSort === "rank") {
    return shows.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  }

  if (currentPodcastSort === "name") {
    return shows.sort((a, b) => a.name.localeCompare(b.name));
  }

  return shows.sort((a, b) => a.savedIndex - b.savedIndex);
}

function sortPodcastsBy(value) {
  currentPodcastSort = value;
  localStorage.setItem(STORE.podcastSort, currentPodcastSort);
  renderPodcasts();
}

async function loadNewsQueue(force = false) {
  if (!hasUsableToken()) {
    newsQueueEpisodes = [];
    dom.newsQueueCount.textContent = "Today's News episodes under 90% played";
    renderEmpty(dom.newsQueueList, "Connect Spotify to build your news queue.");
    return;
  }

  if (!podcastsLoaded) {
    await loadPodcasts();
  }

  const newsShows = podcasts
    .filter((show) => show.category === "News")
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  if (!newsShows.length) {
    newsQueueEpisodes = [];
    dom.newsQueueCount.textContent = "0 episodes from News podcasts";
    renderEmpty(dom.newsQueueList, "Mark podcasts as News in Config to build this queue.");
    return;
  }

  const today = todayDateKey();
  const episodes = [];
  renderEmpty(dom.newsQueueList, "Checking the latest News episodes...");
  dom.newsQueueCount.textContent = `Checking ${newsShows.length} News podcast${newsShows.length === 1 ? "" : "s"}`;

  for (const show of newsShows) {
    try {
      const latestEpisode = await loadLatestShowEpisode(show, force);
      if (latestEpisode?.releaseDate === today && isEpisodeQueueEligible(latestEpisode) && latestEpisode.isPlayable && latestEpisode.uri) {
        episodes.push(latestEpisode);
      }
    } catch (error) {
      setEvent(`Skipped ${show.name}: ${friendlyError(error)}`, "warning");
    }
  }

  newsQueueEpisodes = episodes.sort((a, b) => {
    return a.showRank - b.showRank || b.releaseTimestamp - a.releaseTimestamp || a.name.localeCompare(b.name);
  });

  renderNewsQueue();
}

function renderNewsQueue() {
  dom.newsQueueList.replaceChildren();
  dom.newsQueueCount.textContent = `${newsQueueEpisodes.length} News episode${newsQueueEpisodes.length === 1 ? "" : "s"} under 90% played for ${todayDateKey()}`;

  if (!newsQueueEpisodes.length) {
    renderEmpty(dom.newsQueueList, "No News episodes under 90% played were released today.");
    return;
  }

  const fragment = document.createDocumentFragment();
  newsQueueEpisodes.forEach((episode) => {
    fragment.append(createNewsQueueEpisodeCard(episode));
  });
  dom.newsQueueList.append(fragment);
}

function createNewsQueueEpisodeCard(episode) {
  const card = document.createElement("article");
  card.className = "episode-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Play ${episode.name}`);
  card.addEventListener("click", () => runAction(() => playItem(episode)));
  card.addEventListener("keydown", (event) => {
    if (event.target.closest("a, button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      runAction(() => playItem(episode));
    }
  });

  card.append(createArtwork(episode));

  const copy = document.createElement("div");
  copy.className = "result-copy";

  const titleRow = document.createElement("div");
  titleRow.className = "episode-title-row";

  const title = document.createElement("h3");
  title.textContent = episode.name;
  titleRow.append(title);

  if (episode.externalUrl) {
    const openLink = document.createElement("a");
    openLink.className = "icon-button episode-open-link";
    openLink.href = episode.externalUrl;
    openLink.target = "_blank";
    openLink.rel = "noreferrer";
    openLink.title = `Open ${episode.name} in Spotify`;
    openLink.setAttribute("aria-label", `Open ${episode.name} in Spotify`);
    openLink.innerHTML = icons.external;
    openLink.addEventListener("click", (event) => event.stopPropagation());
    titleRow.append(openLink);
  }

  const detail = document.createElement("p");
  detail.textContent = `#${episode.showRank} - ${episode.subtitle} - ${episode.duration}`;

  const description = document.createElement("p");
  description.textContent = episode.description || episode.subtitle;

  copy.append(titleRow, detail, description);
  card.append(copy);
  return card;
}

function renderUnfinishedEpisodes() {
  const episodes = unfinishedEpisodeList();
  dom.unfinishedList.replaceChildren();
  dom.unfinishedCount.textContent = `${episodes.length} unfinished episode${episodes.length === 1 ? "" : "s"} tracked`;

  if (!hasUsableToken()) {
    renderEmpty(dom.unfinishedList, "Connect Spotify to track unfinished episodes.");
    return;
  }

  if (!episodes.length) {
    renderEmpty(dom.unfinishedList, "No unfinished episodes tracked yet.");
    return;
  }

  const fragment = document.createDocumentFragment();
  episodes.forEach((episode) => {
    fragment.append(createUnfinishedEpisodeCard(episode));
  });
  dom.unfinishedList.append(fragment);
}

function unfinishedEpisodeList() {
  return Object.values(unfinishedEpisodes)
    .filter((episode) => episode?.id && isEpisodeQueueEligible(episode))
    .sort((a, b) => (b.lastListenedAt || 0) - (a.lastListenedAt || 0))
    .slice(0, UNFINISHED_LIMIT);
}

function createUnfinishedEpisodeCard(episode) {
  const card = document.createElement("article");
  card.className = "episode-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Play ${episode.name}`);
  card.addEventListener("click", () => runAction(() => playItem(episode)));
  card.addEventListener("keydown", (event) => {
    if (event.target.closest("a, button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      runAction(() => playItem(episode));
    }
  });

  card.append(createArtwork(episode));

  const copy = document.createElement("div");
  copy.className = "result-copy";

  const titleRow = document.createElement("div");
  titleRow.className = "episode-title-row";

  const title = document.createElement("h3");
  title.textContent = episode.name;
  titleRow.append(title);

  if (episode.externalUrl) {
    const openLink = document.createElement("a");
    openLink.className = "icon-button episode-open-link";
    openLink.href = episode.externalUrl;
    openLink.target = "_blank";
    openLink.rel = "noreferrer";
    openLink.title = `Open ${episode.name} in Spotify`;
    openLink.setAttribute("aria-label", `Open ${episode.name} in Spotify`);
    openLink.innerHTML = icons.external;
    openLink.addEventListener("click", (event) => event.stopPropagation());
    titleRow.append(openLink);
  }

  const progress = Math.round(playedRatio(episode) * 100);
  const detail = document.createElement("p");
  detail.textContent = `${episode.subtitle} - ${progress}% played - ${formatListenedAt(episode.lastListenedAt)}`;

  const description = document.createElement("p");
  description.textContent = [episode.context, episode.duration].filter(Boolean).join(" - ");

  copy.append(titleRow, detail, description);
  card.append(copy);
  return card;
}

async function queueNewsEpisodes() {
  if (!newsQueueEpisodes.length) {
    await loadNewsQueue();
  }

  const uris = newsQueueEpisodes.map((episode) => episode.uri).filter(Boolean);
  if (!uris.length) {
    setEvent("No News episodes to queue.", "warning");
    return;
  }

  const selectedDevice = dom.deviceSelect.value;
  const query = selectedDevice ? `?device_id=${encodeURIComponent(selectedDevice)}` : "";
  await spotifyFetch(`/me/player/play${query}`, {
    method: "PUT",
    body: JSON.stringify(playbackBody(uris, newsQueueEpisodes[0]))
  });

  recordEpisodeProgress(newsQueueEpisodes[0], resumePositionMs(newsQueueEpisodes[0]), Date.now());
  renderNow(newsQueueEpisodes[0], true);
  startNewsQueueResumeMonitor(newsQueueEpisodes);
  setEvent(`Started ${uris.length} News episode${uris.length === 1 ? "" : "s"} from saved progress.`, "success");
}

function todayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatListenedAt(value) {
  if (!Number.isFinite(value)) {
    return "last listened unknown";
  }

  return `last listened ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value))}`;
}

function resumePositionMs(item) {
  const position = item?.resumePoint?.resumePositionMs;
  return Number.isFinite(position) && position > 0 ? position : 0;
}

function playedRatio(item, progressMs = resumePositionMs(item)) {
  if (item?.resumePoint?.fullyPlayed) {
    return 1;
  }

  const durationMs = item?.durationMs;
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }

  return Math.min(Math.max(progressMs / durationMs, 0), 1);
}

function isEpisodePastNewsQueueThreshold(episode, progressMs = resumePositionMs(episode)) {
  return episode?.resumePoint?.fullyPlayed === true || playedRatio(episode, progressMs) > NEWS_QUEUE_DONE_RATIO;
}

function isEpisodeQueueEligible(episode) {
  return Boolean(episode) && !isEpisodePastNewsQueueThreshold(episode);
}

function playbackBody(uris, firstItem) {
  const body = { uris };
  const positionMs = resumePositionMs(firstItem);
  if (positionMs > 0) {
    body.position_ms = positionMs;
  }
  return body;
}

function recordEpisodeProgress(item, progressMs = resumePositionMs(item), listenedAt = Date.now()) {
  if (!item?.id || item.kind !== "episode") {
    return;
  }

  const durationMs = Number.isFinite(item.durationMs) ? item.durationMs : 0;
  const safeProgressMs = Number.isFinite(progressMs) && progressMs > 0 ? Math.min(progressMs, durationMs || progressMs) : 0;
  const episode = {
    ...item,
    duration: item.duration || formatDuration(durationMs),
    durationMs,
    resumePoint: {
      fullyPlayed: false,
      resumePositionMs: safeProgressMs
    },
    hasResumePoint: true,
    lastListenedAt: listenedAt
  };

  if (isEpisodePastNewsQueueThreshold(episode, safeProgressMs)) {
    removeUnfinishedEpisode(item.id);
    return;
  }

  unfinishedEpisodes[item.id] = episode;
  saveUnfinishedEpisodes();

  if (currentTab === "unfinished") {
    renderUnfinishedEpisodes();
  }
}

function removeUnfinishedEpisode(id) {
  if (!id || !unfinishedEpisodes[id]) {
    return;
  }

  delete unfinishedEpisodes[id];
  saveUnfinishedEpisodes();

  if (currentTab === "unfinished") {
    renderUnfinishedEpisodes();
  }
}

async function refreshUnfinishedEpisodes() {
  await loadCurrentlyPlaying();
  renderUnfinishedEpisodes();
}

function startPlaybackTracker() {
  if (playbackTrackerId) {
    return;
  }

  playbackTrackerId = window.setInterval(monitorPlaybackForUnfinished, PLAYBACK_TRACKER_MS);
  window.setTimeout(monitorPlaybackForUnfinished, 1800);
}

function stopPlaybackTracker() {
  if (playbackTrackerId) {
    window.clearInterval(playbackTrackerId);
  }

  playbackTrackerId = null;
  playbackTrackerRunning = false;
}

function syncPlaybackTracker() {
  if (hasUsableToken()) {
    startPlaybackTracker();
  } else {
    stopPlaybackTracker();
  }
}

async function monitorPlaybackForUnfinished() {
  if (playbackTrackerRunning || !hasUsableToken()) {
    return;
  }

  playbackTrackerRunning = true;
  try {
    const payload = await spotifyFetch("/me/player/currently-playing");
    trackEpisodeFromPlaybackPayload(payload);
  } catch (error) {
    if (error.status !== 404) {
      stopPlaybackTracker();
      setEvent(`Unfinished tracker stopped: ${friendlyError(error)}`, "warning");
    }
  } finally {
    playbackTrackerRunning = false;
  }
}

function trackEpisodeFromPlaybackPayload(payload) {
  if (!payload?.item || payload.item.type !== "episode" || !payload.is_playing) {
    return null;
  }

  const item = mapEpisode(payload.item);
  const progressMs = Number.isFinite(payload.progress_ms) ? payload.progress_ms : 0;
  recordEpisodeProgress(item, progressMs, Date.now());
  return item;
}

function startNewsQueueResumeMonitor(episodes) {
  stopNewsQueueResumeMonitor();
  activeNewsQueueSession = {
    episodesById: new Map(episodes.map((episode) => [episode.id, episode])),
    seekedEpisodeIds: new Set()
  };
  newsQueueMonitorId = window.setInterval(monitorNewsQueueResume, NEWS_QUEUE_RESUME_MONITOR_MS);
  window.setTimeout(monitorNewsQueueResume, 1500);
}

function stopNewsQueueResumeMonitor() {
  if (newsQueueMonitorId) {
    window.clearInterval(newsQueueMonitorId);
  }

  newsQueueMonitorId = null;
  activeNewsQueueSession = null;
  newsQueueMonitorRunning = false;
}

async function monitorNewsQueueResume() {
  if (!activeNewsQueueSession || newsQueueMonitorRunning || !hasUsableToken()) {
    return;
  }

  newsQueueMonitorRunning = true;
  try {
    const payload = await spotifyFetch("/me/player/currently-playing");
    const currentId = payload?.item?.type === "episode" ? payload.item.id : "";
    const episode = currentId ? activeNewsQueueSession.episodesById.get(currentId) : null;
    if (!episode || !payload?.is_playing) {
      return;
    }

    const progressMs = Number.isFinite(payload.progress_ms) ? payload.progress_ms : 0;
    if (isEpisodePastNewsQueueThreshold(episode, progressMs)) {
      episode.resumePoint = { fullyPlayed: true, resumePositionMs: progressMs };
      newsQueueEpisodes = newsQueueEpisodes.filter((item) => item.id !== episode.id);
      activeNewsQueueSession.episodesById.delete(episode.id);
      removeUnfinishedEpisode(episode.id);
      if (currentTab === "news-queue") {
        renderNewsQueue();
      }
      if (!activeNewsQueueSession.episodesById.size) {
        stopNewsQueueResumeMonitor();
      }
      return;
    }

    const resumeMs = resumePositionMs(episode);
    if (resumeMs <= 0 || activeNewsQueueSession.seekedEpisodeIds.has(episode.id)) {
      recordEpisodeProgress(episode, progressMs, Date.now());
      return;
    }

    if (progressMs + RESUME_SEEK_TOLERANCE_MS >= resumeMs) {
      activeNewsQueueSession.seekedEpisodeIds.add(episode.id);
      recordEpisodeProgress(episode, progressMs, Date.now());
      return;
    }

    const params = new URLSearchParams({ position_ms: String(resumeMs) });
    const selectedDevice = dom.deviceSelect.value;
    if (selectedDevice) {
      params.set("device_id", selectedDevice);
    }

    await spotifyFetch(`/me/player/seek?${params.toString()}`, { method: "PUT" });
    activeNewsQueueSession.seekedEpisodeIds.add(episode.id);
    recordEpisodeProgress(episode, resumeMs, Date.now());
  } catch (error) {
    stopNewsQueueResumeMonitor();
    if (error.status !== 404) {
      setEvent(`News Queue resume monitor stopped: ${friendlyError(error)}`, "warning");
    }
  } finally {
    newsQueueMonitorRunning = false;
  }
}

async function selectPodcast(show) {
  selectedPodcast = show;
  dom.episodeModal.hidden = false;
  dom.episodeTitle.textContent = show.name;
  dom.episodeCount.textContent = "Loading episodes...";
  renderEmpty(dom.episodesList, "Loading episodes...");
  document.body.classList.add("modal-open");
  renderPodcasts();

  let episodes = [];
  try {
    episodes = await loadShowEpisodes(show);
  } catch (error) {
    dom.episodeCount.textContent = "Episodes unavailable";
    renderEmpty(dom.episodesList, friendlyError(error));
    renderPodcasts();
    throw error;
  }

  show.episodes = episodes;
  show.episodesLoaded = true;
  renderEpisodes(show);
  renderPodcasts();
}

function closeEpisodes() {
  selectedPodcast = null;
  dom.episodeModal.hidden = true;
  document.body.classList.remove("modal-open");
  dom.episodeTitle.textContent = "Episodes";
  dom.episodeCount.textContent = "Newest to oldest";
  dom.episodesList.replaceChildren();
  if (podcastsLoaded) {
    renderPodcasts();
  }
}

function renderEpisodes(show) {
  const episodes = show.episodes.slice().sort((a, b) => b.releaseTimestamp - a.releaseTimestamp || a.name.localeCompare(b.name));
  dom.episodesList.replaceChildren();
  dom.episodeTitle.textContent = show.name;
  dom.episodeCount.textContent = `${episodes.length} episode${episodes.length === 1 ? "" : "s"} newest to oldest`;

  if (!episodes.length) {
    renderEpisodeEmpty(show);
    return;
  }

  const fragment = document.createDocumentFragment();
  episodes.forEach((episode) => {
    const card = document.createElement("article");
    card.className = "episode-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Play ${episode.name}`);
    card.addEventListener("click", () => runAction(() => playItem(episode)));
    card.addEventListener("keydown", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        runAction(() => playItem(episode));
      }
    });

    card.append(createArtwork(episode));

    const copy = document.createElement("div");
    copy.className = "result-copy";

    const titleRow = document.createElement("div");
    titleRow.className = "episode-title-row";

    const title = document.createElement("h3");
    title.textContent = episode.name;
    titleRow.append(title);

    if (episode.externalUrl) {
      const openLink = document.createElement("a");
      openLink.className = "icon-button episode-open-link";
      openLink.href = episode.externalUrl;
      openLink.target = "_blank";
      openLink.rel = "noreferrer";
      openLink.title = `Open ${episode.name} in Spotify`;
      openLink.setAttribute("aria-label", `Open ${episode.name} in Spotify`);
      openLink.innerHTML = icons.external;
      openLink.addEventListener("click", (event) => event.stopPropagation());
      titleRow.append(openLink);
    }

    const detail = document.createElement("p");
    detail.textContent = [episode.releaseDate, episode.duration].filter(Boolean).join(" - ");

    const description = document.createElement("p");
    description.textContent = episode.description || show.name;

    copy.append(titleRow, detail, description);
    card.append(copy);
    fragment.append(card);
  });

  dom.episodesList.append(fragment);
}

function renderEpisodeEmpty(show) {
  dom.episodesList.replaceChildren();

  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = "Spotify did not return visible episodes for this podcast in the current account market.";

  if (show.externalUrl) {
    const link = document.createElement("a");
    link.className = "empty-state-link";
    link.href = show.externalUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open podcast in Spotify";
    empty.append(link);
  }

  dom.episodesList.append(empty);
}

function createArtwork(item) {
  if (item.image) {
    const image = document.createElement("img");
    image.className = "artwork";
    image.src = item.image;
    image.alt = "";
    image.loading = "lazy";
    return image;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "artwork-placeholder";
  placeholder.textContent = item.name.slice(0, 1).toUpperCase() || "?";
  return placeholder;
}

async function playItem(item) {
  stopNewsQueueResumeMonitor();
  const selectedDevice = dom.deviceSelect.value;
  const query = selectedDevice ? `?device_id=${encodeURIComponent(selectedDevice)}` : "";
  const body = JSON.stringify(playbackBody([item.uri], item));

  await spotifyFetch(`/me/player/play${query}`, {
    method: "PUT",
    body
  });

  recordEpisodeProgress(item, resumePositionMs(item), Date.now());
  renderNow(item, true);
  setEvent(`Playing ${item.name}.`, "success");
  window.setTimeout(loadCurrentlyPlaying, 900);
}

async function pausePlayback() {
  const query = dom.deviceSelect.value ? `?device_id=${encodeURIComponent(dom.deviceSelect.value)}` : "";
  await spotifyFetch(`/me/player/pause${query}`, { method: "PUT" });
  dom.playbackState.textContent = "Paused";
  setEvent("Paused.", "success");
  window.setTimeout(loadCurrentlyPlaying, 500);
}

async function resumePlayback() {
  const query = dom.deviceSelect.value ? `?device_id=${encodeURIComponent(dom.deviceSelect.value)}` : "";
  await spotifyFetch(`/me/player/play${query}`, { method: "PUT" });
  dom.playbackState.textContent = "Playing";
  setEvent("Playback resumed.", "success");
  window.setTimeout(loadCurrentlyPlaying, 500);
}

async function loadCurrentlyPlaying() {
  if (!hasUsableToken()) {
    renderNow(null);
    return;
  }

  const payload = await spotifyFetch("/me/player/currently-playing");
  if (!payload?.item) {
    renderNow(null);
    return;
  }

  const item = payload.item.type === "episode" ? mapEpisode(payload.item) : mapTrack(payload.item);
  trackEpisodeFromPlaybackPayload(payload);
  renderNow(item, payload.is_playing);
}

function renderNow(item, isPlaying = false) {
  dom.nowPlaying.replaceChildren();
  dom.playbackState.textContent = item ? (isPlaying ? "Playing" : "Paused") : "Idle";

  if (!item) {
    renderEmpty(dom.nowPlaying, "No active playback.");
    return;
  }

  const card = document.createElement("div");
  card.className = "now-card";
  card.append(createArtwork(item));

  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = item.name;
  const subtitle = document.createElement("p");
  subtitle.textContent = item.subtitle;
  const detail = document.createElement("p");
  detail.textContent = [item.context, item.duration].filter(Boolean).join(" - ");
  copy.append(title, subtitle, detail);

  card.append(copy);
  dom.nowPlaying.append(card);
}

function renderScopes() {
  dom.scopeList.replaceChildren();
  SCOPES.forEach((scope) => {
    const item = document.createElement("span");
    item.textContent = scope;
    dom.scopeList.append(item);
  });
}

function renderAuth() {
  const clientId = configuredClientId();
  const connected = hasUsableToken();

  dom.clientIdInput.value = clientId;
  dom.redirectUriInput.value = redirectUri();
  dom.connectionStatus.textContent = connected ? "Connected" : "Not connected";
  dom.authState.textContent = connected ? "Ready for playback" : clientId ? "Client ID saved" : "Client ID needed";
  dom.loginButton.disabled = !clientId;
  dom.signOutButton.disabled = !connected;
  dom.refreshButton.disabled = !connected;
  dom.deviceSelect.disabled = !connected;
  dom.loadPodcastsButton.disabled = !connected;
  dom.loadConfigPodcastsButton.disabled = !connected;
  dom.queueNewsButton.disabled = !connected;
  dom.refreshNewsQueueButton.disabled = !connected;
  dom.refreshUnfinishedButton.disabled = !connected;
  dom.configCategoryFilter.disabled = !connected;
  dom.podcastCategoryFilter.disabled = !connected;
  dom.podcastSortSelect.disabled = !connected;
  dom.searchInput.disabled = !connected;
  dom.pauseButton.disabled = !connected;
  dom.resumeButton.disabled = !connected;
  syncPlaybackTracker();
}

function renderEmpty(container, message) {
  container.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  container.append(empty);
}

function setEvent(message, tone = "info") {
  const item = document.createElement("li");
  item.className = tone;
  item.textContent = message;
  dom.eventLog.prepend(item);

  while (dom.eventLog.children.length > 5) {
    dom.eventLog.lastElementChild.remove();
  }
}

function imageUrl(images = []) {
  if (!Array.isArray(images) || !images.length) {
    return "";
  }

  const medium = images.find((image) => image.width >= 300 && image.width <= 720);
  return medium?.url || images[0]?.url || "";
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) {
    return "";
  }

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");

  if (hours) {
    return `${hours}:${`${minutes}`.padStart(2, "0")}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

function releaseTimestamp(value, precision = "day") {
  if (!value) {
    return 0;
  }

  const parts = value.split("-").map((part) => Number(part));
  if (precision === "year" && Number.isFinite(parts[0])) {
    return Date.UTC(parts[0], 0, 1);
  }

  if (precision === "month" && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    return Date.UTC(parts[0], parts[1] - 1, 1);
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function wireEvents() {
  dom.loginButton.addEventListener("click", () => runAction(connectSpotify));
  dom.copyRedirectButton.addEventListener("click", () => runAction(copyRedirectUri));
  dom.loadPodcastsButton.addEventListener("click", () => {
    runAction(async () => {
      podcastsLoaded = false;
      await loadPodcasts();
    });
  });
  dom.loadConfigPodcastsButton.addEventListener("click", () => {
    runAction(async () => {
      podcastsLoaded = false;
      await loadPodcasts();
      renderConfig();
    });
  });
  dom.refreshNewsQueueButton.addEventListener("click", () => runAction(() => loadNewsQueue(true)));
  dom.refreshUnfinishedButton.addEventListener("click", () => runAction(refreshUnfinishedEpisodes));
  dom.queueNewsButton.addEventListener("click", () => runAction(queueNewsEpisodes));
  dom.closeEpisodesButton.addEventListener("click", closeEpisodes);
  dom.episodeModal.addEventListener("click", (event) => {
    if (event.target === dom.episodeModal) {
      closeEpisodes();
    }
  });
  dom.saveClientButton.addEventListener("click", saveClientId);
  dom.signOutButton.addEventListener("click", signOut);
  dom.refreshButton.addEventListener("click", () => runAction(loadDevices));
  dom.searchForm.addEventListener("submit", (event) => runAction(() => searchSpotify(event)));
  dom.pauseButton.addEventListener("click", () => runAction(pausePlayback));
  dom.resumeButton.addEventListener("click", () => runAction(resumePlayback));

  dom.podcastSortSelect.addEventListener("change", () => {
    sortPodcastsBy(dom.podcastSortSelect.value);
  });
  dom.podcastCategoryFilter.addEventListener("change", () => {
    setPodcastCategoryFilter(dom.podcastCategoryFilter.value);
  });
  dom.configCategoryFilter.addEventListener("change", () => {
    setConfigCategoryFilter(dom.configCategoryFilter.value);
  });

  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  dom.clientIdInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveClientId();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.episodeModal.hidden) {
      closeEpisodes();
    }
  });

  dom.deviceSelect.addEventListener("change", () => {
    if (dom.deviceSelect.value) {
      localStorage.setItem(STORE.deviceId, dom.deviceSelect.value);
    } else {
      localStorage.removeItem(STORE.deviceId);
    }
  });

  dom.resultTypeButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-type]");
    if (!button) {
      return;
    }

    currentTypeFilter = button.dataset.type;
    localStorage.setItem(STORE.typeFilter, currentTypeFilter);
    dom.resultTypeButtons.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    if (dom.searchInput.value.trim()) {
      runAction(() => searchSpotify());
    }
  });
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    const message = friendlyError(error);
    setEvent(message, error.status === 403 ? "warning" : "error");
    renderAuth();
  }
}

function friendlyError(error) {
  if (error.status === 403) {
    return "Spotify blocked the command. Premium, account access, device restrictions, or missing library scope may apply. Try signing out and reconnecting.";
  }

  if (error.status === 404) {
    return "Spotify could not find an active device. Open the Spotify app and try again.";
  }

  if (error.status === 429) {
    return "Spotify rate limited the app. Try again in a moment.";
  }

  return error.message || "Something went wrong.";
}

async function boot() {
  setIcons();
  wireEvents();
  renderScopes();

  dom.resultTypeButtons.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === currentTypeFilter);
  });

  dom.podcastSortSelect.value = currentPodcastSort;
  dom.podcastCategoryFilter.value = podcastCategoryFilter;
  dom.configCategoryFilter.value = configCategoryFilter;
  renderEmpty(dom.resultsList, "Search results will appear here.");
  renderEmpty(dom.podcastsList, "Connect Spotify to load your followed podcasts.");
  renderEmpty(dom.unfinishedList, "Connect Spotify to track unfinished episodes.");
  renderEmpty(dom.configList, "Connect Spotify to configure podcasts.");
  renderNow(null);
  renderAuth();
  switchTab(currentTab);

  await handleCallback();
  renderAuth();
  switchTab(currentTab);

  if (hasUsableToken()) {
    await Promise.allSettled([loadDevices(), loadCurrentlyPlaying()]);
    renderAuth();
  }
}

boot().catch((error) => {
  setEvent(friendlyError(error), "error");
  renderAuth();
});
