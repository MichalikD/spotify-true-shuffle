# Shuffle engine

`web/engine.mjs` takes normalized tracks and returns the shuffled Spotify URIs. Each track includes a `uri`, a `name`, a list of `artists`, and an `album` with a name and URI. Validation checks that the result contains every original occurrence, including duplicates.

The shuffle templates provide starting values for shared artist spacing, album spacing, and randomness settings. The same settings produce the same shuffle behavior regardless of the selected template.

When either spacing slider is enabled, the engine scores candidates using recent repeats and the overall distribution for that dimension. Each slider scales its dimension's contribution independently. Randomness widens the group of eligible candidates and adds variation to their scores. Spacing is a preference and the mix of tracks determines which gaps are possible.

With both spacing sliders at zero, the engine uses Fisher–Yates. Intermediate randomness values apply it to consecutive sections of the source playlist. Zero preserves the source order and ten shuffles the entire list.

Start links created with the shared controls store all three values. Older saved links and legacy `mode=custom` URLs can still invoke their original scoring and selection rules. The tuning constants are in `web/engine/defaults.json`.

`web/playlists.mjs` reads playlists a page at a time and writes the result to the playback playlist in batches. The app starts playback once every batch has been written successfully.
