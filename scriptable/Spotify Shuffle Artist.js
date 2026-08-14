// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
function normalizeArtists(track) {
  if (!track || !Array.isArray(track.artists)) {
    return [];
  }

  const normalized = [];

  for (const artist of track.artists) {
    let name = "";

    if (typeof artist === "string") {
      name = artist;
    } else if (
      artist &&
      typeof artist === "object" &&
      typeof artist.name === "string"
    ) {
      name = artist.name;
    }

    name = name.toLowerCase();

    if (
      name.length > 0 &&
      !normalized.includes(name)
    ) {
      normalized.push(name);
    }
  }

  return normalized;
}

function tracksShareArtist(trackA, trackB) {
  const artistsA = normalizeArtists(trackA);
  const artistsB = normalizeArtists(trackB);

  for (const artist of artistsA) {
    if (artistsB.includes(artist)) {
      return true;
    }
  }

  return false;
}

function scoreArtistDistance(
  track,
  history,
  settings
) {
  let score = 0;

  for (
    let distance = 1;
    distance <= settings.artist_penalties.length;
    distance++
  ) {
    const previousTrack =
      history[history.length - distance];

    if (!previousTrack) {
      break;
    }

    if (
      tracksShareArtist(
        track,
        previousTrack
      )
    ) {
      score -=
        settings.artist_penalties[
          distance - 1
        ];
    }
  }

  return score;
}

function calculateArtistDistributionScore(
  track,
  nextPosition,
  totalTracks,
  totalByArtist,
  usedByArtist,
  settings
) {
  const artists = normalizeArtists(track);

  if (artists.length === 0) {
    return 0;
  }

  const artistScores = [];

  for (const artist of artists) {
    const totalArtistTracks =
      totalByArtist[artist] || 1;

    const usedArtistTracks =
      usedByArtist[artist] || 0;

    const idealNextPosition =
      (
        (usedArtistTracks + 1) *
        (totalTracks + 1)
      ) /
      (totalArtistTracks + 1);

    const positionDelta =
      nextPosition - idealNextPosition;

    const limitedDelta = Math.max(
      -settings.schedule_clamp,
      Math.min(
        settings.schedule_clamp,
        positionDelta
      )
    );

    const effectiveWeight =
      positionDelta > 0
        ? settings.overdue_weight
        : settings.early_weight;

    artistScores.push(
      limitedDelta * effectiveWeight
    );
  }

  return Math.max.apply(
    null,
    artistScores
  );
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
    artist_penalties: [
      common.getConfigNumber(
        shuffleConfig,
        "artist_penalty_1",
        100
      ),
      common.getConfigNumber(
        shuffleConfig,
        "artist_penalty_2",
        60
      ),
      common.getConfigNumber(
        shuffleConfig,
        "artist_penalty_3",
        30
      ),
      common.getConfigNumber(
        shuffleConfig,
        "artist_penalty_4",
        15
      )
    ],

    early_weight:
      common.getConfigNumber(
        shuffleConfig,
        "artist_early_weight",
        18
      ),

    overdue_weight:
      common.getConfigNumber(
        shuffleConfig,
        "artist_overdue_weight",
        36
      ),

    schedule_clamp:
      common.getConfigNumber(
        shuffleConfig,
        "artist_schedule_clamp",
        2.5
      ),

    selection_window:
      common.getConfigNumber(
        shuffleConfig,
        "artist_selection_window",
        5
      ),

    randomness:
      common.getConfigNumber(
        shuffleConfig,
        "artist_randomness",
        3
      )
  };

  const totalByArtist = {};

  for (const track of trackList) {
    const artists = normalizeArtists(track);

    for (const artist of artists) {
      totalByArtist[artist] =
        (totalByArtist[artist] || 0) + 1;
    }
  }

  const usedByArtist = {};

  while (remaining.length > 0) {
    const nextPosition =
      result.length + 1;

    const scoredCandidates =
      remaining.map(
        function (track, index) {
          const artistDistanceScore =
            scoreArtistDistance(
              track,
              result,
              settings
            );

          const artistDistributionScore =
            calculateArtistDistributionScore(
              track,
              nextPosition,
              totalTracks,
              totalByArtist,
              usedByArtist,
              settings
            );

          const randomScore =
            Math.random() *
            settings.randomness;

          return {
            index: index,
            track: track,
            score:
              artistDistanceScore +
              artistDistributionScore +
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

    const chosenArtists =
      normalizeArtists(chosen.track);

    for (const artist of chosenArtists) {
      usedByArtist[artist] =
        (usedByArtist[artist] || 0) + 1;
    }

    remaining.splice(
      chosen.index,
      1
    );
  }

  return result;
}

module.exports = {
  normalizeArtists,
  tracksShareArtist,
  scoreArtistDistance,
  calculateArtistDistributionScore,
  shuffle
};
