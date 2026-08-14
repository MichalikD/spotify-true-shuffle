# Spotify True Shuffle

> A modular Spotify shuffle framework built with Apple Shortcuts and Scriptable.

Spotify True Shuffle generates the playback order **before Spotify starts playing it**.

Instead of relying on Spotify's native shuffle, the project:

1. Loads the complete source playlist
2. Normalizes its tracks
3. Generates a new order using a configurable shuffle strategy
4. Writes that order to a dedicated cache playlist
5. Starts Spotify playback from the generated order

The project combines Apple Shortcuts for orchestration and Spotify integration with a modular Scriptable shuffle engine.

> **Project status:** Beta

---

# Features

* Multiple shuffle strategies

  * Random
  * Artist
  * Album
  * Balanced
* Modular Scriptable shuffle engine
* Modular Apple Shortcuts runtime
* Spotify Web API integration
* Authorization Code with PKCE
* Automatic access-token refresh
* Playlist pagination
* Dedicated cache playlist
* Saved playlist library
* Central configuration
* Debug output
* Guided installer
* Manifest-driven component distribution
* Scriptable staging and backups
* Extensible architecture for future shuffle modes

---

# Shuffle Modes

| Mode         | Description                                                    |
| ------------ | -------------------------------------------------------------- |
| **Random**   | Unbiased Fisher-Yates shuffle                                  |
| **Artist**   | Attempts to distribute tracks from the same artist more evenly |
| **Album**    | Attempts to distribute tracks from the same album more evenly  |
| **Balanced** | Combines artist and album distribution using weighted scoring  |

Artist, Album and Balanced use heuristic scheduling, scoring and controlled randomness.

They aim to produce better practical distribution without making every run deterministic.

---

# How It Works

```text id="8b7b9b"
Spotify Playlist
       │
       ▼
Playlist Loader
       │
       ▼
Track Normalization
       │
       ▼
Shuffle Engine
       │
       ▼
Generated Track Order
       │
       ▼
Playlist Writer
       │
       ▼
Cache Playlist
       │
       ▼
Spotify Playback
```

Apple Shortcuts handles:

* User interaction
* Spotify authentication
* Spotify Web API communication
* Playlist loading
* Playlist writing
* Configuration
* Playback
* Installation

Scriptable handles:

* Track normalization
* Shuffle algorithms
* Scoring
* Validation
* Output generation
* Debug information

See:

`docs/02_Architecture.md`

for the complete architecture.

---

# Requirements

* iPhone or iPad
* Apple Shortcuts
* Scriptable
* iCloud Drive
* Spotify Premium
* Spotify Developer account

Normal users do not need to create their own GitHub repository or GitHub Pages deployment.

The project provides the required browser infrastructure.

---

# Installation

Spotify True Shuffle uses a guided installer to automate as much setup as iOS currently allows.

The installer handles:

* Local project directories
* Scriptable module downloads
* Scriptable staging
* Backups of existing Scriptable modules
* Scriptable deployment
* Shortcut verification
* Initial configuration
* Initial playlist storage setup
* Spotify authentication

Apple requires shared Shortcuts to be manually confirmed during import.

When Shortcut components are missing, the installer opens the project installation page and displays only the missing components.

After installing them, run the installer again to continue setup.

For the complete installation guide see:

`docs/01_Installation.md`

---

# Configuration

Spotify True Shuffle stores user configuration locally.

The main persistent files are:

```text id="g6qsv9"
Shortcuts/
└── Spotify True Shuffle/
    └── Data/
        ├── config.json
        ├── playlists.json
        └── tokens.json
```

Normal configuration is managed through:

`Spotify Settings`

Settings includes:

* Spotify Client ID
* Redirect URI
* Cache playlist
* Shuffle mode
* Debug settings
* Saved playlists

Advanced algorithm defaults are stored in the configuration template.

See:

`docs/04_Configuration.md`

---

# Project Structure

The repository contains:

```text id="q2d6s2"
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
├── scriptable/
└── docs/
```

Apple Shortcut components are distributed using official iCloud Shortcut links referenced by:

`manifest.json`

See:

`docs/03_Project_Structure.md`

for the complete repository and local runtime structure.

---

# Installer and Distribution

The project uses:

`manifest.json`

as the central source of distribution metadata.

It describes:

* Project version
* Installer version
* Required Apple Shortcuts
* Shortcut versions
* Shortcut iCloud links
* Scriptable modules
* Scriptable module versions
* Download URLs
* Configuration templates

The guided Shortcut installation page:

`install.html`

reads the same manifest rather than maintaining another independent component catalog.

This keeps distribution metadata centralized.

---

# Documentation

| Document                  | Purpose                                |
| ------------------------- | -------------------------------------- |
| `01_Installation.md`      | Installation and initial setup         |
| `02_Architecture.md`      | System architecture                    |
| `03_Project_Structure.md` | Repository and local file structure    |
| `04_Configuration.md`     | Configuration system                   |
| `05_Shortcuts.md`         | Apple Shortcut components              |
| `06_Scriptable.md`        | Scriptable module architecture         |
| `07_Shuffle_Engine.md`    | Shuffle algorithms and engine behavior |
| `08_Development.md`       | Development and release practices      |
| `09_Troubleshooting.md`   | Troubleshooting                        |
| `10_Known_Issues.md`      | Current limitations                    |
| `11_Roadmap.md`           | Future direction                       |

---

# Current Architecture

The runtime is intentionally modular.

Examples:

* `Spotify API` → Spotify communication
* `Spotify Playlist Loader` → Playlist retrieval and pagination
* `Spotify Playlist Writer` → Cache playlist updates
* `Spotify Shuffle Engine` → Shortcuts / Scriptable bridge
* `Spotify Settings` → User configuration

Complex shuffle behavior belongs in Scriptable rather than directly inside Apple Shortcuts.

This makes new shuffle modes easier to add without redesigning Spotify communication or playlist writing.

---

# Development Status

Spotify True Shuffle is currently in beta.

The present development focus is:

* Complete distribution metadata
* Verify the full fresh-install workflow
* Test existing-installation behavior
* Stabilize the current beta baseline
* Build update/version-detection infrastructure
* Continue shuffle-engine experimentation

See:

`docs/11_Roadmap.md`

for longer-term development directions.

---

# Known Limitations

Current limitations include:

* Spotify playback context may occasionally lag behind a newly updated cache playlist
* Spotify's UI may display stale playlist contents briefly
* Apple Shortcut imports require manual confirmation
* A fresh installation may require the installer to be run more than once
* Shortcut component names currently need to remain unchanged
* Automatic rollback is not yet implemented
* A complete automatic update manager is not yet implemented

See:

`docs/10_Known_Issues.md`

for details.

---

# Contributing

Contributions, testing and feedback are welcome.

Before making structural changes, read:

* `CONTRIBUTING.md`
* `docs/08_Development.md`

The project favors:

* Focused components
* Stable contracts
* Centralized distribution metadata
* User-data preservation
* Targeted documentation updates
* Backwards-compatible extensions where practical

---

# Security

Never share or commit local authentication data such as:

* `tokens.json`
* `verifier.txt`

Personal:

* `config.json`
* `playlists.json`

should also remain outside the repository.

Only the sanitized templates belong in:

`config/`

Spotify True Shuffle uses Authorization Code with PKCE and does not require a Spotify Client Secret.

---

# Roadmap

Future development may include:

* Additional shuffle modes
* Component update detection
* Automatic Scriptable updates
* Configuration migrations
* Integrity verification
* Automatic rollback
* Algorithm statistics
* Regression testing
* Shuffle benchmarks
* User-experience improvements

Longer-term exploration may also include a standalone application, but the Apple Shortcuts + Scriptable architecture remains the current runtime.

See:

`docs/11_Roadmap.md`

---

# Acknowledgements

Spotify True Shuffle is built with:

* Apple Shortcuts
* Scriptable
* Spotify Web API
* ChatGPT

OpenAI tools were used during design, development, debugging and documentation of the project.
