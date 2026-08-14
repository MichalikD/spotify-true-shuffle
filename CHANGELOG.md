# Changelog

All notable changes to Spotify True Shuffle will be documented in this file.

The project follows Semantic Versioning where practical.

---

# [0.9.0] - Beta

Spotify True Shuffle enters its first structured beta phase.

This version establishes the current runtime architecture, shuffle engine, configuration system and installation infrastructure that will form the baseline for future development.

---

## Added

### Shuffle Engine

* Modular Scriptable shuffle engine
* Engine contract version 5
* Random shuffle using Fisher-Yates
* Artist-aware shuffle
* Album-aware shuffle
* Balanced Artist/Album shuffle
* Shared shuffle utilities
* Centralized validation
* Standardized engine output
* Chunk generation for playlist writing
* Optional debug output

---

### Scriptable Modules

Added:

* `Spotify Shuffle Engine v5.js`
* `Spotify Shuffle Common.js`
* `Spotify Shuffle Validation.js`
* `Spotify Shuffle Output.js`
* `Spotify Shuffle Artist.js`
* `Spotify Shuffle Album.js`
* `Spotify Shuffle Balanced.js`
* `Spotify Flatten Track Lists.js`

---

### Apple Shortcuts

Added modular runtime components:

* `Spotify True Shuffle`
* `Spotify Shuffle Engine`
* `Spotify Playlist Loader`
* `Spotify Playlist Writer`
* `Spotify API`
* `Spotify API Result Check`
* `Spotify Login`
* `Spotify Login Callback`
* `Spotify Refresh Token`
* `Spotify Settings`
* `Spotify Load Config`
* `Spotify Save Config`
* `Spotify Load Playlists`
* `Spotify Save Playlists`

---

### Authentication

* Spotify Authorization Code flow with PKCE
* GitHub Pages authentication callback
* Configurable Spotify Client ID
* Configurable Redirect URI
* Automatic access-token refresh
* Persistent local authentication state
* Re-authentication support when refresh is no longer possible

---

### Spotify API Layer

* Centralized Spotify Web API Shortcut
* Shared authentication handling
* Optional request bodies
* Support for required HTTP methods
* Central API result validation
* Fail-fast error propagation
* Playlist loading through `/playlists/{id}/items`

---

### Playlist Handling

* Playlist URL/ID handling
* Spotify playlist pagination
* Track normalization through Scriptable
* Dedicated cache playlist
* Multi-chunk playlist writing
* Saved source playlist library
* Playlist management through Spotify Settings

---

### Configuration

* Centralized `config.json`
* Separate `playlists.json`
* Configuration schema version 2
* Spotify Client ID configuration
* Redirect URI configuration
* Cache playlist configuration
* Shuffle mode configuration
* Debug configuration
* Artist-mode parameters
* Album-mode parameters
* Balanced-mode parameters
* Repository configuration templates

Added:

* `config/config.example.json`
* `config/playlists.example.json`

---

### Settings

Added central `Spotify Settings` interface for:

* Shuffle Mode
* Debug enabled/disabled
* Debug Limit
* Cache Playlist ID
* Spotify Client ID
* Spotify Redirect URI
* Saved playlist management
* Configuration display

Settings uses the dedicated configuration and playlist load/save components.

---

### Installer

Added:

* `Spotify True Shuffle Installer`
* Remote manifest loading
* Installer/project compatibility checks
* Automatic project directory creation
* Scriptable staging
* Scriptable deployment validation
* Timestamped Scriptable backups
* Production Scriptable deployment
* Installed Shortcut discovery
* Missing Shortcut detection
* Automatic project Shortcut organization
* Initial configuration creation
* Initial playlist-file creation
* First-time Settings setup
* Spotify authentication bootstrap
* Rerunnable installation verification

Current installer version:

```text
0.4.0
```

---

### Distribution

Added central:

`manifest.json`

for:

* Project metadata
* Project version
* Release channel
* Installer metadata
* Shortcut metadata
* Shortcut versions
* Shortcut iCloud URLs
* Scriptable module metadata
* Scriptable module versions
* Scriptable download URLs
* Configuration template URLs

Added:

`install.html`

for guided installation of missing Apple Shortcuts.

The installation page dynamically reads the project manifest and can display only the component IDs supplied by the installer.

---

### Local Storage Structure

Spotify True Shuffle now uses:

```text
Shortcuts/
└── Spotify True Shuffle/
    ├── Data/
    ├── Backup/
    └── Test/
```

`Data/` stores persistent local state.

`Backup/` stores Scriptable backups created before deployment.

`Test/` acts as the Scriptable staging area.

---

### Documentation

Added and expanded documentation for:

* Installation
* Architecture
* Project Structure
* Configuration
* Apple Shortcuts
* Scriptable Modules
* Shuffle Engine
* Development
* Troubleshooting
* Known Issues
* Roadmap

---

## Changed

* Reworked the project from an individual Shortcut workflow into a modular framework.
* Moved Spotify API handling into one central component.
* Moved configuration access into dedicated load/save Shortcuts.
* Moved playlist storage into dedicated load/save Shortcuts.
* Split the Scriptable engine into focused modules.
* Standardized normalized track structures.
* Standardized shuffle-engine output.
* Replaced deprecated playlist-track access with the current playlist-items endpoint.
* Made Spotify Client ID, Redirect URI and cache playlist user-configurable.
* Moved distribution metadata into `manifest.json`.
* Changed installation from primarily manual setup to a guided installer workflow.
* Added Scriptable staging and backup before production deployment.
* Changed Apple Shortcut installation to a manifest-driven GitHub Pages workflow.
* Reorganized project documentation around stable responsibility boundaries.
* Removed the hardcoded Spotify Client ID from the GitHub Pages authentication flow. Spotify Login now passes the configured Client ID dynamically, allowing each installation or fork to use its own Spotify Developer application.

---

## Fixed

* Token refresh now returns cleanly to the original Spotify API request.
* API errors are propagated instead of allowing dependent actions to continue blindly.
* Playlist Loader no longer relies on a hardcoded test playlist.
* Configuration and playlist file handling is centralized.
* Shortcut detection uses exact project component names.
* Missing Shortcut installation can now be limited to the components actually missing.
* Scriptable filenames have been standardized across the project.

---

## Known Issues

Current limitations and unresolved behavior are documented in:

`docs/10_Known_Issues.md`

Notable current limitations include:

* Occasional Spotify playback-context synchronization delay
* Delayed Spotify playlist UI refresh
* Manual confirmation required for Apple Shortcut imports
* Fresh installations may require multiple installer runs
* No automatic Scriptable rollback yet
* No complete automatic update manager yet

---

## Next

Before the beta baseline is considered complete:

* Complete all official Shortcut iCloud URLs in `manifest.json`
* Perform a clean end-to-end installation test
* Perform an existing-installation regression test
* Complete final repository consistency checks

Future development is tracked in:

`docs/11_Roadmap.md`
