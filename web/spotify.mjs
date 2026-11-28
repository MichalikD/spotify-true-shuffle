import { LocalizedError } from "./i18n.mjs?v=3";
import * as playlists from "./playlists.mjs?v=4";

const apiBase = "https://api.spotify.com/v1/";
const tokenUrl = "https://accounts.spotify.com/api/token";
const prefix = "spotify-true-shuffle-web:";
const scopes = [
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-private",
  "user-modify-playback-state"
];

export const callbackUrl = new URL("./", location.href).href;
export const storage = {
  get: key => JSON.parse(localStorage.getItem(prefix + key)),
  set: (key, value) => localStorage.setItem(prefix + key, JSON.stringify(value)),
  remove: key => localStorage.removeItem(prefix + key)
};

export class LoginRequired extends LocalizedError {}
export class SpotifyError extends LocalizedError {
  constructor(status, key, ...values) {
    super(key, ...values);
    this.status = status;
  }
}

function randomString() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)),
    byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function signIn(clientId) {
  const verifier = randomString();
  const state = randomString();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  sessionStorage.setItem(prefix + "oauth", JSON.stringify({ verifier, state, clientId }));
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: callbackUrl,
    scope: scopes.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge
  });
  location.assign(url);
}

async function tokenRequest(params, clientId, oldRefreshToken) {
  const response = await fetch(tokenUrl, {
    method: "POST",
    body: new URLSearchParams({ ...params, client_id: clientId }),
    redirect: "error"
  });
  const data = await response.json().catch(() => ({}));
  if (data.error === "invalid_grant" && oldRefreshToken) {
    if (storage.get("tokens")?.refreshToken === oldRefreshToken) storage.remove("tokens");
    throw new LoginRequired("loginExpired");
  }
  if (!response.ok || !data.access_token || !Number.isFinite(data.expires_in)) {
    throw new LocalizedError("loginNotConfirmed", response.status);
  }
  const refreshToken = data.refresh_token ?? oldRefreshToken;
  if (!refreshToken) throw new LocalizedError("noRefreshToken");

  const tokens = {
    clientId,
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? (oldRefreshToken ? storage.get("tokens")?.scope : undefined)
  };
  storage.set("tokens", tokens);
  return tokens;
}

export async function completeSignIn() {
  const params = new URLSearchParams(location.search);
  if (!params.has("code") && !params.has("error")) return;
  history.replaceState(null, "", callbackUrl);

  const pending = JSON.parse(sessionStorage.getItem(prefix + "oauth"));
  sessionStorage.removeItem(prefix + "oauth");
  if (!pending?.state || pending.state !== params.get("state")) {
    throw new LocalizedError("loginMismatch");
  }
  if (params.has("error") || !params.get("code")) {
    throw new LocalizedError("loginCancelled");
  }
  await tokenRequest({
    grant_type: "authorization_code",
    code: params.get("code"),
    code_verifier: pending.verifier,
    redirect_uri: callbackUrl
  }, pending.clientId);
}

async function accessToken(previousToken) {
  const tokens = storage.get("tokens");
  if (!tokens) throw new LoginRequired("loginRequired");
  if (tokens.accessToken !== previousToken && Date.now() + 60_000 < tokens.expiresAt) {
    return tokens.accessToken;
  }
  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken
  }, tokens.clientId, tokens.refreshToken);
  return refreshed.accessToken;
}

export async function api(path, { method = "GET", body } = {}) {
  const url = new URL(path, apiBase);
  if (!url.href.startsWith(apiBase) || url.username || url.password) {
    throw new LocalizedError("invalidApiAddress");
  }
  const send = token => {
    const headers = { Authorization: "Bearer " + token };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return fetch(url, { method, headers, body: JSON.stringify(body), redirect: "error" });
  };

  const token = await accessToken();
  let response = await send(token);
  if (response.status === 401) response = await send(await accessToken(token));
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (response.ok) return data;
  if (response.status === 401) {
    storage.remove("tokens");
    throw new LoginRequired("spotifyDenied");
  }
  if (response.status === 429) {
    const seconds = response.headers.get("Retry-After");
    throw seconds && /^\d+$/.test(seconds)
      ? new SpotifyError(429, "spotifyRetrySeconds", seconds)
      : new SpotifyError(429, "spotifyRetry");
  }
  const detail = data?.error?.message;
  throw new SpotifyError(response.status, detail ? "spotifyHttpDetail" : "spotifyHttp", response.status, detail);
}

export const playlistId = playlists.playlistId;
export const loadTracks = id => playlists.loadTracks(api, id);
export const writeCache = (id, tracks) => playlists.writeCache(api, id, tracks);
