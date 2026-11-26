import {
  api, callbackUrl, completeSignIn, loadTracks, LoginRequired, playlistId,
  signIn, SpotifyError, storage, writeCache
} from "./spotify.mjs";

const ui = Object.fromEntries(
  ["setup", "ready", "callback-url", "client-id", "login", "shuffle", "playlist",
    "destination", "destination-playlist", "cache-link", "logout", "status"]
    .map(id => [id, document.getElementById(id)])
);
const preselected = new URLSearchParams(location.search).get("playlist");
let busy = false;

function showConnection() {
  const connected = Boolean(storage.get("tokens"));
  ui.setup.hidden = connected;
  ui.ready.hidden = !connected;
}

function setBusy(value) {
  busy = value;
  for (const control of document.querySelectorAll("button, input")) control.disabled = value;
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
  const shuffled = globalThis.fisherYates(tracks);

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

ui.shuffle.addEventListener("submit", async event => {
  event.preventDefault();
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
});

ui.logout.addEventListener("click", () => {
  storage.remove("tokens");
  ui["destination-playlist"].value = "";
  ui["cache-link"].hidden = true;
  ui.status.textContent = "Spotify-Verbindung getrennt.";
  showConnection();
});

ui["callback-url"].textContent = callbackUrl;
try {
  await completeSignIn();
} catch (error) {
  report(error);
}
ui["client-id"].value = storage.get("client-id") ?? "";
ui.playlist.value = playlistId(preselected ?? "") ?? storage.get("source") ?? "";
showConnection();
