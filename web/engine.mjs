import * as common from "./engine/common.mjs";
import * as artist from "./engine/artist.mjs";
import * as album from "./engine/album.mjs";
import * as balanced from "./engine/balanced.mjs";
import * as validation from "./engine/validation.mjs";

export const modes = Object.freeze({
  random: "Random",
  artist: "Artist",
  album: "Album",
  balanced: "Balanced"
});

let defaults;
async function getDefaults() {
  if (!defaults) {
    const response = await fetch(new URL("./engine/defaults.json", import.meta.url));
    if (!response.ok) throw new Error("Die Shuffle-Einstellungen konnten nicht geladen werden.");
    defaults = await response.json();
  }
  return defaults;
}

export async function shuffleUris(tracks, mode) {
  validation.validateTracks(tracks);
  let result;
  switch (mode) {
    case "random":
      result = common.fisherYates(tracks);
      break;
    case "artist":
      result = artist.shuffle(tracks, await getDefaults(), common);
      break;
    case "album":
      result = album.shuffle(tracks, await getDefaults(), common);
      break;
    case "balanced":
      result = balanced.shuffle(tracks, await getDefaults(), common, artist, album).tracks;
      break;
    default:
      throw new Error("Unbekannter Shuffle-Modus.");
  }
  validation.validateShuffledTracks(tracks, result, mode);
  return result.map(track => track.uri);
}
