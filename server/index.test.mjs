import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createShuffleServer, readConfig } from "./index.mjs";

const source = "a".repeat(22);
const target = "b".repeat(22);
const setupKey = "s".repeat(43);
const shortcutKey = "k".repeat(43);
const configEnv = {
  PUBLIC_URL: "http://127.0.0.1:8080",
  SPOTIFY_CLIENT_ID: "c".repeat(32),
  SETUP_KEY: setupKey,
  SHORTCUT_KEY: shortcutKey,
  SPOTIFY_TARGET_PLAYLIST: target,
  PRESETS_JSON: JSON.stringify({ auto: { playlist: source, mode: "balanced" } })
};

const track = n => "spotify:track:" + String(n).padStart(22, "0");
const uris = Array.from({ length: 105 }, (_, n) => track(n === 104 ? 1 : n));

async function fixture(t) {
  const dataDir = await mkdtemp(join(tmpdir(), "shuffle-test-"));
  const config = readConfig({ ...configEnv, DATA_DIR: dataDir });
  const calls = [];
  const behavior = { failAppend: false, noDevice: false, foreignTarget: false, rejectedToken: false };
  let challenge;
  const server = createShuffleServer(config, async (address, options) => {
    const url = new URL(address);
    const { pathname: path, searchParams } = url;
    const method = options.method;
    const body = options.body;
    calls.push({ path, method, body });
    if (path === "/api/token") {
      if (body.get("grant_type") === "authorization_code") {
        assert.equal(body.get("code"), "fixture");
        assert.equal(body.get("redirect_uri"), config.redirectUri);
        assert.equal(createHash("sha256").update(body.get("code_verifier")).digest("base64url"), challenge);
        return Response.json({ access_token: "old", refresh_token: "old-refresh", expires_in: 3600 });
      }
      assert.equal(body.get("refresh_token"), "old-refresh");
      return Response.json({ access_token: "new", refresh_token: "new-refresh", expires_in: 3600 });
    }
    if (path === "/v1/me") {
      if (behavior.rejectedToken && options.headers.Authorization === "Bearer old") {
        return Response.json({}, { status: 401 });
      }
      return Response.json({ id: "owner" });
    }
    if (path === "/v1/playlists/" + target) {
      return Response.json({ owner: { id: behavior.foreignTarget ? "other" : "owner" } });
    }
    if (path === "/v1/playlists/" + source + "/items") {
      const offset = Number(searchParams.get("offset") ?? 0);
      const items = uris.slice(offset, offset + 50).map((uri, n) => ({
        item: { uri, artists: [{ name: "artist" + n % 4 }], album: { name: "album" + n % 9 } }
      }));
      const next = items.length === 50
        ? "https://api.spotify.com" + path + "?offset=" + (offset + 50)
        : null;
      return Response.json({ items, next });
    }
    if (path === "/v1/playlists/" + target + "/items") {
      if (behavior.failAppend && method === "POST") {
        return Response.json({}, { status: 429, headers: { "Retry-After": "8" } });
      }
      return Response.json({ snapshot_id: "fixture" });
    }
    if (path.startsWith("/v1/me/player/")) return new Response(null, { status: behavior.noDevice ? 404 : 204 });
    throw new Error("Unexpected mock request: " + path);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });
  const request = (path, options) => fetch("http://127.0.0.1:" + server.address().port + path, options);
  const post = (preset = "auto", key = shortcutKey) => request("/shuffle", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ preset })
  });
  async function connect() {
    const login = await request("/connect", {
      method: "POST", body: new URLSearchParams({ key: setupKey }), redirect: "manual"
    });
    assert.equal(login.status, 303);
    const url = new URL(login.headers.get("location"));
    challenge = url.searchParams.get("code_challenge");
    const path = "/callback?code=fixture&state=" + url.searchParams.get("state");
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await request(path)).status, 400);
    assert.equal((await request(path, { headers: { Cookie: cookie }, redirect: "manual" })).status, 303);
    assert.equal((await request(path, { headers: { Cookie: cookie } })).status, 400);
  }
  return { behavior, calls, connect, dataDir, post, request };
}

test("validates origin, separate keys and source/destination on startup", () => {
  for (const override of [
    { PUBLIC_URL: "http://example.org" },
    { SETUP_KEY: shortcutKey },
    { SPOTIFY_TARGET_PLAYLIST: source }
  ]) assert.throws(() => readConfig({ ...configEnv, ...override }));
});

test("requires authentication and preserves duplicates through paginated browserless playback", async t => {
  const { behavior, calls, connect, dataDir, post } = await fixture(t);
  assert.equal((await post("auto", setupKey)).status, 401);
  assert.equal((await post("unknown")).status, 404);
  assert.equal((await (await post()).json()).code, "spotify_login_required");
  assert.equal(calls.length, 0);
  await connect();
  behavior.rejectedToken = true;
  const response = await post();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true, mode: "balanced", count: 105, playlistUrl: "https://open.spotify.com/playlist/" + target
  });
  const writes = calls.slice(-4);
  assert.deepEqual(writes.map(({ path, method }) => [path, method]), [
    ["/v1/playlists/" + target + "/items", "PUT"],
    ["/v1/playlists/" + target + "/items", "POST"],
    ["/v1/me/player/shuffle", "PUT"],
    ["/v1/me/player/play", "PUT"]
  ]);
  const blocks = writes.slice(0, 2).map(({ body }) => JSON.parse(body).uris);
  assert.deepEqual(blocks.map(items => items.length), [100, 5]);
  assert.deepEqual(blocks.flat().sort(), [...uris].sort());
  const saved = JSON.parse(await readFile(join(dataDir, "spotify-tokens.json"), "utf8"));
  assert.equal(saved.refreshToken, "new-refresh");
});

test("does not overwrite someone else's playlist or play a partial write", async t => {
  const { behavior, calls, connect, post } = await fixture(t);
  await connect();
  behavior.foreignTarget = true;
  assert.equal((await (await post()).json()).code, "target_not_owned");
  assert(!calls.some(call => call.method === "PUT"));
  behavior.foreignTarget = false;
  behavior.failAppend = true;
  const response = await post();
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "8");
  assert.equal((await response.json()).code, "playlist_write_failed");
  assert(!calls.some(call => call.path.startsWith("/v1/me/player")));
});

test("returns the prepared playlist when Spotify has no active device", async t => {
  const { behavior, connect, post } = await fixture(t);
  await connect();
  behavior.noDevice = true;
  const response = await post();
  assert.equal(response.status, 409);
  const info = await response.json();
  assert.equal(info.code, "no_active_device");
  assert.equal(info.playlistUrl, "https://open.spotify.com/playlist/" + target);
  assert.equal(info.count, 105);
});
