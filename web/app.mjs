import { LocalizedError, setLanguage, t } from "./i18n.mjs";
import { modes, normalizeBalancedTuning, shuffleUris } from "./engine.mjs?v=6";
import {
  api, callbackUrl, completeSignIn, loadTracks, LoginRequired, playlistId,
  signIn, SpotifyError, storage, writeCache
} from "./spotify.mjs?v=2";

const ui = Object.fromEntries(
  ["language", "setup", "ready", "callback-url", "client-id", "login", "shuffle", "playlist",
    "mode", "balanced-controls", "balanced-focus", "balanced-variation", "balanced-reset",
    "presets", "preset-links", "preset-form", "preset-name", "preset-autostart",
    "preset-result", "preset-url", "destination", "destination-playlist", "cache-link", "logout", "status"]
    .map(id => [id, document.getElementById(id)])
);
const launch = new URL(location.href);
const presetId = launch.searchParams.get("preset");
const authReturn = launch.searchParams.has("code") || launch.searchParams.has("error");
const pendingKey = "spotify-true-shuffle-web:pending-shuffle";
const presetKey = "presets";
const tuningKey = "custom-tuning";
let busy = false;
let statusMessage;

function setStatus(key, ...values) {
  statusMessage = { key, values };
  ui.status.textContent = t(key, ...values);
}

function applyLanguage(language) {
  setLanguage(language);
  document.documentElement.lang = language;
  ui.language.value = language;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }
  const selectedMode = ui.mode.value;
  ui.mode.replaceChildren(...Object.entries(modes).map(([id, label]) =>
    new Option(label, id)));
  if (selectedMode) ui.mode.value = selectedMode;
  renderPresetLinks();
  if (statusMessage) ui.status.textContent = t(statusMessage.key, ...statusMessage.values);
}

ui.language.addEventListener("change", () => {
  const language = ui.language.value;
  storage.set("language", language);
  applyLanguage(language);
});

function getBalancedTuning() {
  return normalizeBalancedTuning({
    focus: ui["balanced-focus"].valueAsNumber,
    variation: ui["balanced-variation"].valueAsNumber
  });
}

function setBalancedTuning(tuning) {
  const { focus, variation } = normalizeBalancedTuning(tuning);
  ui["balanced-focus"].value = focus;
  ui["balanced-variation"].value = variation;
}

function templateMode(mode) {
  if (mode === "custom") return "balanced";
  return Object.hasOwn(modes, mode) ? mode : null;
}

function balancedOverrides() {
  if (ui.mode.value !== "balanced") return undefined;
  const tuning = getBalancedTuning();
  const defaults = normalizeBalancedTuning();
  if (tuning.focus === defaults.focus && tuning.variation === defaults.variation) return undefined;
  return tuning;
}

function showBalancedControls() {
  ui["balanced-controls"].hidden = ui.mode.value !== "balanced";
}

ui.mode.addEventListener("change", () => {
  setBalancedTuning();
  ui["balanced-controls"].open = false;
  showBalancedControls();
});
ui["balanced-reset"].addEventListener("click", () => setBalancedTuning());

function showConnection() {
  const connected = Boolean(storage.get("tokens"));
  ui.setup.hidden = connected;
  ui.ready.hidden = !connected;
}

function setBusy(value) {
  busy = value;
  for (const control of document.querySelectorAll("button, input, select")) control.disabled = value;
}

function report(error) {
  if (error instanceof LocalizedError) setStatus(error.key, ...error.values);
  else setStatus("failed");
  if (error instanceof LoginRequired) showConnection();
}

function showCache(cacheId) {
  ui["cache-link"].href = "https://open.spotify.com/playlist/" + cacheId;
  ui["cache-link"].hidden = false;
}

async function getCacheSettings() {
  const profile = await api("me");
  const accountId = profile?.account_id ?? profile?.id;
  if (!accountId) throw new LocalizedError("unknownAccount");

  return { profile, cacheKey: "cache:" + accountId };
}

async function shuffle() {
  const sourceId = playlistId(ui.playlist.value);
  if (!sourceId) throw new LocalizedError("invalidSource");

  const mode = ui.mode.value;
  const { cacheKey } = await getCacheSettings();
  let cacheId = storage.get(cacheKey);
  if (cacheId === sourceId) throw new LocalizedError("sameAsDestination");

  setStatus("loadingPlaylist");
  let tracks;
  try {
    tracks = await loadTracks(sourceId);
  } catch (error) {
    if (error instanceof SpotifyError && error.status === 403) {
      throw new LocalizedError("sourceDenied");
    }
    throw error;
  }
  if (!tracks.length) throw new LocalizedError("emptyPlaylist");
  storage.set("source", sourceId);
  storage.set("mode", mode);
  const tuning = balancedOverrides();
  if (tuning) storage.set(tuningKey, tuning);
  const shuffled = await shuffleUris(tracks, mode, tuning);

  setStatus("writingPlaylist");
  if (!cacheId) {
    const created = await api("me/playlists", {
      method: "POST",
      body: { name: "True Shuffle – Web", public: false }
    });
    cacheId = playlistId(created?.id ?? "");
    if (!cacheId) throw new LocalizedError("invalidDestinationId");
    storage.set(cacheKey, cacheId);
  }

  await writeCache(cacheId, shuffled);
  showCache(cacheId);
  try {
    await api("me/player/shuffle?state=false", { method: "PUT" });
    await api("me/player/play", {
      method: "PUT",
      body: { context_uri: "spotify:playlist:" + cacheId }
    });
  } catch (error) {
    if (error instanceof SpotifyError && error.status === 404) {
      throw new LocalizedError("noDevice");
    }
    throw error;
  }
  setStatus(shuffled.length === 1 ? "playedOne" : "playedMany", shuffled.length);
}

ui.login.addEventListener("submit", async event => {
  event.preventDefault();
  setBusy(true);
  try {
    const clientId = ui["client-id"].value.trim();
    storage.set("client-id", clientId);
    sessionStorage.setItem(pendingKey, JSON.stringify({
      source: playlistId(ui.playlist.value),
      mode: ui.mode.value,
      preset: ui["preset-name"].value.trim().toLowerCase(),
      tuning: balancedOverrides()
    }));
    await signIn(clientId);
  } catch (error) {
    report(error);
    setBusy(false);
  }
});

ui.destination.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy) return;
  setBusy(true);
  try {
    const cacheId = playlistId(ui["destination-playlist"].value);
    if (!cacheId) throw new LocalizedError("invalidDestination");
    if (cacheId === playlistId(ui.playlist.value)) {
      throw new LocalizedError("samePlaylists");
    }
    const { profile, cacheKey } = await getCacheSettings();
    const playlist = await api("playlists/" + cacheId + "?fields=name,owner(id),public");
    if (!profile.id || playlist?.owner?.id !== profile.id) {
      throw new LocalizedError("notYourDestination");
    }
    storage.set(cacheKey, cacheId);
    showCache(cacheId);
    const canModifyPublic = storage.get("tokens")?.scope?.split(" ").includes("playlist-modify-public");
    setStatus(playlist.public === true && !canModifyPublic ? "destinationSavedReconnect" : "destinationSaved",
      playlist.name || cacheId);
  } catch (error) {
    report(error);
  } finally {
    setBusy(false);
  }
});

async function runShuffle() {
  if (busy) return;
  setBusy(true);
  ui["cache-link"].hidden = true;
  setStatus("checkingSpotify");
  try {
    if (navigator.locks) {
      await navigator.locks.request("spotify-true-shuffle-web", { ifAvailable: true }, lock => {
        if (!lock) throw new LocalizedError("shuffleBusy");
        return shuffle();
      });
    } else {
      await shuffle();
    }
  } catch (error) {
    report(error);
  } finally {
    setBusy(false);
  }
}

ui.shuffle.addEventListener("submit", event => {
  event.preventDefault();
  void runShuffle();
});

function presetUrl(id) {
  const url = new URL(callbackUrl);
  url.searchParams.set("preset", id);
  return url;
}

function deletePreset(id) {
  if (busy) return;
  const presets = storage.get(presetKey) ?? {};
  if (!Object.hasOwn(presets, id)) {
    renderPresetLinks();
    return;
  }
  const { name } = presets[id];
  if (!window.confirm(t("confirmDelete", name))) return;

  delete presets[id];
  storage.set(presetKey, presets);
  if (ui["preset-url"].value === presetUrl(id).href) {
    ui["preset-url"].value = "";
    ui["preset-result"].hidden = true;
  }
  if (ui["preset-name"].value.trim().toLowerCase() === id) {
    ui["preset-name"].value = "";
    ui["preset-autostart"].checked = false;
  }
  renderPresetLinks();
  ui["preset-name"].focus();
  setStatus("presetDeleted", name);
}

function renderPresetLinks() {
  const links = ui["preset-links"];
  links.replaceChildren();
  for (const [id, preset] of Object.entries(storage.get(presetKey) ?? {})) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = presetUrl(id).href;
    link.textContent = preset.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = t("delete");
    remove.setAttribute("aria-label", t("deletePreset", preset.name));
    remove.addEventListener("click", () => deletePreset(id));
    item.append(link, remove);
    links.append(item);
  }
  links.hidden = !links.childElementCount;
}

ui["preset-form"].addEventListener("submit", event => {
  event.preventDefault();
  if (busy) return;
  const name = ui["preset-name"].value.trim();
  const id = name.toLowerCase();
  const source = playlistId(ui.playlist.value);
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(id)) {
    setStatus("invalidPresetName");
    return;
  }
  if (!source) {
    setStatus("missingPresetPlaylist");
    return;
  }
  const preset = { name, source, mode: ui.mode.value, autostart: ui["preset-autostart"].checked };
  const tuning = balancedOverrides();
  if (tuning) preset.tuning = tuning;
  storage.set(presetKey, { ...storage.get(presetKey), [id]: preset });
  ui["preset-url"].value = presetUrl(id).href;
  ui["preset-result"].hidden = false;
  renderPresetLinks();
  setStatus("presetSaved");
});

ui.logout.addEventListener("click", () => {
  storage.remove("tokens");
  ui["destination-playlist"].value = "";
  ui["cache-link"].hidden = true;
  setStatus("disconnected");
  showConnection();
});

async function initialize() {
  ui["callback-url"].textContent = callbackUrl;
  const pending = authReturn ? JSON.parse(sessionStorage.getItem(pendingKey)) : null;
  if (authReturn) sessionStorage.removeItem(pendingKey);
  let signedIn = false;
  try {
    await completeSignIn();
    signedIn = authReturn && Boolean(storage.get("tokens"));
  } catch (error) {
    report(error);
  }

  const presets = storage.get(presetKey) ?? {};
  const selectedPresetId = presetId ?? pending?.preset;
  const preset = Object.hasOwn(presets, selectedPresetId) ? presets[selectedPresetId] : null;
  const directStart = presetId === null && launch.searchParams.get("autostart") === "1";
  const linkedPlaylist = playlistId(launch.searchParams.get("playlist") ?? "");
  const source = pending?.source ?? preset?.source ?? linkedPlaylist;
  const linkedMode = launch.searchParams.get("mode");
  const requestedMode = templateMode(linkedMode);
  const mode = templateMode(pending?.mode)
    ?? requestedMode
    ?? templateMode(preset?.mode)
    ?? templateMode(storage.get("mode"));
  ui.mode.value = mode ?? (directStart ? "balanced" : "random");

  let tuning;
  if (pending) {
    tuning = pending.tuning;
  } else if (linkedMode === "custom") {
    // Older mode=custom links used the last custom settings outside of a preset.
    tuning = preset ? preset.tuning : storage.get(tuningKey) ?? storage.get("balanced-tuning");
  } else if (preset && !requestedMode) {
    tuning = preset.tuning;
  } else if (!preset && history.state?.playlist === source) {
    tuning = history.state.tuning;
  }
  setBalancedTuning(tuning);
  showBalancedControls();
  ui.playlist.value = source ?? (directStart ? "" : storage.get("source") ?? "");
  ui["client-id"].value = storage.get("client-id") ?? "";
  if (preset) {
    ui["preset-name"].value = preset.name;
    ui["preset-autostart"].checked = preset.autostart;
    ui["preset-url"].value = presetUrl(selectedPresetId).href;
    ui["preset-result"].hidden = false;
    ui.presets.open = true;
  }
  showConnection();

  if (signedIn && source) {
    setBusy(true);
    try {
      const { cacheKey } = await getCacheSettings();
      const target = storage.get(cacheKey);
      if (target) showCache(target);
      setStatus(target ? "signedIn" : "signedInNewPlaylist");
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  } else if (presetId && !preset) {
    setStatus("missingPreset");
  } else if (!authReturn && directStart && !linkedPlaylist) {
    setStatus("invalidDirectLink");
  } else if (!authReturn && (preset?.autostart || directStart) && source && storage.get("tokens")) {
    // Consume the launch URL so a reload cannot replace the playlist a second time.
    launch.searchParams.delete("preset");
    launch.searchParams.delete("autostart");
    launch.searchParams.set("playlist", source);
    launch.searchParams.set("mode", ui.mode.value);
    history.replaceState({ playlist: source, tuning: balancedOverrides() }, "", launch);
    await runShuffle();
  }
}

const savedLanguage = storage.get("language");
const browserLanguage = navigator.language?.split("-")[0].toLowerCase();
applyLanguage(savedLanguage === "de" || savedLanguage === "en" ? savedLanguage : browserLanguage === "de" ? "de" : "en");
await initialize();
