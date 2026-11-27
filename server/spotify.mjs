import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const accounts = "https://accounts.spotify.com";
const apiBase = "https://api.spotify.com/v1/";
const scopes = "playlist-read-private playlist-modify-private playlist-modify-public user-read-private user-modify-playback-state";

export class ServiceError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}

export const randomToken = () => randomBytes(32).toString("base64url");

export function spotifyClient({ clientId, redirectUri, dataDir, fetcher = fetch }) {
  const tokenFile = join(dataDir, "spotify-tokens.json");
  const tokenTemp = tokenFile + ".tmp";
  const authorize = (state, verifier) => {
    const url = new URL("/authorize", accounts);
    url.search = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      code_challenge_method: "S256",
      code_challenge: createHash("sha256").update(verifier).digest("base64url")
    });
    return url;
  };

  async function request(url, options) {
    try {
      return await fetcher(url, { ...options, redirect: "error", signal: AbortSignal.timeout(15_000) });
    } catch {
      throw new ServiceError(502, "spotify_unreachable", "Spotify ist gerade nicht erreichbar.");
    }
  }

  async function requestTokens(parameters, previousRefresh) {
    const response = await request(accounts + "/api/token", {
      method: "POST",
      body: new URLSearchParams({ ...parameters, client_id: clientId })
    });
    const result = await response.json().catch(() => ({}));
    if (previousRefresh && result?.error === "invalid_grant") {
      await rm(tokenFile, { force: true });
      throw loginRequired();
    }
    const refreshToken = result?.refresh_token ?? previousRefresh;
    if (!response.ok || !result?.access_token || !refreshToken || !Number.isFinite(result.expires_in)) {
      throw new ServiceError(502, "spotify_token_error", "Spotify konnte die Anmeldung nicht bestätigen.");
    }

    const tokens = {
      clientId,
      accessToken: result.access_token,
      refreshToken,
      expiry: Date.now() + result.expires_in * 1000
    };
    await mkdir(dataDir, { recursive: true, mode: 0o700 });
    await writeFile(tokenTemp, JSON.stringify(tokens), { mode: 0o600 });
    await rename(tokenTemp, tokenFile);
    return tokens;
  }

  const loginRequired = () => new ServiceError(409, "spotify_login_required", "Verbinde Spotify einmalig unter /connect.");

  async function accessToken(rejected) {
    let tokens;
    try {
      tokens = JSON.parse(await readFile(tokenFile, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") throw loginRequired();
      throw error;
    }
    if (tokens.clientId !== clientId) throw loginRequired();
    if (tokens.accessToken !== rejected && tokens.expiry > Date.now() + 60_000) return tokens.accessToken;
    return (await requestTokens({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken
    }, tokens.refreshToken)).accessToken;
  }

  async function api(path, { method = "GET", body } = {}) {
    const url = new URL(path, apiBase);
    if (!url.href.startsWith(apiBase)) {
      throw new ServiceError(502, "invalid_spotify_url", "Spotify hat eine ungültige API-Adresse geliefert.");
    }
    const send = token => request(url, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const token = await accessToken();
    let response = await send(token);
    if (response.status === 401) response = await send(await accessToken(token));
    if (response.status === 401) throw loginRequired();
    if (response.status === 204) return null;
    const result = await response.json().catch(() => null);
    if (response.ok) return result;
    if (response.status === 429) {
      const retry = response.headers.get("retry-after");
      const details = /^\d+$/.test(retry ?? "") ? { retryAfter: Number(retry) } : {};
      throw new ServiceError(429, "spotify_rate_limit", "Spotify begrenzt gerade die Anfragen.", details);
    }
    const details = { spotifyStatus: response.status };
    // Use a gateway status for upstream failures and keep our endpoint's status codes distinct.
    throw new ServiceError(502, "spotify_api_error", result?.error?.message || "Spotify hat die Anfrage abgelehnt.", details);
  }

  const connect = (code, verifier) => requestTokens({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri
  });

  return { api, authorize, connect };
}
