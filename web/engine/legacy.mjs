import * as common from "./common.mjs?v=2";
import * as artist from "./artist.mjs";
import * as album from "./album.mjs";
import * as balanced from "./balanced.mjs?v=2";

function setting(value, fallback, min = 0) {
  return Number.isInteger(value) && value >= min && value <= 10 ? value : fallback;
}

export function legacyTuning(tuning) {
  return {
    intensity: setting(tuning?.intensity, 10),
    repeats: setting(tuning?.repeats, 5),
    focus: setting(tuning?.focus, 0, -10),
    variation: setting(tuning?.variation, 5)
  };
}

export function shuffleLegacy(tracks, defaults, { mode, tuning }) {
  const { intensity, repeats, focus, variation } = legacyTuning(tuning);
  let result;
  switch (mode) {
    case "random":
      result = common.shuffleSections(tracks, intensity);
      break;
    case "artist":
    case "album": {
      const config = { ...defaults };
      for (let distance = 1; distance <= 4; distance++) {
        config[`${mode}_penalty_${distance}`] *= repeats / 5;
      }
      config[`${mode}_randomness`] *= variation / 5;
      result = (mode === "artist" ? artist : album).shuffle(tracks, config, common);
      break;
    }
    case "balanced": {
      const config = defaults;
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
  return result;
}
