# Shuffle engine

`web/engine.mjs` takes normalized tracks and returns the shuffled Spotify URIs. Each track includes a `uri`, a `name`, a list of `artists`, and an `album` with a name and URI. Validation checks that the result contains every original occurrence, including duplicates.

- **Random** uses Fisher–Yates.
- **Artist** scores candidates based on the distance and overall distribution of repeated artists.
- **Album** applies a similar approach to albums.
- **Balanced** considers both artist and album distribution using the default weights.

All modes use randomness. Artist, Album, and Balanced try to spread repeats, but playlists dominated by a few artists or albums can still contain adjacent repeats. The defaults are in `web/engine/defaults.json`. The optional Balanced settings shift emphasis between artists and albums while keeping the total weight fixed. The variation slider scales the random component of candidate scoring. The midpoint of both sliders matches the Balanced defaults.

`web/playlists.mjs` reads playlists a page at a time and writes the result to the playback playlist in batches. The app starts playback once every batch has been written successfully.
