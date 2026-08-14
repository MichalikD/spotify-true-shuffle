# Project Structure

> Audience: Developers / Advanced Users

This document describes the repository layout and the local files created by Spotify True Shuffle.

The repository separates distribution infrastructure, configuration templates, Scriptable source files and documentation from user-specific runtime data.

---

# Repository Structure

```text
spotify-true-shuffle/
│
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
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
│   ├── Spotify Shuffle Engine v5.js
│   ├── Spotify Shuffle Common.js
│   ├── Spotify Shuffle Validation.js
│   ├── Spotify Shuffle Output.js
│   ├── Spotify Shuffle Artist.js
│   ├── Spotify Shuffle Album.js
│   ├── Spotify Shuffle Balanced.js
│   └── Spotify Flatten Track Lists.js
│
└── docs/
    ├── 01_Installation.md
    ├── 02_Architecture.md
    ├── 03_Project_Structure.md
    ├── 04_Configuration.md
    ├── 05_Shortcuts.md
    ├── 06_Scriptable.md
    ├── 07_Shuffle_Engine.md
    ├── 08_Development.md
    ├── 09_Troubleshooting.md
    ├── 10_Known_Issues.md
    └── 11_Roadmap.md
```

Apple Shortcut files are not stored directly in the repository.

They are distributed through Apple's iCloud Shortcut sharing system and referenced by `manifest.json`.

---

# Root Files

## README.md

The main project entry point.

It provides:

- project overview
- feature summary
- installation entry point
- documentation links
- project status

The README should remain concise and point to the detailed documentation where appropriate.

---

## CHANGELOG.md

Tracks notable changes between project versions.

Changes intended for a release should be recorded here rather than reconstructed later from commit history.

---

## CONTRIBUTING.md

Contains contribution guidelines for developers who want to modify or extend Spotify True Shuffle.

---

## manifest.json

`manifest.json` is the central distribution manifest.

It contains metadata for:

- the project
- installer
- Apple Shortcuts
- Scriptable modules
- configuration templates

Conceptually:

```json
{
  "manifest_version": 1,
  "project": {},
  "installer": {},
  "shortcuts": [],
  "scriptable_modules": [],
  "configuration": {}
}
```

Both the installer and installation website use this file.

The manifest should therefore be treated as the authoritative description of distributable project components.

---

# GitHub Pages

Two HTML files currently provide browser-based infrastructure.

## index.html

`index.html` provides the browser-based Spotify PKCE authentication entry point and callback.

The page does not contain installation-specific Spotify credentials.

The `Spotify Login` Shortcut opens the configured Redirect URI and passes the user's Spotify Client ID as a query parameter.

Conceptually:

```text
<redirect_uri>?client_id=<spotify_client_id>
```

---

## install.html

`install.html` provides the guided Apple Shortcut installation interface.

The installer can pass missing component IDs using:

```text
install.html?missing=spotify_api,spotify_settings
```

The page then:

1. loads `manifest.json`
2. identifies the requested Shortcut components
3. reads their current iCloud URLs
4. displays installation buttons

This avoids maintaining a second independent list of Shortcut download URLs.

---

# Configuration Templates

The repository contains:

```text
config/
├── config.example.json
└── playlists.example.json
```

These are installation templates, not user configuration files.

---

## config.example.json

Contains the current default application configuration.

It includes:

- configuration schema version
- default shuffle mode
- algorithm parameters
- debug defaults
- empty installation-specific Spotify values

Values such as the following remain empty in the repository:

```json
{
  "spotify_client_id": "",
  "spotify_redirect_uri": "",
  "cache_playlist_id": ""
}
```

The installer uses this template when no local `config.json` exists.

---

## playlists.example.json

Provides the initial structure for saved source playlists.

The default template is:

```json
{}
```

User playlists are added later through Spotify Settings.

Personal playlist URLs should never be committed to the template.

---

# Scriptable Directory

The repository's:

```text
scriptable/
```

directory contains the distributable JavaScript source files.

Current modules include:

```text
Spotify Shuffle Engine v5.js
Spotify Shuffle Common.js
Spotify Shuffle Validation.js
Spotify Shuffle Output.js
Spotify Shuffle Artist.js
Spotify Shuffle Album.js
Spotify Shuffle Balanced.js
Spotify Flatten Track Lists.js
```

These files are downloaded by the installer according to `manifest.json`.

The repository versions are the distributable source of the Scriptable modules.

---

# Scriptable Module Roles

## Spotify Shuffle Engine v5.js

Main engine entry point.

It receives normalized tracks and configuration, selects the requested shuffle mode and coordinates the supporting modules.

---

## Spotify Shuffle Common.js

Contains shared utilities used by multiple shuffle modes.

Reusable algorithm functionality should be placed here when it is not specific to one mode.

---

## Spotify Shuffle Validation.js

Handles engine input and configuration validation.

Validation remains separate from individual shuffle algorithms.

---

## Spotify Shuffle Output.js

Creates the standardized engine output consumed by Apple Shortcuts.

This helps keep the external engine contract stable even when internal algorithms change.

---

## Spotify Shuffle Artist.js

Implements the artist-focused shuffle mode.

---

## Spotify Shuffle Album.js

Implements the album-focused shuffle mode.

---

## Spotify Shuffle Balanced.js

Implements the balanced shuffle mode.

---

## Spotify Flatten Track Lists.js

Converts Spotify playlist API responses into the normalized internal track structure used by the shuffle engine.

It is part of the data-processing boundary between Spotify responses and algorithm logic.

---

# Documentation Directory

Detailed documentation lives in:

```text
docs/
```

The numbering defines the intended reading order.

| File | Purpose |
|---|---|
| `01_Installation.md` | End-user installation and initial setup |
| `02_Architecture.md` | High-level system architecture |
| `03_Project_Structure.md` | Repository and local file layout |
| `04_Configuration.md` | Configuration files and settings |
| `05_Shortcuts.md` | Apple Shortcut components |
| `06_Scriptable.md` | Scriptable module architecture |
| `07_Shuffle_Engine.md` | Shuffle algorithms and engine behavior |
| `08_Development.md` | Development and release practices |
| `09_Troubleshooting.md` | Troubleshooting procedures |
| `10_Known_Issues.md` | Current limitations and known problems |
| `11_Roadmap.md` | Planned future development |

The numbering should remain stable unless there is a strong structural reason to change it.

New documentation should preferably extend the existing structure instead of renumbering unrelated files.

---

# Local Runtime Structure

Spotify True Shuffle creates its local application data under the Shortcuts iCloud container.

Conceptually:

```text
Shortcuts/
└── Spotify True Shuffle/
    ├── Data/
    │   ├── config.json
    │   ├── playlists.json
    │   ├── tokens.json
    │   └── verifier.txt
    │
    ├── Backup/
    │   └── <timestamp>/
    │       └── Scriptable module backups
    │
    └── Test/
        └── Scriptable staging files
```

These files are local runtime state and are not part of the repository.

---

# Data Directory

```text
Spotify True Shuffle/Data/
```

contains persistent user-specific application state.

## config.json

The installed configuration created from `config.example.json`.

It contains both application defaults and user-specific settings.

---

## playlists.json

Contains the user's saved source playlist names and URLs.

Example:

```json
{
  "My Playlist": "https://open.spotify.com/playlist/..."
}
```

---

## tokens.json

Contains Spotify authentication state.

It is created by the authentication workflow and maintained by the API/token components.

It must not be committed to the repository.

---

## verifier.txt

Stores temporary PKCE verifier data required during Spotify authentication.

It is generated locally as part of the login flow.

---

# Backup Directory

```text
Spotify True Shuffle/Backup/
```

contains backups created by the installer before existing Scriptable modules are replaced.

Backups are grouped by installation timestamp.

Conceptually:

```text
Backup/
└── 2026-08-14_093000/
    ├── Spotify Shuffle Engine v5.js
    ├── Spotify Shuffle Common.js
    └── ...
```

The backup directory is not the active Scriptable installation.

It exists as a recovery copy.

---

# Test Directory

```text
Spotify True Shuffle/Test/
```

is the installer staging area.

New Scriptable modules are downloaded here before deployment.

The directory is temporary working storage and should not contain user data.

The installer manages its contents.

---

# Scriptable Runtime Directory

The active JavaScript modules are stored separately inside Scriptable's iCloud directory.

Conceptually:

```text
Scriptable/
├── Spotify Shuffle Engine v5.js
├── Spotify Shuffle Common.js
├── Spotify Shuffle Validation.js
├── Spotify Shuffle Output.js
├── Spotify Shuffle Artist.js
├── Spotify Shuffle Album.js
├── Spotify Shuffle Balanced.js
└── Spotify Flatten Track Lists.js
```

The installer copies validated staged modules into this location.

Scriptable itself is responsible for creating and managing its iCloud container.

---

# Apple Shortcuts Folder

After installation, recognized project Shortcuts are organized into:

```text
Spotify True Shuffle
```

inside the Shortcuts app.

The folder contains the runtime components but not necessarily the installer.

Shortcut names are significant because they are used for component discovery and inter-Shortcut calls.

---

# Repository vs Local State

A useful distinction is:

```text
Repository
│
├── project source
├── default configuration
├── manifest
├── documentation
└── distribution metadata

Local Installation
│
├── user configuration
├── saved playlists
├── authentication tokens
├── Scriptable runtime files
└── backups
```

User-specific state should never be added to the repository.

Repository defaults should never contain personal Spotify credentials, authentication tokens or playlist collections.

---

# Files That Must Remain Private

Never commit local versions of:

```text
tokens.json
verifier.txt
config.json
playlists.json
```

A local `config.json` may contain a Spotify Client ID and installation-specific configuration.

A local `playlists.json` contains the user's playlist collection.

`tokens.json` contains authentication material and must always remain private.

Only the sanitized templates belong in the repository:

```text
config.example.json
playlists.example.json
```

---

# Adding New Project Files

When introducing a new runtime component, consider which layer owns it.

```text
Spotify/API orchestration
→ Apple Shortcut

Shuffle/data-processing logic
→ Scriptable

Default user configuration
→ config template

Distribution metadata
→ manifest.json

Browser bootstrap/callback behavior
→ GitHub Pages

Documentation
→ docs/
```

Avoid creating duplicate sources of truth.

For example, a new Scriptable module should be added to:

```text
scriptable/
```

and referenced from:

```text
manifest.json
```

rather than maintaining a separate hardcoded installer list.

---

# Structural Stability

The repository layout should change less frequently than individual implementations.

New shuffle modes should normally require changes only to:

```text
scriptable/
manifest.json
relevant documentation
```

They should not require restructuring the repository or rewriting unrelated documentation.

Similarly, changes to a single Shortcut should normally affect only its manifest metadata and the documentation that describes that component.

---

# Next Step

Continue with:

```text
docs/04_Configuration.md
```

for configuration files, settings and application defaults.
