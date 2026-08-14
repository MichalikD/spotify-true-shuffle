# Architecture

> **Audience:** Developers / Advanced Users

Spotify True Shuffle is built as a modular system around Apple Shortcuts, Scriptable and the Spotify Web API.

The project separates runtime logic from installation and distribution infrastructure.

The main architectural areas are:

* Apple Shortcuts
* Scriptable
* Spotify Web API
* Configuration and local data
* Installation and distribution

The central design goal is to keep individual runtime components small and focused while allowing the project to be installed and maintained as one application-like system.

---

## High-Level Architecture

```text
                         User
                          │
                          ▼
                  Spotify True Shuffle
                          │
                          ▼
                 Spotify Playlist Loader
                          │
                          ▼
              Spotify Flatten Track Lists
                     (Scriptable)
                          │
                          ▼
                Spotify Shuffle Engine
                     (Shortcut)
                          │
                          ▼
                Shuffle Engine v5
                     (Scriptable)
                          │
                          ▼
                Spotify Playlist Writer
                          │
                          ▼
                      Spotify API
                          │
                          ▼
                        Spotify
```

The runtime flow deliberately separates Spotify communication from shuffle logic.

Apple Shortcuts handle Spotify and user interaction.

Scriptable handles track processing and shuffle algorithms.

---

## Runtime Layers

### Apple Shortcuts Layer

Apple Shortcuts provides the orchestration and application layer.

Responsibilities include:

* User interaction
* Configuration
* Authentication
* Spotify Web API communication
* Playlist loading
* Playlist writing
* Playback control
* Error propagation
* Calling Scriptable modules

The Shortcuts layer intentionally contains as little shuffle logic as possible.

Complex algorithmic behavior belongs in Scriptable.

### Scriptable Layer

Scriptable contains the shuffle engine and supporting JavaScript modules.

Responsibilities include:

* Track normalization
* Shuffle algorithms
* Validation
* Shared algorithm utilities
* Output generation
* Debug information

The Scriptable runtime does not communicate directly with Spotify.

It receives structured input from Apple Shortcuts and returns structured output.

This separation allows shuffle algorithms to evolve independently from Spotify API handling.

### Spotify Web API Layer

Spotify is accessed through the central `Spotify API` Shortcut.

Other project Shortcuts should not implement their own authentication or Spotify HTTP handling.

The API layer is responsible for:

* Authenticated Spotify requests
* Access token handling
* Token refresh
* HTTP methods
* Request bodies
* Spotify API responses
* API error propagation

API results are validated through `Spotify API Result Check`.

This provides a common error contract for calling Shortcuts.

---

## Runtime Data Flow

### Step 1 — Start

The user runs:

`Spotify True Shuffle`

The Shortcut loads:

* Configuration
* Saved playlists

The user selects the playlist to shuffle.

### Step 2 — Playlist Loading

The selected playlist is passed to:

`Spotify Playlist Loader`

The loader:

* Extracts the Spotify playlist ID
* Requests playlist items
* Handles pagination
* Validates API responses
* Collects all playlist pages

The loader does not perform shuffle logic.

### Step 3 — Track Normalization

The collected Spotify playlist responses are passed to:

`Spotify Flatten Track Lists.js`

This Scriptable module converts Spotify API structures into the internal track format.

Example:

```json
{
  "uri": "spotify:track:...",
  "name": "Track Name",
  "artists": [
    "Artist"
  ],
  "album": {
    "name": "Album",
    "uri": "spotify:album:..."
  }
}
```

The shuffle engine therefore does not need to understand raw Spotify playlist responses.

### Step 4 — Shuffle Engine Shortcut

The normalized tracks and configuration are passed to:

`Spotify Shuffle Engine`

This Shortcut acts as the bridge between Apple Shortcuts and Scriptable.

Its purpose is orchestration, not algorithm implementation.

### Step 5 — Scriptable Engine

The engine executes the configured shuffle mode.

Current modes include:

* Random
* Artist
* Album
* Balanced

The engine is modularized into multiple JavaScript files.

Core modules include:

* `Spotify Shuffle Engine v5.js`
* `Spotify Shuffle Common.js`
* `Spotify Shuffle Validation.js`
* `Spotify Shuffle Output.js`
* `Spotify Shuffle Artist.js`
* `Spotify Shuffle Album.js`
* `Spotify Shuffle Balanced.js`

Additional modes can be added without redesigning the Spotify communication layer.

---

## Engine Contract

The engine receives a structured input containing configuration and tracks.

Conceptually:

```json
{
  "config": {},
  "tracks": []
}
```

All shuffle modes return a common output structure.

Conceptually:

```json
{
  "engine_version": 5,
  "mode": "...",
  "count": 0,
  "chunk_count": 0,
  "tracks": [],
  "debug": null,
  "chunk_1": []
}
```

The exact number of chunk fields depends on the generated output.

A stable engine contract allows the surrounding Shortcuts to remain unchanged when shuffle algorithms are modified or added.

---

## Playlist Writing

The engine output is passed to:

`Spotify Playlist Writer`

The writer uses the configured cache playlist as the playback target.

Its responsibilities include:

* Reading the cache playlist ID
* Replacing the existing playlist contents
* Uploading additional chunks when required
* Validating every Spotify API result

The source playlist itself is never modified.

---

## Playback

After the cache playlist has been written successfully, Spotify True Shuffle starts playback from the cache playlist.

Spotify's native shuffle is disabled because the order has already been generated by the True Shuffle engine.

Conceptually:

```text
Source Playlist
      │
      ▼
True Shuffle Engine
      │
      ▼
Generated Track Order
      │
      ▼
Cache Playlist
      │
      ▼
Spotify Playback
```

The cache playlist is therefore an implementation detail and should not be treated as a normal user-managed playlist.

---

## Error Handling

Spotify True Shuffle uses layered error propagation.

Conceptually:

```text
Spotify API
    │
    ▼
API Result Check
    │
    ▼
Calling Shortcut
    │
    ▼
Parent Workflow
```

If an API request fails, the error should propagate upward instead of allowing later workflow stages to continue with invalid data.

For example:

```text
Spotify API
    │
    ▼
API_ERROR
    │
    ▼
Playlist Writer
    │
    ▼
Writer stops
    │
    ▼
Spotify True Shuffle stops
    │
    ▼
Playback is not started
```

This prevents secondary errors from hiding the original failure.

---

## Authentication Architecture

Spotify True Shuffle uses the Spotify Authorization Code flow with PKCE.

The authentication components are:

* `Spotify Login`
* `Spotify Login Callback`
* `Spotify Refresh Token`
* `Spotify API`

The flow is:

```text
Spotify Login
      │
      ▼
GitHub Pages
      │
      ▼
Spotify Authorization
      │
      ▼
GitHub Pages Callback
      │
      ▼
Spotify Login Callback
      │
      ▼
tokens.json
```

The Client Secret is not required and is not stored by Spotify True Shuffle.

Access tokens are refreshed automatically when required.

---

## Configuration Architecture

User configuration is stored in:

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Data/
        ├── config.json
        ├── playlists.json
        └── tokens.json
```

Each file has a separate responsibility.

### `config.json`

Contains application configuration such as:

* Spotify Client ID
* Redirect URI
* Cache playlist ID
* Shuffle mode
* Algorithm parameters
* Debug settings

Application components access configuration through:

* `Spotify Load Config`
* `Spotify Save Config`

Runtime Shortcuts should not independently implement configuration file handling.

### `playlists.json`

Contains the user's saved source playlists.

Conceptually:

```json
{
  "Playlist Name": "https://open.spotify.com/playlist/..."
}
```

Playlist storage is handled through:

* `Spotify Load Playlists`
* `Spotify Save Playlists`

### `tokens.json`

Contains Spotify authentication state.

It is managed by the authentication and API components.

It should not be treated as normal user configuration.

---

## Settings

User-facing configuration is managed through:

`Spotify Settings`

This provides a central interface for:

* Spotify configuration
* Cache playlist configuration
* Playlist management
* Shuffle mode selection
* Debug settings

The Settings Shortcut uses the configuration modules instead of directly duplicating storage logic.

---

## Installation Architecture

Installation is intentionally separated from runtime operation.

The main components are:

* `Spotify True Shuffle Installer`
* `manifest.json`
* `install.html`
* `config.example.json`
* `playlists.example.json`

The installer acts as the bootstrap and verification layer for the project.

Unlike normal runtime Shortcuts, the installer is intentionally larger because its purpose is to hide installation complexity from the user.

### Manifest

The central installation metadata is stored in:

`manifest.json`

The manifest describes:

* Project version
* Release channel
* Minimum platform requirements
* Installer version
* Required Apple Shortcuts
* Shortcut versions
* Shortcut iCloud URLs
* Installation order
* Required Scriptable modules
* Scriptable module versions
* Scriptable download URLs
* Configuration templates

Conceptually:

```text
                 manifest.json
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
       Installer             install.html
           │                     │
           ▼                     ▼
  Scriptable Modules       Shortcut Links
```

The manifest is intended to be the central source of truth for distributable project components.

---

## Installer Flow

The installer follows a staged process.

```text
Bootstrap
   │
   ▼
Load Manifest
   │
   ▼
Prepare Directories
   │
   ▼
Stage Scriptable Modules
   │
   ▼
Validate Staging
   │
   ▼
Backup Existing Modules
   │
   ▼
Deploy Scriptable Modules
   │
   ▼
Verify Apple Shortcuts
   │
   ├── Missing
   │      │
   │      ▼
   │   install.html
   │
   └── Complete
          │
          ▼
     Organize Shortcuts
          │
          ▼
        Setup
          │
          ▼
    Authentication
```

### Staging

Scriptable modules are not downloaded directly into the production Scriptable directory.

They are first stored in:

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Test/
```

This directory acts as staging.

The installer can therefore verify that the expected modules were downloaded before production files are replaced.

### Backup

Before an existing Scriptable module is replaced, it is copied to:

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Backup/
        └── <timestamp>/
```

The backup stage occurs before production deployment.

Automatic rollback is not currently implemented.

The backup exists primarily as a recovery mechanism if deployment fails or a new module introduces problems.

### Scriptable Deployment

After successful staging and backup, the installer copies the staged modules into the Scriptable iCloud directory.

Existing project modules are overwritten.

User configuration is stored separately and is not part of Scriptable deployment.

---

## Shortcut Distribution

Apple does not provide a supported mechanism for silently importing shared Shortcuts.

Spotify True Shuffle therefore uses a guided installation page:

`install.html`

The installer first compares the required Shortcut names from the manifest with the Shortcuts currently installed on the device.

Missing component IDs are passed to the installation page.

Conceptually:

```text
install.html?missing=spotify_api,spotify_settings
```

The page:

* Reads `manifest.json`
* Filters the manifest by the supplied IDs
* Displays only the missing components
* Provides their official iCloud Shortcut links

The user manually confirms each Apple Shortcut import.

The installer performs the final verification after it is run again.

### Shortcut Organization

After all required components are present, the installer creates:

`Spotify True Shuffle`

inside Apple Shortcuts.

Recognized project Shortcuts are moved into this folder.

Component names are therefore significant.

A renamed component may be interpreted as missing because the installer uses exact project Shortcut names for verification.

---

## Configuration Templates

Fresh installations use:

* `config/config.example.json`
* `config/playlists.example.json`

The URLs of these files are defined in the manifest.

If local configuration files do not exist, the installer downloads the templates and creates:

* `config.json`
* `playlists.json`

Existing local files are preserved.

This separates project defaults from user-specific state.

---

## GitHub Pages

GitHub Pages currently has two responsibilities.

### Authentication Callback

`index.html`

supports the Spotify PKCE authentication flow and returns the authorization result to Apple Shortcuts.

### Shortcut Installation

`install.html`

provides the guided installation interface for missing Apple Shortcut components.

Both pages are project infrastructure rather than part of the runtime shuffle engine.

---

## Repository as Distribution Layer

The GitHub repository contains the distributable project state.

Conceptually:

```text
Repository
│
├── manifest.json
│
├── index.html
├── install.html
│
├── config/
│   ├── config.example.json
│   └── playlists.example.json
│
├── scriptable/
│   └── JavaScript modules
│
└── docs/
    └── Documentation
```

Apple Shortcut binaries themselves are distributed through Apple's iCloud Shortcut sharing system.

Their iCloud URLs are referenced by the manifest.

---

## Design Principles

Spotify True Shuffle follows several architectural principles.

### Single Responsibility

Runtime components should have one clear responsibility.

Examples:

* `Spotify API` communicates with Spotify.
* `Spotify Playlist Loader` loads playlists.
* `Spotify Playlist Writer` writes playlists.
* `Spotify Shuffle Engine` bridges Shortcuts and the Scriptable engine.

### Centralized Spotify Communication

Spotify API logic belongs in:

`Spotify API`

Calling Shortcuts should not independently implement authentication or HTTP request handling.

### Centralized Storage Access

Configuration and playlist storage are accessed through dedicated load/save components.

This avoids duplicating storage behavior throughout the project.

### Algorithm Independence

Shuffle algorithms should not depend on Spotify API implementation details.

They operate on normalized track objects.

This makes algorithm development and testing significantly easier.

### Stable Contracts

Modules communicate through predictable input and output structures.

Internal implementations may change as long as their external contracts remain compatible.

### User Data Preservation

Installation and updates should preserve:

* `config.json`
* `playlists.json`
* `tokens.json`

unless a migration explicitly requires otherwise.

Project defaults and user state remain separate.

### Installer as an Exception

Normal Spotify True Shuffle Shortcuts should remain as small and modular as practical.

The installer is an intentional exception.

Its purpose is to provide one user-facing bootstrap workflow rather than requiring users to manually install or coordinate multiple installer components.

---

## Future Architecture

The current architecture is designed to support future additions such as:

* Additional shuffle modes
* Configuration migrations
* Automatic update detection
* Component version verification
* Integrity checks
* Rollback support
* Additional diagnostics
* Release channels

These features should extend the existing contracts rather than require a redesign of the runtime workflow.

---

## Next Step

Continue with:

`docs/03_Shortcuts.md`

for a detailed description of the Apple Shortcut components.
