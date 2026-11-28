import { LocalizedError } from "../i18n.mjs?v=5";

function validateTracks(trackList) {
  if (!Array.isArray(trackList)) {
    throw new LocalizedError("trackListExpected");
  }

  if (trackList.length === 0) {
    throw new LocalizedError("trackListEmpty");
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
      throw new LocalizedError("trackInvalid", index + 1);
    }

    if (
      typeof track.uri !== "string" ||
      !track.uri.startsWith("spotify:track:")
    ) {
      throw new LocalizedError("trackUriInvalid", index + 1);
    }

    if (!Array.isArray(track.artists)) {
      throw new LocalizedError("trackArtistsInvalid", index + 1);
    }

    if (
      !track.album ||
      typeof track.album !== "object" ||
      Array.isArray(track.album)
    ) {
      throw new LocalizedError("trackAlbumInvalid", index + 1);
    }
  }
}


function validateShuffledTracks(
  originalTracks,
  shuffledTracks,
  mode
) {
  if (!Array.isArray(shuffledTracks)) {
    throw new LocalizedError("shuffledListInvalid", mode);
  }

  if (
    shuffledTracks.length !==
    originalTracks.length
  ) {
    throw new LocalizedError("shuffledCountChanged");
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
      throw new LocalizedError("shuffledTracksChanged");
    }
  }
}

export { validateTracks, validateShuffledTracks };
