// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
function shuffle(
  trackList,
  shuffleConfig,
  common,
  artist,
  album
) {
  const debugData = {
    settings: {},
    decisions: []
  };

  const remaining =
    common.fisherYates(trackList);

  const result = [];
  const totalTracks =
    trackList.length;

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

    artist_weight:
      common.getConfigNumber(
        shuffleConfig,
        "balanced_artist_weight",
        1
      ),

    album_weight:
      common.getConfigNumber(
        shuffleConfig,
        "balanced_album_weight",
        0.8
      ),

    selection_window:
      common.getConfigNumber(
        shuffleConfig,
        "balanced_selection_window",
        7
      ),

    randomness:
      common.getConfigNumber(
        shuffleConfig,
        "balanced_randomness",
        3
      ),

    debug:
      common.getConfigBoolean(
        shuffleConfig,
        "debug_enabled",
        false
      ),

    debug_limit:
      common.getConfigNumber(
        shuffleConfig,
        "debug_limit",
        20
      )
  };

  if (settings.debug) {
    debugData.settings = {
      artist_penalties:
        settings.artist_penalties,

      album_penalties:
        settings.album_penalties,

      artist_weight:
        settings.artist_weight,

      album_weight:
        settings.album_weight,

      selection_window:
        settings.selection_window,

      randomness:
        settings.randomness
    };
  }

  const totalByArtist = {};

  for (const track of trackList) {
    const artists =
      artist.normalizeArtists(track);

    for (const artistId of artists) {
      totalByArtist[artistId] =
        (totalByArtist[artistId] || 0) + 1;
    }
  }

  const totalByAlbum = {};

  for (const track of trackList) {
    const albumId =
      album.normalizeAlbum(track);

    totalByAlbum[albumId] =
      (totalByAlbum[albumId] || 0) + 1;
  }

  const usedByArtist = {};
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
            return !album.tracksShareAlbum(
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
            album.normalizeAlbum(candidate);

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

          return album.isAlbumContinuationFeasible(
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

          const artistDistanceScore =
            artist.scoreArtistDistance(
              track,
              result,
              settings
            );

          const artistDistributionScore =
            artist.calculateArtistDistributionScore(
              track,
              nextPosition,
              totalTracks,
              totalByArtist,
              usedByArtist,
              settings
            );

          const albumDistanceScore =
            album.scoreAlbumDistance(
              track,
              result,
              settings
            );

          const albumDistributionScore =
            album.calculateAlbumDistributionScore(
              track,
              nextPosition,
              totalTracks,
              totalByAlbum,
              usedByAlbum,
              settings
            );

          const artistScore =
            (
              artistDistanceScore +
              artistDistributionScore
            ) *
            settings.artist_weight;

          const albumScore =
            (
              albumDistanceScore +
              albumDistributionScore
            ) *
            settings.album_weight;

          const randomScore =
            Math.random() *
            settings.randomness;

          const totalScore =
            artistScore +
            albumScore +
            randomScore;

          return {
            index: index,
            track: track,
            score: totalScore,

            debugScores: {
              artist_distance:
                artistDistanceScore,

              artist_distribution:
                artistDistributionScore,

              album_distance:
                albumDistanceScore,

              album_distribution:
                albumDistributionScore,

              artist_weighted:
                artistScore,

              album_weighted:
                albumScore,

              random:
                randomScore,

              total:
                totalScore
            }
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

    if (
      settings.debug &&
      debugData.decisions.length <
        settings.debug_limit
    ) {
      debugData.decisions.push({
        position: nextPosition,

        chosen: {
          name:
            chosen.track.name || "",

          uri:
            chosen.track.uri,

          artists:
            artist.normalizeArtists(
              chosen.track
            ),

          album:
            album.normalizeAlbum(
              chosen.track
            )
        },

        scores:
          chosen.debugScores,

        candidate_count:
          scoredCandidates.length,

        eligible_candidate_count:
          eligibleCandidates.length,

        best_score:
          bestScore
      });
    }

    const chosenArtists =
      artist.normalizeArtists(
        chosen.track
      );

    for (
      const artistId of chosenArtists
    ) {
      usedByArtist[artistId] =
        (usedByArtist[artistId] || 0) + 1;
    }

    const chosenAlbum =
      album.normalizeAlbum(
        chosen.track
      );

    usedByAlbum[chosenAlbum] =
      (usedByAlbum[chosenAlbum] || 0) + 1;

    remaining.splice(
      chosen.index,
      1
    );
  }

  return {
    tracks: result,
    debug: settings.debug
      ? debugData
      : null
  };
}

module.exports = {
  shuffle
};
