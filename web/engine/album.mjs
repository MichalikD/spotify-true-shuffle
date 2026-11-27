function normalizeAlbum(track) {
  if (
    track &&
    track.album &&
    typeof track.album === "object" &&
    typeof track.album.uri === "string" &&
    track.album.uri.startsWith("spotify:album:")
  ) {
    return track.album.uri.toLowerCase();
  }

  return `__single__:${track.uri}`;
}


function tracksShareAlbum(trackA, trackB) {
  return (
    normalizeAlbum(trackA) ===
    normalizeAlbum(trackB)
  );
}


function scoreAlbumDistance(
  track,
  history,
  settings
) {
  let score = 0;

  for (
    let distance = 1;
    distance <= settings.album_penalties.length;
    distance++
  ) {
    const previousTrack =
      history[history.length - distance];

    if (!previousTrack) {
      break;
    }

    if (
      tracksShareAlbum(
        track,
        previousTrack
      )
    ) {
      score -=
        settings.album_penalties[
          distance - 1
        ];
    }
  }

  return score;
}


function calculateAlbumDistributionScore(
  track,
  nextPosition,
  totalTracks,
  totalByAlbum,
  usedByAlbum,
  settings
) {
  const album = normalizeAlbum(track);

  const totalAlbumTracks =
    totalByAlbum[album] || 1;

  const usedAlbumTracks =
    usedByAlbum[album] || 0;

  const idealNextPosition =
    (
      (usedAlbumTracks + 1) *
      (totalTracks + 1)
    ) /
    (totalAlbumTracks + 1);

  const positionDelta =
    nextPosition - idealNextPosition;

  const limitedDelta = Math.max(
    -settings.album_schedule_clamp,
    Math.min(
      settings.album_schedule_clamp,
      positionDelta
    )
  );

  const effectiveWeight =
    positionDelta > 0
      ? settings.album_overdue_weight
      : settings.album_early_weight;

  return limitedDelta * effectiveWeight;
}


function isAlbumContinuationFeasible(
  remainingTracks,
  previousAlbum
) {
  if (remainingTracks.length === 0) {
    return true;
  }

  const counts = {};

  for (const track of remainingTracks) {
    const album = normalizeAlbum(track);

    counts[album] =
      (counts[album] || 0) + 1;
  }

  const totalRemaining =
    remainingTracks.length;

  for (const album in counts) {
    const albumCount =
      counts[album];

    const otherCount =
      totalRemaining - albumCount;

    if (album === previousAlbum) {
      if (albumCount > otherCount) {
        return false;
      }
    } else {
      if (albumCount > otherCount + 1) {
        return false;
      }
    }
  }

  return true;
}


function shuffle(
  trackList,
  shuffleConfig,
  common
) {
  const remaining =
    common.fisherYates(trackList);

  const result = [];
  const totalTracks = trackList.length;

  const settings = {
    album_penalties: [
      common.getConfigNumber(
        shuffleConfig,
        "album_penalty_1",
        100
      ),
      common.getConfigNumber(
        shuffleConfig,
        "album_penalty_2",
        60
      ),
      common.getConfigNumber(
        shuffleConfig,
        "album_penalty_3",
        30
      ),
      common.getConfigNumber(
        shuffleConfig,
        "album_penalty_4",
        15
      )
    ],

    album_early_weight:
      common.getConfigNumber(
        shuffleConfig,
        "album_early_weight",
        18
      ),

    album_overdue_weight:
      common.getConfigNumber(
        shuffleConfig,
        "album_overdue_weight",
        36
      ),

    album_schedule_clamp:
      common.getConfigNumber(
        shuffleConfig,
        "album_schedule_clamp",
        2.5
      ),

    selection_window:
      common.getConfigNumber(
        shuffleConfig,
        "album_selection_window",
        5
      ),

    randomness:
      common.getConfigNumber(
        shuffleConfig,
        "album_randomness",
        3
      )
  };

  const totalByAlbum = {};

  for (const track of trackList) {
    const album = normalizeAlbum(track);

    totalByAlbum[album] =
      (totalByAlbum[album] || 0) + 1;
  }

  const usedByAlbum = {};

  while (remaining.length > 0) {
    const nextPosition =
      result.length + 1;

    let candidateIndexes =
      remaining.map(
        function (_, index) {
          return index;
        }
      );

    if (result.length > 0) {
      const previousTrack =
        result[result.length - 1];

      const differentAlbumIndexes =
        candidateIndexes.filter(
          function (index) {
            return !tracksShareAlbum(
              remaining[index],
              previousTrack
            );
          }
        );

      if (
        differentAlbumIndexes.length > 0
      ) {
        candidateIndexes =
          differentAlbumIndexes;
      }
    }

    const feasibleCandidateIndexes =
      candidateIndexes.filter(
        function (index) {
          const candidate =
            remaining[index];

          const candidateAlbum =
            normalizeAlbum(candidate);

          const remainingAfterChoice =
            remaining.filter(
              function (
                _,
                remainingIndex
              ) {
                return (
                  remainingIndex !== index
                );
              }
            );

          return isAlbumContinuationFeasible(
            remainingAfterChoice,
            candidateAlbum
          );
        }
      );

    if (
      feasibleCandidateIndexes.length > 0
    ) {
      candidateIndexes =
        feasibleCandidateIndexes;
    }

    const scoredCandidates =
      candidateIndexes.map(
        function (index) {
          const track =
            remaining[index];

          const albumDistanceScore =
            scoreAlbumDistance(
              track,
              result,
              settings
            );

          const albumDistributionScore =
            calculateAlbumDistributionScore(
              track,
              nextPosition,
              totalTracks,
              totalByAlbum,
              usedByAlbum,
              settings
            );

          const randomScore =
            Math.random() *
            settings.randomness;

          return {
            index: index,
            track: track,
            score:
              albumDistanceScore +
              albumDistributionScore +
              randomScore
          };
        }
      );

    const scores =
      scoredCandidates.map(
        function (candidate) {
          return candidate.score;
        }
      );

    const bestScore =
      Math.max.apply(
        null,
        scores
      );

    const eligibleCandidates =
      scoredCandidates.filter(
        function (candidate) {
          return (
            candidate.score >=
            bestScore -
              settings.selection_window
          );
        }
      );

    const chosen =
      eligibleCandidates[
        Math.floor(
          Math.random() *
          eligibleCandidates.length
        )
      ];

    result.push(chosen.track);

    const chosenAlbum =
      normalizeAlbum(chosen.track);

    usedByAlbum[chosenAlbum] =
      (usedByAlbum[chosenAlbum] || 0) + 1;

    remaining.splice(
      chosen.index,
      1
    );
  }

  return result;
}


export {
  normalizeAlbum,
  tracksShareAlbum,
  scoreAlbumDistance,
  calculateAlbumDistributionScore,
  isAlbumContinuationFeasible,
  shuffle
};
