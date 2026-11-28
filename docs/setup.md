# Set up Spotify True Shuffle

## Connect Spotify

1. Open the [web app](https://michalikd.github.io/spotify-true-shuffle/web/). If you use a fork, publish the root of your chosen branch with GitHub Pages and open `/web/`.
2. Open your app in the Spotify Developer Dashboard. Add the callback URL displayed in the web app, including the trailing slash.
3. Enter your Spotify Client ID and select **Connect Spotify**. Playback requires Spotify Premium. For an app in Development Mode, your Spotify account must be on the app's allowlist.
4. Open Spotify on the device you want to play on. Enter the link to a Spotify playlist you own or collaborate on, then select **Shuffle and play**.

The app chooses German if German is your browser language and English otherwise. Use **Language / Sprache** to change it. Your choice is saved in the browser.

On the first shuffle the app creates a private playlist called **True Shuffle – Web**. To use an existing playlist you own, open **Set playback playlist** and save its link. The app replaces its contents when you shuffle. Use a different playlist as the source. If you connected before the app requested permission to update public playlists, reconnect before choosing a public playback playlist.

If Spotify cannot start playback on any device, open the prepared playlist from the link in the web app and start playback in Spotify.

The app stores the Client ID, tokens, last source, and playback playlist ID in the browser. It refreshes the access token when needed. If Spotify rejects the refresh token, reconnect. **Disconnect Spotify** clears the locally saved tokens.

## Playlists from other users

You can use a playlist link directly if you collaborate on that playlist. For other playlists, open the playlist in Spotify and choose **… → Add to other playlist**.

- **For repeated use**, copy the tracks into an empty playlist you own. Paste the copy’s link into **Source playlist** in True Shuffle. You can save a start link for the copy or share its link with your iOS shortcut. Refresh the copy in Spotify if the original changes.
- **For a one-off shuffle**, copy the tracks into the playback playlist configured in True Shuffle. Open **Playlists from other users**, select **Shuffle playback playlist in place**, and confirm the playlist name. Any tracks already in the playback playlist are included. This action must be started manually in the app.

Shuffling in place rewrites the track entries in the same Spotify playlist. The app stops before writing if it encounters an unsupported or unavailable item. If a later write batch fails, the playback playlist may contain only part of the shuffle. For an in-place shuffle, restore the full copy before trying again.

## Shuffle templates

All templates use the same three sliders from 0 to 10. Open **Customize template** to change their starting values.

| Template | Artist spacing | Album spacing | Randomness |
| --- | ---: | ---: | ---: |
| Random | 0 | 0 | 10 |
| Artist | 10 | 0 | 5 |
| Album | 0 | 10 | 5 |
| Balanced | 5 | 4 | 5 |

Higher spacing values favor more distance between tracks by the same artist or from the same album. With both spacing sliders at zero, randomness at 0 keeps the source order, intermediate values shuffle sections, and 10 shuffles the whole playlist.

**Reset to defaults** and choosing a different template load that template's starting values. New start links save all three values with the playlist. Existing saved links still use their original settings. Their sliders show an estimate, which you can edit or save under the same name to switch the link to the shared settings.

## Optional iOS shortcut

Open the app from a bookmark, a Home Screen icon or the **Open URLs** shortcut action. The URL can stay the same when the app is updated.

- `?playlist=PLAYLIST_ID&mode=balanced` preselects a source and template. Supported mode IDs are `random`, `artist`, `album`, and `balanced`. Existing `mode=custom` links still work as an alias for adjusted Balanced. Without a mode in the URL, the app uses the last template.
- `?playlist=PLAYLIST_ID&autostart=1` starts a one-off shuffle with the last mode, or Balanced on first use. Add `&mode=balanced` to always use Balanced. A full playlist link also works as the `playlist` value. URL-encode it in the shortcut so Spotify's query parameters remain part of the playlist link.
- `?preset=car` opens a saved preset. Add `&mode=artist` to use the Artist template defaults for that run. An explicit mode uses its defaults, except for the legacy `mode=custom` alias. The preset still supplies the playlist and its auto-start setting.

To make a preset, choose a playlist and mode, open **Start links**, enter a name, and save. Copy the displayed URL into **Open URLs**. Preset names can contain up to 32 ASCII letters, digits, or hyphens and must begin with a letter or digit. Save under the same name to change the settings while keeping the URL. **Delete** removes the link from the browser and leaves the Spotify playlists alone.

Enable automatic playback on a preset to shuffle on open. If Spotify requires sign-in, the app keeps your selection and waits for you to confirm once you return.

Start links and settings belong to the browser profile where you saved them. An app update at the same address or clearing only the file cache leaves them in place. If you clear website data or switch browser profiles, set them up again in that profile.

Use **Open URLs** rather than **Get Contents of URL**, which fetches the page without running its JavaScript. If your shortcut switches away from Safari on a timer, the timer cannot tell whether the shuffle is finished.
