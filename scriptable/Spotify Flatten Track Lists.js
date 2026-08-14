// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;

const input = args.shortcutParameter;

function parseJsonIfNeeded(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeArtistNames(artists) {
  if (!Array.isArray(artists)) {
    return [];
  }

  return artists
    .map(artist => {
      if (typeof artist === "string") {
        return artist;
      }

      return artist?.name ?? "";
    })
    .filter(name => name.length > 0);
}

function createTrack(track) {
  return {
    uri: track.uri,
    name: track.name ?? "",
    artists: normalizeArtistNames(
      track.artists
    ),
    album: {
      name: track.album?.name ?? "",
      uri: track.album?.uri ?? ""
    }
  };
}

const tracks = [];

function collectTracks(value) {
  value = parseJsonIfNeeded(value);

  if (Array.isArray(value)) {
    for (const element of value) {
      collectTracks(element);
    }

    return;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return;
  }

  /*
   * Reguläres Spotify-Playlist-Element:
   * {
   *   "item": {
   *     "uri": "spotify:track:..."
   *   }
   * }
   */
  if (
    value.item &&
    typeof value.item === "object" &&
    typeof value.item.uri === "string" &&
    value.item.uri.startsWith(
      "spotify:track:"
    )
  ) {
    tracks.push(
      createTrack(value.item)
    );

    return;
  }

  /*
   * Bereits direktes Trackobjekt.
   */
  if (
    typeof value.uri === "string" &&
    value.uri.startsWith(
      "spotify:track:"
    )
  ) {
    tracks.push(
      createTrack(value)
    );

    return;
  }

  /*
   * Seitenergebnisse und sonstige
   * Container rekursiv durchsuchen.
   */
  for (
    const child of Object.values(value)
  ) {
    collectTracks(child);
  }
}

collectTracks(input);

if (tracks.length === 0) {
  throw new Error(
    "Flatten Track Lists hat keine gültigen Spotify-Tracks gefunden."
  );
}

Script.setShortcutOutput(
  JSON.stringify({
    tracks,
    count: tracks.length
  })
);

Script.complete();
