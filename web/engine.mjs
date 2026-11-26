import "../scriptable/Spotify%20Shuffle%20Common.js?web=1";
import "../scriptable/Spotify%20Shuffle%20Artist.js";
import "../scriptable/Spotify%20Shuffle%20Album.js";
import "../scriptable/Spotify%20Shuffle%20Balanced.js";
import "../scriptable/Spotify%20Shuffle%20Validation.js";

const common = globalThis.spotifyShuffleCommon;
const artist = globalThis.spotifyShuffleArtist;
const album = globalThis.spotifyShuffleAlbum;
const balanced = globalThis.spotifyShuffleBalanced;
const validation = globalThis.spotifyShuffleValidation;

export const modes = Object.freeze({
  random: "Random",
  artist: "Artist",
  album: "Album",
  balanced: "Balanced"
});

let defaults;
async function getDefaults() {
  if (!defaults) {
    const response = await fetch(new URL("../config/config.example.json", import.meta.url));
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
