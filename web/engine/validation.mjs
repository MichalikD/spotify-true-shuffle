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

export { validateTracks, validateShuffledTracks };
