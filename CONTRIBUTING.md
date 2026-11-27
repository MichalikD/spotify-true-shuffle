# Contributing

Keep changes focused. `web/app.mjs` handles the UI and preset flow, `web/spotify.mjs` handles OAuth and Spotify requests, and `web/playlists.mjs` handles playlist reads and writes. Shuffle algorithms are in `web/engine/`.

For changes to the shuffle flow, test all affected modes with repeated tracks and more than one page of playlist items. Check that a failed playlist write does not start playback. Keep `/web/`, the OAuth callback, saved browser data and preset links compatible when changing public interfaces.

Use the [setup instructions](docs/setup.md) to test the app. Keep Spotify credentials and personal settings out of commits.
