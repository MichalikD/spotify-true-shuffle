# Configuration

> Audience: Developers / Advanced Users

Spotify True Shuffle uses a centralized configuration system.

User-configurable application settings are stored outside the Shortcuts and Scriptable implementation.

This allows shuffle behavior and Spotify-specific settings to be changed without modifying distributed project components.

Configuration access is handled through dedicated Apple Shortcuts:

```text
Spotify Load Config
Spotify Save Config
Spotify Load Playlists
Spotify Save Playlists
```

Runtime components should use these access layers instead of implementing their own configuration file handling.

---

# Configuration Files

Persistent application data is stored in:

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Data/
        ├── config.json
        ├── playlists.json
        └── tokens.json
```

Temporary PKCE authentication data may additionally be stored in:

```text
verifier.txt
```

The files have separate responsibilities:

| File | Purpose |
|---|---|
| `config.json` | Application and shuffle-engine configuration |
| `playlists.json` | User-defined source playlist library |
| `tokens.json` | Spotify authentication state |
| `verifier.txt` | Temporary PKCE authentication data |

Keeping these responsibilities separate allows each data format to evolve independently.

---

# Configuration Template

The repository contains:

```text
config/config.example.json
```

This file defines the default configuration for new installations.

The installer downloads the template only when a local:

```text
config.json
```

does not already exist.

Existing user configuration is preserved.

The template is therefore both:

- the source of default configuration values
- the baseline configuration schema for new installations

Installation-specific values remain empty in the repository.

These currently include:

```json
{
  "spotify_client_id": "",
  "spotify_redirect_uri": "",
  "cache_playlist_id": ""
}
```

They are configured by the user after installation.

---

# Current Configuration

The current configuration schema is version:

```text
2
```

A new installation currently starts with the following configuration:

```json
{
  "artist_penalty_3": 30,
  "artist_randomness": 3,
  "artist_penalty_1": 100,
  "album_penalty_3": 30,
  "spotify_redirect_uri": "",
  "config_version": 2,
  "artist_overdue_weight": 36,
  "balanced_randomness": 3,
  "balanced_album_weight": 0.8,
  "album_penalty_4": 15,
  "album_randomness": 3,
  "debug_limit": 20,
  "artist_early_weight": 18,
  "cache_playlist_id": "",
  "shuffle_mode": "balanced",
  "artist_penalty_4": 15,
  "artist_penalty_2": 60,
  "balanced_artist_weight": 1,
  "balanced_selection_window": 7,
  "album_penalty_1": 100,
  "album_early_weight": 18,
  "debug_enabled": false,
  "artist_selection_window": 5,
  "album_selection_window": 5,
  "album_overdue_weight": 36,
  "artist_schedule_clamp": 2.5,
  "album_penalty_2": 60,
  "album_schedule_clamp": 2.5,
  "spotify_client_id": ""
}
```

The order of keys is not significant.

---

# Core Configuration

## config_version

Type:

```text
Number
```

Current value:

```text
2
```

Identifies the configuration schema used by the installation.

This value allows future versions of Spotify True Shuffle to distinguish between configuration formats and eventually perform migrations when required.

Changing the project version does not automatically require changing `config_version`.

The configuration version should only change when the configuration schema itself becomes incompatible or requires migration.

---

## spotify_client_id

Type:

```text
String
```

Contains the Client ID of the user's Spotify Developer application.

Example:

```json
{
  "spotify_client_id": "..."
}
```

The Client Secret is not stored in Spotify True Shuffle.

Authentication uses Authorization Code with PKCE.

---

## spotify_redirect_uri

Type:

```text
String
```

Contains the HTTPS callback URI used during Spotify authentication.

For the standard project installation this points to the Spotify True Shuffle GitHub Pages authentication endpoint.

The configured value must exactly match the Redirect URI registered in the user's Spotify Developer application.

---

## cache_playlist_id

Type:

```text
String
```

Contains the Spotify playlist ID used as the True Shuffle playback cache.

The generated track order is written to this playlist before playback starts.

The source playlist itself is never modified.

The cache playlist should therefore be dedicated to Spotify True Shuffle and should not be used as a normal user-managed playlist.

---

# Shuffle Mode

## shuffle_mode

Type:

```text
String
```

Selects the shuffle algorithm used by the Scriptable engine.

Current modes are:

```text
random
artist
album
balanced
```

Default:

```text
balanced
```

Changing the mode does not require changing the surrounding playlist loading or writing workflow.

Each algorithm operates on the same normalized track input and returns the same general engine output contract.

Detailed algorithm behavior is documented in:

```text
docs/07_Shuffle_Engine.md
```

---

# Artist Mode Configuration

Artist mode uses several configuration values to control artist spacing and selection behavior.

Current parameters are:

```text
artist_penalty_1
artist_penalty_2
artist_penalty_3
artist_penalty_4

artist_early_weight
artist_overdue_weight

artist_randomness
artist_selection_window
artist_schedule_clamp
```

These values belong to the artist scheduling/scoring system.

---

## artist_penalty_1 ... artist_penalty_4

Current defaults:

```text
artist_penalty_1 = 100
artist_penalty_2 = 60
artist_penalty_3 = 30
artist_penalty_4 = 15
```

These values define progressively smaller penalties associated with recent artist repetition.

Higher penalties make recently used artists less attractive during candidate selection.

The numbered values allow the engine to apply different penalties depending on how recently an artist appeared.

---

## artist_early_weight

Default:

```text
18
```

Controls the weighting applied when an artist would appear earlier than its calculated scheduling target.

---

## artist_overdue_weight

Default:

```text
36
```

Controls the weighting applied when an artist is overdue relative to its scheduling target.

The early and overdue weights allow the scheduler to prefer candidates based on their expected distribution through the playlist.

---

## artist_randomness

Default:

```text
3
```

Introduces controlled randomness into artist-mode candidate selection.

This prevents repeated runs from becoming unnecessarily deterministic while still allowing the scheduling rules to influence the result.

---

## artist_selection_window

Default:

```text
5
```

Controls the number of high-ranking candidates considered during the final artist-mode selection step.

A selection window allows the engine to choose among several suitable candidates instead of always selecting the single highest-scoring candidate.

---

## artist_schedule_clamp

Default:

```text
2.5
```

Limits the influence of artist scheduling deviations.

The clamp prevents unusually early or overdue scheduling values from dominating candidate scoring without bound.

---

# Album Mode Configuration

Album mode uses a parallel configuration structure.

Current parameters are:

```text
album_penalty_1
album_penalty_2
album_penalty_3
album_penalty_4

album_early_weight
album_overdue_weight

album_randomness
album_selection_window
album_schedule_clamp
```

The concepts are equivalent to the artist-mode parameters but operate on album distribution.

---

## album_penalty_1 ... album_penalty_4

Current defaults:

```text
album_penalty_1 = 100
album_penalty_2 = 60
album_penalty_3 = 30
album_penalty_4 = 15
```

These values reduce the attractiveness of tracks from albums that appeared recently.

The penalty becomes progressively smaller as the previous occurrence moves further back in the generated order.

---

## album_early_weight

Default:

```text
18
```

Controls scoring when an album would appear earlier than its scheduling target.

---

## album_overdue_weight

Default:

```text
36
```

Controls scoring when an album is overdue relative to its expected distribution.

---

## album_randomness

Default:

```text
3
```

Introduces controlled randomness into album-mode candidate selection.

---

## album_selection_window

Default:

```text
5
```

Defines how many high-ranking album-mode candidates may participate in the final randomized selection.

---

## album_schedule_clamp

Default:

```text
2.5
```

Limits the maximum influence of album scheduling deviation on candidate scoring.

---

# Balanced Mode Configuration

Balanced mode combines artist and album considerations.

Current parameters are:

```text
balanced_artist_weight
balanced_album_weight
balanced_randomness
balanced_selection_window
```

---

## balanced_artist_weight

Default:

```text
1
```

Controls the relative influence of artist-based scoring in Balanced mode.

---

## balanced_album_weight

Default:

```text
0.8
```

Controls the relative influence of album-based scoring in Balanced mode.

With the default configuration, artist distribution has slightly more influence than album distribution.

---

## balanced_randomness

Default:

```text
3
```

Adds controlled randomness to Balanced-mode candidate selection.

---

## balanced_selection_window

Default:

```text
7
```

Controls the number of high-ranking candidates considered during final Balanced-mode selection.

The larger default window gives the combined scoring system additional room to vary otherwise similarly suitable candidates.

---

# Debug Configuration

## debug_enabled

Type:

```text
Boolean
```

Default:

```text
false
```

Controls whether the shuffle engine generates detailed debug information.

When debug output is disabled, normal runtime output remains smaller and easier for Apple Shortcuts to process.

Debug mode is intended primarily for development and troubleshooting.

---

## debug_limit

Type:

```text
Number
```

Default:

```text
20
```

Limits the amount of detailed debug information returned by the engine.

This is especially useful for large playlists where unrestricted diagnostic output could become unnecessarily large.

---

# playlists.json

Saved source playlists are intentionally stored separately from `config.json`.

The repository template is:

```json
{}
```

A populated local file may look like:

```json
{
  "Best Of": "https://open.spotify.com/playlist/...",
  "Chill": "https://open.spotify.com/playlist/...",
  "Rap": "https://open.spotify.com/playlist/..."
}
```

The key is the user-facing playlist name.

The value is the Spotify playlist URL.

Playlist management is handled through:

```text
Spotify Load Playlists
Spotify Save Playlists
Spotify Settings
```

Separating playlist data from application configuration allows the playlist library to evolve independently.

Future versions could, for example, add playlist metadata without requiring unrelated shuffle-engine configuration changes.

---

# tokens.json

Spotify authentication state is stored separately in:

```text
tokens.json
```

It is managed by:

```text
Spotify Login Callback
Spotify Refresh Token
Spotify API
```

The file contains authentication information such as:

- access token
- refresh token
- token expiration information

Users normally do not need to edit this file.

It must never be committed to the public repository.

---

# verifier.txt

The PKCE login process requires a temporary code verifier.

Spotify True Shuffle stores this locally during authentication as:

```text
verifier.txt
```

It is temporary authentication state rather than application configuration.

Users should not edit it manually.

---

# Configuration Access Layer

Runtime Shortcuts should not independently read or write configuration files.

Instead:

```text
config.json
    │
    ├── Spotify Load Config
    └── Spotify Save Config
```

and:

```text
playlists.json
    │
    ├── Spotify Load Playlists
    └── Spotify Save Playlists
```

This centralizes storage behavior and provides a stable boundary between application logic and persistent data.

Advantages include:

- consistent file locations
- centralized error handling
- easier future migrations
- fewer hardcoded storage operations
- simpler runtime Shortcuts

---

# Spotify Settings

The primary user interface for configuration is:

```text
Spotify Settings
```

Users should normally modify configuration through Settings rather than editing JSON files manually.

Settings currently provides access to installation and runtime options including:

- Spotify Client ID
- Redirect URI
- cache playlist
- shuffle mode
- debug options
- saved playlists

Advanced algorithm parameters may remain configuration-level values without necessarily being exposed directly in the standard Settings interface.

This keeps normal configuration understandable while preserving advanced tuning capabilities.

---

# Installation Behavior

During a fresh installation, the installer checks whether:

```text
config.json
playlists.json
```

already exist.

If a file is missing, its repository template is downloaded.

Conceptually:

```text
config.example.json
        │
        ▼
     Installer
        │
        ▼
    config.json
```

and:

```text
playlists.example.json
        │
        ▼
     Installer
        │
        ▼
   playlists.json
```

Existing local files are preserved.

The installer should not replace user configuration simply because a newer template exists.

---

# Templates vs User Configuration

This distinction is important:

```text
Repository
config.example.json
        │
        │ initial installation
        ▼
Local Device
config.json
```

After installation, the two files are independent.

Changing `config.example.json` in the repository does **not** automatically change existing user configurations.

If a future release requires new configuration values, the project must decide whether:

- the value can safely use a runtime default
- existing configurations can be extended automatically
- a configuration migration is required

The installer should not solve schema changes by replacing the user's complete configuration.

---

# Configuration Versioning

`config_version` exists to support future schema evolution.

A project release and a configuration version are separate concepts.

For example:

```text
Project 0.9.0
Config version 2
```

may later become:

```text
Project 0.9.1
Config version 2
```

if no configuration migration is necessary.

Only an incompatible or migration-relevant configuration change should require a new `config_version`.

---

# Adding a Configuration Value

When adding a new setting:

1. determine whether the value belongs in configuration or implementation
2. add an appropriate default to `config/config.example.json`
3. update runtime validation if required
4. update `Spotify Settings` if the value should be user-facing
5. update the Scriptable or Shortcut component that consumes it
6. update the relevant section of this document

Do not manually modify unrelated documentation simply because a new configuration key was introduced.

---

# Adding Configuration for a New Shuffle Mode

A new shuffle mode should use its own namespace-like key prefix.

For example:

```text
genre_...
history_...
energy_...
```

rather than generic names that could collide with existing algorithms.

Conceptually:

```json
{
  "shuffle_mode": "new_mode",
  "new_mode_weight": 1,
  "new_mode_randomness": 3,
  "new_mode_selection_window": 5
}
```

Only parameters actually required by the mode should be added.

New modes should not modify existing Artist, Album or Balanced settings unless their behavior genuinely changes.

---

# Configuration Ownership

Every configuration value should have a clear owner.

Examples:

```text
artist_*
→ Artist shuffle logic

album_*
→ Album shuffle logic

balanced_*
→ Balanced shuffle logic

spotify_*
→ Spotify integration

debug_*
→ diagnostics
```

This naming convention makes dependencies visible and helps prevent unrelated modules from becoming coupled through configuration.

---

# Security

Never commit real local versions of:

```text
config.json
playlists.json
tokens.json
verifier.txt
```

to the repository.

Repository templates must not contain:

- Spotify authentication tokens
- PKCE verifier values
- personal playlist collections
- installation-specific Client IDs
- other user-specific authentication data

The Spotify Client Secret is not used by Spotify True Shuffle and should never be added to configuration.

---

# Documentation Maintenance

Configuration documentation should follow the configuration schema rather than individual releases.

When a setting changes, update the section that owns that setting.

Examples:

```text
New Artist parameter
→ update Artist Mode Configuration

New shuffle mode
→ add one new mode section

Authentication configuration change
→ update Core Configuration

Schema migration
→ update Configuration Versioning
```

A normal configuration change should not require rewriting unrelated documentation files.

---

# Next Step

Continue with:

```text
docs/05_Shortcuts.md
```

for the Apple Shortcut components and their responsibilities.
