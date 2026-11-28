import { LocalizedError } from "./i18n.mjs?v=3";
import * as common from "./engine/common.mjs?v=2";
import * as artist from "./engine/artist.mjs";
import * as album from "./engine/album.mjs";
import * as balanced from "./engine/balanced.mjs?v=2";
import * as validation from "./engine/validation.mjs?v=4";

export const controls = {
  artistSpacing: { label: "artistSpacing", hint: "artistSpacingHint" },
  albumSpacing: { label: "albumSpacing", hint: "albumSpacingHint" },
  variation: { label: "shuffleVariation", hint: "shuffleVariationHint" }
};

export const templates = {
  random: { label: "Random", settings: { artistSpacing: 0, albumSpacing: 0, variation: 10 } },
  artist: { label: "Artist", settings: { artistSpacing: 10, albumSpacing: 0, variation: 5 } },
  album: { label: "Album", settings: { artistSpacing: 0, albumSpacing: 10, variation: 5 } },
  balanced: { label: "Balanced", settings: { artistSpacing: 5, albumSpacing: 4, variation: 5 } }
};

export function resolveSettings(template, settings) {
  return Object.fromEntries(Object.entries(templates[template].settings).map(([key, fallback]) => {
    const value = settings?.[key];
    return [key, Number.isInteger(value) && value >= 0 && value <= 10 ? value : fallback];
  }));
}

export async function settingsFromLegacy(legacy) {
  const { legacyTuning } = await import("./engine/legacy.mjs");
  const { intensity, repeats, focus, variation } = legacyTuning(legacy.tuning);
  switch (legacy.mode) {
    case "random":
      return resolveSettings("random", { variation: intensity });
    case "artist":
      return resolveSettings("artist", { artistSpacing: repeats, variation });
    case "album":
      return resolveSettings("album", { albumSpacing: repeats, variation });
    case "balanced": {
      const shift = Math.round(focus * (focus < 0 ? 0.4 : 0.5));
      return resolveSettings("balanced", { artistSpacing: 5 - shift, albumSpacing: 4 + shift, variation });
    }
  }
}

let defaults;
async function getDefaults() {
  if (!defaults) {
    const response = await fetch(new URL("./engine/defaults.json", import.meta.url));
    if (!response.ok) throw new LocalizedError("loadDefaultsFailed");
    defaults = await response.json();
  }
  return defaults;
}

export async function shuffleUris(tracks, settings, legacy) {
  validation.validateTracks(tracks);
  let result;
  if (legacy) {
    const { shuffleLegacy } = await import("./engine/legacy.mjs");
    result = shuffleLegacy(tracks, legacy.mode === "random" ? null : await getDefaults(), legacy);
  } else {
    const { artistSpacing, albumSpacing, variation } = settings;
    if (!artistSpacing && !albumSpacing) {
      result = common.shuffleSections(tracks, variation);
    } else {
      const config = await getDefaults();
      const variationScale = (variation / 5) ** 2;
      result = balanced.shuffle(tracks, {
        ...config,
        balanced_artist_weight: artistSpacing / 5,
        balanced_album_weight: albumSpacing / 5,
        balanced_randomness: config.balanced_randomness * variationScale,
        balanced_selection_window: config.balanced_selection_window * variationScale
      }, common, artist, album, false).tracks;
    }
  }
  validation.validateShuffledTracks(tracks, result, legacy?.mode ?? "Shuffle");
  return result.map(track => track.uri);
}
