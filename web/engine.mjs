import { LocalizedError } from "./i18n.mjs?v=2";

import * as common from "./engine/common.mjs";
import * as artist from "./engine/artist.mjs";
import * as album from "./engine/album.mjs";
import * as balanced from "./engine/balanced.mjs";
import * as validation from "./engine/validation.mjs?v=3";

const variation = { label: "customVariation", min: 0, max: 10, defaultValue: 5 };
const repeatStrength = label => ({ label, min: 0, max: 10, defaultValue: 5 });

export const templates = {
  random: {
    label: "Random",
    controls: {
      intensity: { label: "shuffleIntensity", hint: "shuffleIntensityHint", min: 0, max: 10, defaultValue: 10 }
    }
  },
  artist: { label: "Artist", controls: { repeats: repeatStrength("artistRepeats"), variation } },
  album: { label: "Album", controls: { repeats: repeatStrength("albumRepeats"), variation } },
  balanced: {
    label: "Balanced",
    controls: {
      focus: { label: "customFocus", hint: "customFocusHint", min: -10, max: 10, defaultValue: 0 },
      variation
    }
  }
};

export function resolveTuning(mode, tuning) {
  return Object.fromEntries(Object.entries(templates[mode].controls).map(([key, control]) => {
    const value = tuning?.[key];
    return [key, Number.isInteger(value) && value >= control.min && value <= control.max
      ? value : control.defaultValue];
  }));
}

function shuffleRandom(tracks, intensity) {
  if (intensity === 10) return common.fisherYates(tracks);
  const blockSize = 1 + Math.floor((tracks.length - 1) * intensity / 10);
  const result = [];
  for (let offset = 0; offset < tracks.length; offset += blockSize) {
    for (const track of common.fisherYates(tracks.slice(offset, offset + blockSize))) result.push(track);
  }
  return result;
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

export async function shuffleUris(tracks, mode, tuning) {
  validation.validateTracks(tracks);
  if (!Object.hasOwn(templates, mode)) throw new LocalizedError("unknownMode");
  const { intensity, repeats, focus, variation } = resolveTuning(mode, tuning);
  let result;
  switch (mode) {
    case "random":
      result = shuffleRandom(tracks, intensity);
      break;
    case "artist":
    case "album": {
      const config = { ...await getDefaults() };
      for (let distance = 1; distance <= 4; distance++) {
        config[`${mode}_penalty_${distance}`] *= repeats / 5;
      }
      config[`${mode}_randomness`] *= variation / 5;
      result = (mode === "artist" ? artist : album).shuffle(tracks, config, common);
      break;
    }
    case "balanced": {
      const config = await getDefaults();
      const artistWeight = config.balanced_artist_weight;
      const albumWeight = config.balanced_album_weight;
      const shift = focus / 10 * (focus < 0 ? albumWeight : artistWeight);
      result = balanced.shuffle(tracks, {
        ...config,
        balanced_artist_weight: artistWeight - shift,
        balanced_album_weight: albumWeight + shift,
        balanced_randomness: config.balanced_randomness * variation / 5
      }, common, artist, album).tracks;
      break;
    }
  }
  validation.validateShuffledTracks(tracks, result, mode);
  return result.map(track => track.uri);
}
