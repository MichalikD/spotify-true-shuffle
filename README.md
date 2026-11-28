# Spotify True Shuffle

Spotify True Shuffle creates a new order for a Spotify playlist and plays it through a separate playback playlist. The web app runs in your browser on GitHub Pages and supports English and German.

**[Open the web app](https://michalikd.github.io/spotify-true-shuffle/web/)** · [Setup and iOS Shortcuts](docs/setup.md)

| Mode | Behavior |
| --- | --- |
| Random | Uses the Fisher–Yates shuffle. |
| Artist | Spreads tracks by the same artist across the playlist. |
| Album | Spreads tracks from the same album across the playlist. |
| Balanced | Uses both artist and album spacing. |

The four templates set starting values for the same three controls. Adjust artist spacing, album spacing, and randomness independently. The app keeps saved start links and their settings in your browser. On iPhone, a shortcut can use **Open URLs** to launch a saved preset with its playlist and shuffle settings. Starting playback requires Spotify Premium. Shuffle playlists you own or collaborate on, or [copy another user’s playlist in Spotify](docs/setup.md#playlists-from-other-users) and shuffle the copy.

## Development

`web/` contains the app, Spotify integration, and [shuffle engine](docs/engine.md). From the repository root, run `python3 -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/web/`. To sign in to Spotify in this local setup, add that exact callback URL to your Spotify developer app.

The older Scriptable workflow, iOS installer, and optional Node.js service are available on the [archive branch](https://github.com/MichalikD/spotify-true-shuffle/tree/archive/pre-web-cleanup).
