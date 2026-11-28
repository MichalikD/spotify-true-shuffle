import { modes, shuffleUris } from "./engine.mjs?v=2";
import {
  api, callbackUrl, completeSignIn, loadTracks, LoginRequired, playlistId,
  signIn, SpotifyError, storage, writeCache
} from "./spotify.mjs";

const ui = Object.fromEntries(
  ["setup", "ready", "callback-url", "client-id", "login", "shuffle", "playlist",
    "mode", "presets", "preset-links", "preset-form", "preset-name", "preset-autostart",
    "preset-result", "preset-url", "destination", "destination-playlist", "cache-link", "logout", "status"]
    .map(id => [id, document.getElementById(id)])
);
const launch = new URL(location.href);
const presetId = launch.searchParams.get("preset");
const authReturn = launch.searchParams.has("code") || launch.searchParams.has("error");
const pendingKey = "spotify-true-shuffle-web:pending-shuffle";
const presetKey = "presets";
let busy = false;

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
  ui.status.textContent = error.message || "Der Vorgang ist fehlgeschlagen.";
  if (error instanceof LoginRequired) showConnection();
}

function showCache(cacheId) {
  ui["cache-link"].href = "https://open.spotify.com/playlist/" + cacheId;
  ui["cache-link"].hidden = false;
}

async function getCacheSettings() {
  const profile = await api("me");
  const accountId = profile?.account_id ?? profile?.id;
  if (!accountId) throw new Error("Das Spotify-Konto konnte nicht ermittelt werden.");

  return { profile, cacheKey: "cache:" + accountId };
}

async function shuffle() {
  const sourceId = playlistId(ui.playlist.value);
  if (!sourceId) throw new Error("Gib einen gültigen Spotify-Playlist-Link oder eine Playlist-ID ein.");

  const mode = ui.mode.value;
  const { cacheKey } = await getCacheSettings();
  let cacheId = storage.get(cacheKey);
  if (cacheId === sourceId) throw new Error("Wähle eine andere Quelle als die Wiedergabeliste der Web-App.");

  ui.status.textContent = "Playlist wird geladen …";
  let tracks;
  try {
    tracks = await loadTracks(sourceId);
  } catch (error) {
    if (error instanceof SpotifyError && error.status === 403) {
      throw new Error("Spotify erlaubt keinen Zugriff auf diese Playlist. Teste eine eigene Playlist oder eine, an der du mitarbeitest.");
    }
    throw error;
  }
  if (!tracks.length) throw new Error("Die Playlist enthält keine unterstützten Spotify-Titel.");
  storage.set("source", sourceId);
  storage.set("mode", mode);
  const shuffled = await shuffleUris(tracks, mode);

  ui.status.textContent = "Wiedergabeliste wird geschrieben …";
  if (!cacheId) {
    const created = await api("me/playlists", {
      method: "POST",
      body: { name: "True Shuffle – Web", public: false }
    });
    cacheId = playlistId(created?.id ?? "");
    if (!cacheId) throw new Error("Spotify hat keine gültige ID für die Wiedergabeliste geliefert.");
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
      throw new Error("Die Wiedergabeliste ist fertig. Öffne Spotify auf deinem Wunschgerät und starte dort die Wiedergabe.");
    }
    throw error;
  }
  ui.status.textContent = shuffled.length + " Titel gemischt. Spotify hat den Wiedergabestart bestätigt.";
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
      preset: ui["preset-name"].value.trim().toLowerCase()
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
    if (!cacheId) throw new Error("Gib einen gültigen Spotify-Link für die Wiedergabeliste ein.");
    if (cacheId === playlistId(ui.playlist.value)) {
      throw new Error("Quelle und Wiedergabeliste müssen verschieden sein.");
    }
    const { profile, cacheKey } = await getCacheSettings();
    const playlist = await api("playlists/" + cacheId + "?fields=name,owner(id),public");
    if (!profile.id || playlist?.owner?.id !== profile.id) {
      throw new Error("Wähle eine Wiedergabeliste, die deinem Spotify-Konto gehört.");
    }
    storage.set(cacheKey, cacheId);
    showCache(cacheId);
    const canModifyPublic = storage.get("tokens")?.scope?.split(" ").includes("playlist-modify-public");
    ui.status.textContent = "Wiedergabeliste gespeichert: " + (playlist.name || cacheId)
      + (playlist.public === true && !canModifyPublic
        ? ". Trenne die Spotify-Verbindung und verbinde sie erneut, um öffentliche Playlists schreiben zu können."
        : ".");
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
  ui.status.textContent = "Spotify wird geprüft …";
  try {
    if (navigator.locks) {
      await navigator.locks.request("spotify-true-shuffle-web", { ifAvailable: true }, lock => {
        if (!lock) throw new Error("Ein Shuffle läuft bereits in einem anderen Tab.");
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
  if (!window.confirm("Startlink „" + name + "“ löschen?")) return;

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
  ui.status.textContent = "Startlink „" + name + "“ gelöscht.";
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
    remove.textContent = "Löschen";
    remove.setAttribute("aria-label", "Startlink „" + preset.name + "“ löschen");
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
    ui.status.textContent = "Verwende einen Namen ohne Leerzeichen, zum Beispiel Auto-Balanced.";
    return;
  }
  if (!source) {
    ui.status.textContent = "Wähle eine gültige Quellplaylist für den Startlink.";
    return;
  }
  const preset = { name, source, mode: ui.mode.value, autostart: ui["preset-autostart"].checked };
  storage.set(presetKey, { ...storage.get(presetKey), [id]: preset });
  ui["preset-url"].value = presetUrl(id).href;
  ui["preset-result"].hidden = false;
  renderPresetLinks();
  ui.status.textContent = "Startlink gespeichert.";
});

ui.logout.addEventListener("click", () => {
  storage.remove("tokens");
  ui["destination-playlist"].value = "";
  ui["cache-link"].hidden = true;
  ui.status.textContent = "Spotify-Verbindung getrennt.";
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
  const requestedMode = Object.hasOwn(modes, linkedMode) ? linkedMode : null;
  const savedMode = storage.get("mode");
  const mode = pending?.mode ?? requestedMode ?? preset?.mode ?? savedMode;
  for (const [id, label] of Object.entries(modes)) ui.mode.add(new Option(label, id));
  ui.mode.value = Object.hasOwn(modes, mode) ? mode : directStart ? "balanced" : "random";
  ui.playlist.value = source ?? (directStart ? "" : storage.get("source") ?? "");
  ui["client-id"].value = storage.get("client-id") ?? "";
  if (preset) {
    ui["preset-name"].value = preset.name;
    ui["preset-autostart"].checked = preset.autostart;
    ui["preset-url"].value = presetUrl(selectedPresetId).href;
    ui["preset-result"].hidden = false;
    ui.presets.open = true;
  }
  renderPresetLinks();
  showConnection();

  if (signedIn && source) {
    setBusy(true);
    try {
      const { cacheKey } = await getCacheSettings();
      const target = storage.get(cacheKey);
      if (target) showCache(target);
      ui.status.textContent = target
        ? "Spotify ist verbunden. Prüfe Quelle, Modus und die verlinkte Wiedergabeliste und tippe dann auf „Mischen und abspielen“."
        : "Spotify ist verbunden. Beim Start wird die private Wiedergabeliste „True Shuffle – Web“ angelegt.";
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  } else if (presetId && !preset) {
    ui.status.textContent = "Dieser Startlink ist in diesem Browser nicht gespeichert.";
  } else if (!authReturn && directStart && !linkedPlaylist) {
    ui.status.textContent = "Der Direktlink enthält keine gültige Spotify-Playlist.";
  } else if (!authReturn && (preset?.autostart || directStart) && source && storage.get("tokens")) {
    // Consume the launch URL so a reload cannot replace the playlist a second time.
    launch.searchParams.delete("preset");
    launch.searchParams.delete("autostart");
    launch.searchParams.set("playlist", source);
    launch.searchParams.set("mode", ui.mode.value);
    history.replaceState(null, "", launch);
    await runShuffle();
  }
}

await initialize();
