import { LocalizedError } from "./i18n.mjs?v=2";

const playlistIdPattern = /^[a-zA-Z0-9]{22}$/;
const trackUriPattern = /^spotify:track:[a-zA-Z0-9]{22}$/;

export function playlistId(input) {
  const value = input.trim();
  if (playlistIdPattern.test(value)) return value;
  const uri = /^spotify:playlist:([a-zA-Z0-9]{22})$/.exec(value);
  if (uri) return uri[1];
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.origin === "https://open.spotify.com") {
    return /^\/(?:intl-[a-zA-Z-]+\/)?playlist\/([a-zA-Z0-9]{22})\/?$/.exec(url.pathname)?.[1] ?? null;
  }
  return null;
}

export async function loadTracks(api, id) {
  let pageUrl = "playlists/" + id + "/items?limit=50";
  const visited = new Set();
  const tracks = [];
  while (pageUrl) {
    if (visited.has(pageUrl)) throw new LocalizedError("repeatedPlaylistPage");
    visited.add(pageUrl);
    const page = await api(pageUrl);
    if (!Array.isArray(page?.items)) throw new LocalizedError("invalidPlaylistPage");
    for (const entry of page.items) {
      const track = entry?.item ?? entry?.track;
      if (trackUriPattern.test(track?.uri) && track.is_playable !== false && !track.is_local && !entry.is_local) {
        tracks.push({
          uri: track.uri,
          name: track.name ?? "",
          artists: (track.artists ?? []).map(artist => artist?.name ?? "").filter(Boolean),
          album: { name: track.album?.name ?? "", uri: track.album?.uri ?? "" }
        });
      }
    }
    pageUrl = page.next;
  }
  return tracks;
}

export async function writeCache(api, id, tracks) {
  for (let offset = 0; offset < tracks.length; offset += 100) {
    await api("playlists/" + id + "/items", {
      method: offset === 0 ? "PUT" : "POST",
      body: { uris: tracks.slice(offset, offset + 100) }
    });
  }
}
