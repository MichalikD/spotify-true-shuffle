import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { modes, shuffleUris } from "../web/engine.mjs";
import { loadTracks, playlistId, writeCache } from "../web/playlists.mjs";
import { randomToken, ServiceError, spotifyClient } from "./spotify.mjs";

const settings = JSON.parse(readFileSync(new URL("../config/config.example.json", import.meta.url), "utf8"));
const setupPage = `<!doctype html>
<html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spotify True Shuffle verbinden</title>
<h1>Spotify verbinden</h1>
<form method="post" action="/connect">
  <label>Einrichtungsschlüssel <input type="password" name="key" required autocomplete="off"></label>
  <button>Mit Spotify verbinden</button>
</form></html>`;

const digest = value => createHash("sha256").update(value).digest();
const matches = (value, expected) => typeof value === "string" && timingSafeEqual(digest(value), digest(expected));

function reply(response, status, body, type = "application/json; charset=utf-8", headers = {}) {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; form-action 'self' https://accounts.spotify.com; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    ...headers
  });
  response.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function readBody(request) {
  if (Number(request.headers["content-length"]) > 4096) {
    throw new ServiceError(413, "body_too_large", "Die Anfrage ist zu groß.");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 4096) {
      request.resume();
      throw new ServiceError(413, "body_too_large", "Die Anfrage ist zu groß.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function readConfig(env = process.env) {
  const { PUBLIC_URL, SPOTIFY_CLIENT_ID: clientId, SETUP_KEY: setupKey, SHORTCUT_KEY: shortcutKey } = env;
  const url = new URL(PUBLIC_URL);
  const loopback = url.protocol === "http:" && ["127.0.0.1", "[::1]"].includes(url.hostname);
  if ((!loopback && url.protocol !== "https:") || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("PUBLIC_URL muss ein HTTPS-Ursprung oder eine HTTP-Loopback-Adresse sein.");
  }
  if (!/^[a-f0-9]{32}$/i.test(clientId ?? "")) throw new Error("SPOTIFY_CLIENT_ID ist ungültig.");
  if (![setupKey, shortcutKey].every(key => /^[A-Za-z0-9_-]{32,}$/.test(key ?? "")) || setupKey === shortcutKey) {
    throw new Error("SETUP_KEY und SHORTCUT_KEY müssen zwei verschiedene Zufallsschlüssel sein.");
  }
  const target = playlistId(env.SPOTIFY_TARGET_PLAYLIST ?? "");
  if (!target) throw new Error("SPOTIFY_TARGET_PLAYLIST muss eine Spotify-Playlist sein.");
  const entries = JSON.parse(env.PRESETS_JSON ?? "{}");
  if (!entries || Array.isArray(entries) || typeof entries !== "object" || !Object.keys(entries).length) {
    throw new Error("PRESETS_JSON muss mindestens ein benanntes Preset enthalten.");
  }
  const presets = new Map();
  for (const [name, preset] of Object.entries(entries)) {
    const source = typeof preset?.playlist === "string" ? playlistId(preset.playlist) : null;
    if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(name) || !source || source === target || !Object.hasOwn(modes, preset.mode)) {
      throw new Error("Ungültiges Preset. Prüfe Name, Modus und die getrennten Quell- und Zielplaylists.");
    }
    presets.set(name, { source, mode: preset.mode });
  }
  return {
    clientId, setupKey, shortcutKey, target, presets,
    redirectUri: new URL("/callback", url).href,
    secureCookie: loopback ? "" : "; Secure",
    dataDir: resolve(env.DATA_DIR ?? "server/.data")
  };
}

export function createShuffleServer(config, fetcher) {
  const spotify = spotifyClient({ ...config, fetcher });
  const { api } = spotify;
  let busy = false;
  let pending;

  async function exclusive(work) {
    if (busy) throw new ServiceError(409, "busy", "Spotify True Shuffle verarbeitet bereits eine Anfrage.");
    busy = true;
    try {
      return await work();
    } finally {
      busy = false;
    }
  }

  async function shuffle({ source, mode }) {
    const { target } = config;
    const profile = await api("me");
    const destination = await api("playlists/" + target + "?fields=owner(id)");
    if (!profile?.id || destination?.owner?.id !== profile.id) {
      throw new ServiceError(403, "target_not_owned", "Die Zielplaylist muss dem verbundenen Spotify-Konto gehören.");
    }
    const tracks = await loadTracks(api, source);
    if (!tracks.length) throw new ServiceError(422, "empty_playlist", "Die Quellplaylist enthält keine unterstützten Titel.");
    const uris = await shuffleUris(tracks, mode, settings);
    const playlistUrl = "https://open.spotify.com/playlist/" + target;
    try {
      await writeCache(api, target, uris);
    } catch (error) {
      throw new ServiceError(error.status ?? 502, "playlist_write_failed",
        "Die Zielplaylist konnte nur teilweise oder gar nicht aktualisiert werden. Die Wiedergabe wurde nicht gestartet.",
        { cause: error.code, ...error.details, playlistUrl });
    }
    try {
      await api("me/player/shuffle?state=false", { method: "PUT" });
      await api("me/player/play", { method: "PUT", body: { context_uri: "spotify:playlist:" + target } });
    } catch (error) {
      if (error.details?.spotifyStatus === 404) {
        throw new ServiceError(409, "no_active_device", "Mix erstellt. Öffne Spotify auf dem gewünschten Gerät und starte die Playlist.",
          { playlistUrl, count: uris.length });
      }
      throw new ServiceError(error.status ?? 502, "playback_failed", "Mix erstellt. Spotify konnte die Wiedergabe nicht starten.",
        { cause: error.code, ...error.details, playlistUrl, count: uris.length });
    }
    return { ok: true, mode, count: uris.length, playlistUrl };
  }

  const server = createServer({ requestTimeout: 30_000 }, async (request, response) => {
    try {
      const url = new URL(request.url, config.redirectUri);
      if (request.method === "GET" && url.pathname === "/healthz") {
        return reply(response, 200, { ok: true });
      }
      if (request.method === "GET" && url.pathname === "/connect") {
        return reply(response, 200, setupPage, "text/html; charset=utf-8");
      }
      if (request.method === "POST" && url.pathname === "/connect") {
        const form = new URLSearchParams(await readBody(request));
        if (!matches(form.get("key"), config.setupKey)) {
          throw new ServiceError(403, "setup_forbidden", "Der Einrichtungsschlüssel wurde abgelehnt.");
        }
        pending = { state: randomToken(), verifier: randomToken(), cookie: randomToken(), expiry: Date.now() + 600_000 };
        return reply(response, 303, "", "text/plain; charset=utf-8", {
          Location: spotify.authorize(pending.state, pending.verifier).href,
          "Set-Cookie": "shuffle_oauth=" + pending.cookie + "; Path=/callback; HttpOnly; SameSite=Lax; Max-Age=600" + config.secureCookie
        });
      }
      if (request.method === "GET" && url.pathname === "/callback") {
        const cookie = /(?:^|;\s*)shuffle_oauth=([^;]+)/.exec(request.headers.cookie ?? "")?.[1];
        if (!pending || pending.expiry <= Date.now() || !matches(url.searchParams.get("state"), pending.state)
          || !matches(cookie, pending.cookie)) {
          throw new ServiceError(400, "invalid_oauth_state", "Die Anmeldung ist abgelaufen oder ungültig.");
        }
        await exclusive(async () => {
          const { verifier } = pending;
          pending = undefined;
          const code = url.searchParams.get("code");
          if (!code || url.searchParams.has("error")) throw new ServiceError(400, "oauth_cancelled", "Die Spotify-Anmeldung wurde abgebrochen.");
          await spotify.connect(code, verifier);
        });
        return reply(response, 303, "", "text/plain; charset=utf-8", {
          Location: "/connected",
          "Set-Cookie": "shuffle_oauth=; Path=/callback; HttpOnly; SameSite=Lax; Max-Age=0" + config.secureCookie
        });
      }
      if (request.method === "GET" && url.pathname === "/connected") {
        return reply(response, 200, "Spotify ist verbunden. Du kannst den Kurzbefehl jetzt starten.", "text/plain; charset=utf-8");
      }
      if (request.method === "POST" && url.pathname === "/shuffle") {
        if (!matches(request.headers.authorization, "Bearer " + config.shortcutKey)) {
          return reply(response, 401, { ok: false, code: "unauthorized", message: "Der Kurzbefehlschlüssel wurde abgelehnt." }, undefined,
            { "WWW-Authenticate": "Bearer" });
        }
        if (request.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
          throw new ServiceError(415, "invalid_content_type", "Sende den Preset-Namen als JSON.");
        }
        const body = await readBody(request);
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          throw new ServiceError(400, "invalid_json", "Der Request-Body enthält kein gültiges JSON.");
        }
        if (typeof input?.preset !== "string") throw new ServiceError(400, "missing_preset", "Gib den Preset-Namen an.");
        const preset = config.presets.get(input.preset);
        if (!preset) throw new ServiceError(404, "unknown_preset", "Dieses Preset ist auf dem Dienst nicht eingerichtet.");
        const result = await exclusive(() => shuffle(preset));
        return reply(response, 200, result);
      }
      return reply(response, 404, { ok: false, code: "not_found" });
    } catch (error) {
      if (!(error instanceof ServiceError)) console.error("Shuffle service error:", error.code ?? error.name);
      return reply(response, error.status ?? 500, {
        ok: false,
        code: error.code && error instanceof ServiceError ? error.code : "internal_error",
        message: error instanceof ServiceError ? error.message : "Der Dienst konnte die Anfrage nicht abschließen.",
        ...error.details
      }, undefined, error.details?.retryAfter === undefined ? {} : { "Retry-After": String(error.details.retryAfter) });
    }
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 8080);
  createShuffleServer(readConfig()).listen(port, process.env.HOST ?? "127.0.0.1", () => {
    console.log("Spotify True Shuffle hört auf Port " + port);
  });
}
