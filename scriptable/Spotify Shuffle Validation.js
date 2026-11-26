// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
function validateTracks(trackList) {
  if (!Array.isArray(trackList)) {
    throw new Error(
      "Der Schlüssel tracks muss eine Liste enthalten."
    );
  }

  if (trackList.length === 0) {
    throw new Error(
      "Die übergebene Trackliste ist leer."
    );
  }

  for (
    let index = 0;
    index < trackList.length;
    index++
  ) {
    const track = trackList[index];

    if (
      !track ||
      typeof track !== "object" ||
      Array.isArray(track)
    ) {
      throw new Error(
        `Track ${index + 1} ist kein gültiges Wörterbuch.`
      );
    }

    if (
      typeof track.uri !== "string" ||
      !track.uri.startsWith("spotify:track:")
    ) {
      throw new Error(
        `Track ${index + 1} besitzt keine gültige Spotify-URI.`
      );
    }

    if (!Array.isArray(track.artists)) {
      throw new Error(
        `Track ${index + 1} besitzt keine gültige Künstlerliste.`
      );
    }

    if (
      !track.album ||
      typeof track.album !== "object" ||
      Array.isArray(track.album)
    ) {
      throw new Error(
        `Track ${index + 1} besitzt kein gültiges Album-Wörterbuch.`
      );
    }
  }
}


function validateShuffledTracks(
  originalTracks,
  shuffledTracks,
  mode
) {
  if (!Array.isArray(shuffledTracks)) {
    throw new Error(
      `Shuffle-Modus "${mode}" hat keine gültige Trackliste zurückgegeben.`
    );
  }

  if (
    shuffledTracks.length !==
    originalTracks.length
  ) {
    throw new Error(
      "Die Anzahl der Titel hat sich beim Mischen verändert."
    );
  }

  const originalUris =
    originalTracks
      .map(function (track) {
        return track.uri;
      })
      .sort();

  const shuffledUris =
    shuffledTracks
      .map(function (track) {
        return track.uri;
      })
      .sort();

  for (
    let index = 0;
    index < originalUris.length;
    index++
  ) {
    if (
      originalUris[index] !==
      shuffledUris[index]
    ) {
      throw new Error(
        "Die gemischte Trackliste enthält fehlende, zusätzliche oder veränderte Titel."
      );
    }
  }
}


function validateEngineOutput(output) {
  if (
    !output ||
    typeof output !== "object" ||
    Array.isArray(output)
  ) {
    throw new Error(
      "Engine Contract verletzt: Output ist kein Wörterbuch."
    );
  }

  if (
    typeof output.engine_version !== "number" ||
    !Number.isInteger(output.engine_version)
  ) {
    throw new Error(
      "Engine Contract verletzt: engine_version fehlt oder ist ungültig."
    );
  }

  if (
    typeof output.mode !== "string" ||
    output.mode.length === 0
  ) {
    throw new Error(
      "Engine Contract verletzt: mode fehlt oder ist ungültig."
    );
  }

  if (
    typeof output.count !== "number" ||
    !Number.isInteger(output.count) ||
    output.count < 1
  ) {
    throw new Error(
      "Engine Contract verletzt: count fehlt oder ist ungültig."
    );
  }

  if (!Array.isArray(output.tracks)) {
    throw new Error(
      "Engine Contract verletzt: tracks ist keine Liste."
    );
  }

  if (
    output.tracks.length !==
    output.count
  ) {
    throw new Error(
      "Engine Contract verletzt: count entspricht nicht der Trackanzahl."
    );
  }

  if (
    typeof output.chunk_count !== "number" ||
    !Number.isInteger(output.chunk_count) ||
    output.chunk_count < 1
  ) {
    throw new Error(
      "Engine Contract verletzt: chunk_count ist ungültig."
    );
  }

  let chunkedCount = 0;

  for (
    let chunkNumber = 1;
    chunkNumber <= output.chunk_count;
    chunkNumber++
  ) {
    const chunkKey =
      `chunk_${chunkNumber}`;

    const chunk =
      output[chunkKey];

    if (!Array.isArray(chunk)) {
      throw new Error(
        `Engine Contract verletzt: ${chunkKey} fehlt oder ist keine Liste.`
      );
    }

    if (
      chunk.length === 0 ||
      chunk.length > 100
    ) {
      throw new Error(
        `Engine Contract verletzt: ${chunkKey} enthält ${chunk.length} Elemente.`
      );
    }

    for (const uri of chunk) {
      if (
        typeof uri !== "string" ||
        !uri.startsWith("spotify:track:")
      ) {
        throw new Error(
          `Engine Contract verletzt: ungültige URI in ${chunkKey}.`
        );
      }
    }

    chunkedCount += chunk.length;
  }

  if (chunkedCount !== output.count) {
    throw new Error(
      "Engine Contract verletzt: Chunk-Anzahl entspricht nicht count."
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      output,
      "debug"
    )
  ) {
    throw new Error(
      "Engine Contract verletzt: debug fehlt."
    );
  }

  if (
    output.debug !== null &&
    (
      typeof output.debug !== "object" ||
      Array.isArray(output.debug)
    )
  ) {
    throw new Error(
      "Engine Contract verletzt: debug muss null oder ein Wörterbuch sein."
    );
  }

  return true;
}


const shuffleModule = {
  validateTracks,
  validateShuffledTracks,
  validateEngineOutput
};

if (typeof module !== "undefined") {
  module.exports = shuffleModule;
} else {
  globalThis.spotifyShuffleValidation = shuffleModule;
}
