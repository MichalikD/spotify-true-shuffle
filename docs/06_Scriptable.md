# Scriptable Modules

> Audience: Developers / Advanced Users

Spotify True Shuffle uses Scriptable as its computation and shuffle-engine layer.

The Scriptable modules are intentionally separated from:

* Spotify authentication
* Spotify Web API requests
* playlist storage
* Apple Shortcut user interfaces
* persistent configuration access
* playback control

They receive structured input, perform data processing or shuffle computation and return structured output.

This keeps algorithm development independent from Spotify and Apple Shortcuts.

---

# Current Module Structure

The current Scriptable directory contains:

```text
scriptable/
├── Spotify Flatten Track Lists.js
├── Spotify Shuffle Engine v5.js
├── Spotify Shuffle Common.js
├── Spotify Shuffle Validation.js
├── Spotify Shuffle Output.js
├── Spotify Shuffle Artist.js
├── Spotify Shuffle Album.js
└── Spotify Shuffle Balanced.js
```

These files are distributed through the repository and referenced by:

```text
manifest.json
```

The installer stages and deploys the modules automatically.

---

# High-Level Architecture

```text
Spotify Playlist API Pages
          │
          ▼
Spotify Flatten Track Lists.js
          │
          ▼
Normalized Tracks
          │
          ▼
Spotify Shuffle Engine v5.js
          │
          ├── Spotify Shuffle Common.js
          ├── Spotify Shuffle Validation.js
          ├── Spotify Shuffle Output.js
          │
          ├── Random
          │     └── Common / Fisher-Yates
          │
          ├── Spotify Shuffle Artist.js
          ├── Spotify Shuffle Album.js
          └── Spotify Shuffle Balanced.js
          │
          ▼
Standardized Engine Output
```

The flattening module is part of the preprocessing boundary.

The shuffle engine itself operates only on normalized tracks.

---

# Design Principle

Scriptable should behave as a computation layer.

A shuffle module should not need to know:

* which Spotify playlist the tracks came from
* how Spotify authentication works
* where configuration files are stored
* which Apple Shortcut invoked it
* how the resulting cache playlist is written

The module should receive the data it needs and return its result.

This makes the engine easier to:

* test
* debug
* extend
* reason about
* reuse

---

# Spotify Flatten Track Lists.js

## Purpose

Convert Spotify playlist API responses into the normalized track format expected by the shuffle engine.

This module runs before the main engine.

---

## Input

The input may contain Spotify playlist pages, nested arrays or already partially processed data.

The module recursively traverses the supplied structure and extracts valid Spotify tracks.

---

## Normalized Track Format

Conceptually:

```json
{
  "uri": "spotify:track:...",
  "name": "Track Name",
  "artists": [
    "Artist Name"
  ],
  "album": {
    "name": "Album Name",
    "uri": "spotify:album:..."
  }
}
```

Only Spotify track URIs are included in the normalized track collection.

---

## Output

Conceptually:

```json
{
  "tracks": [],
  "count": 0
}
```

The normalized tracks are then passed to the shuffle engine.

---

## Responsibility Boundary

The flattening module owns:

* Spotify playlist response traversal
* track extraction
* normalization into the internal track structure

It does not own:

* pagination
* Spotify HTTP requests
* shuffle logic
* playlist writing

Pagination remains the responsibility of the Apple Shortcut Playlist Loader.

---

# Spotify Shuffle Engine v5.js

## Purpose

Main entry point and orchestrator of the Scriptable shuffle engine.

The current engine version is:

```text
5
```

---

## Responsibilities

The engine:

1. receives the Shortcut input
2. parses the input
3. extracts configuration and tracks
4. validates tracks
5. selects the configured shuffle mode
6. executes the corresponding algorithm
7. validates the shuffled result
8. builds standardized output
9. validates the final output
10. returns JSON to Apple Shortcuts

The main engine should contain as little mode-specific algorithm logic as practical.

---

# Engine Input

Conceptually:

```json
{
  "config": {},
  "tracks": []
}
```

The current engine reads:

```text
config.shuffle_mode
```

to determine the active algorithm.

If no mode is supplied, the engine currently falls back to:

```text
random
```

---

# Mode Dispatch

The main engine currently supports:

```text
random
artist
album
balanced
```

Conceptually:

```text
shuffle_mode
    │
    ├── random
    │     └── Fisher-Yates
    │
    ├── artist
    │     └── Spotify Shuffle Artist.js
    │
    ├── album
    │     └── Spotify Shuffle Album.js
    │
    └── balanced
          └── Spotify Shuffle Balanced.js
```

Unknown modes cause the engine to fail instead of silently falling back to another algorithm.

---

# Random Mode

Random mode currently does not require its own dedicated Scriptable module.

The engine uses the shared Fisher-Yates implementation from:

```text
Spotify Shuffle Common.js
```

This is appropriate while Random mode remains a simple unbiased random permutation.

If Random mode later develops substantial independent behavior, it may be moved into its own module.

---

# Spotify Shuffle Common.js

## Purpose

Provide utilities shared by multiple Scriptable modules.

---

## Responsibilities

Shared functionality belongs here when it is genuinely reusable across algorithms.

Current shared behavior includes utilities such as:

* input parsing
* Fisher-Yates shuffling
* common helper logic used by shuffle modes

The exact helper set may evolve as algorithms are extended.

---

## Rule

A helper should normally move into Common when:

* multiple modes require the same implementation
* the behavior is algorithm-independent
* duplicating it would risk inconsistent behavior

Mode-specific scoring should remain in the mode that owns it.

---

# Spotify Shuffle Validation.js

## Purpose

Provide centralized validation for engine contracts and shuffle results.

---

## Current Validation Stages

The main engine currently calls validation for:

```text
Input tracks
    │
    ▼
Shuffle execution
    │
    ▼
Shuffled track result
    │
    ▼
Output construction
    │
    ▼
Final engine output
```

Validation should fail as close as possible to the source of invalid data.

---

## Responsibilities

Validation may include checks such as:

* valid track collections
* required track fields
* valid shuffled output
* preservation of track counts/content
* engine output structure

Mode-specific assumptions should only be validated globally when they are part of the common engine contract.

---

# Spotify Shuffle Output.js

## Purpose

Generate the common engine output consumed by Apple Shortcuts.

Shuffle modules should not independently construct the final engine response.

---

## Responsibilities

The output layer owns:

* common output structure
* engine version
* mode information
* track count
* chunk generation
* chunk count
* debug attachment

Centralizing this behavior keeps every mode compatible with the Playlist Writer.

---

# Engine Output Contract

The v5 engine follows a common output contract.

Conceptually:

```json
{
  "engine_version": 5,
  "mode": "...",
  "count": 0,
  "chunk_count": 0,
  "tracks": [],
  "chunk_1": [],
  "debug": null
}
```

Additional:

```text
chunk_2
chunk_3
...
chunk_n
```

fields are generated when required.

The number of chunks depends on the result size.

---

## Contract Stability

The Playlist Writer depends on this output contract.

Internal shuffle algorithms may change without requiring Writer changes as long as the engine continues to return a compatible structure.

This is one of the most important boundaries in the project.

---

# Shuffle Modules

Each complex shuffle mode should live in its own Scriptable module.

Current dedicated mode modules are:

```text
Spotify Shuffle Artist.js
Spotify Shuffle Album.js
Spotify Shuffle Balanced.js
```

A mode module should focus on generating a new track order.

It should not construct the final Writer output itself.

---

# Spotify Shuffle Artist.js

## Purpose

Generate a track order focused on distributing repeated artists more evenly.

---

## Responsibilities

Artist mode owns:

* artist-oriented scheduling
* artist repetition penalties
* artist candidate scoring
* artist-mode randomness
* artist-mode candidate selection

Its configuration uses the:

```text
artist_*
```

parameter family.

Detailed algorithm behavior belongs in:

```text
docs/07_Shuffle_Engine.md
```

---

# Spotify Shuffle Album.js

## Purpose

Generate a track order focused on distributing repeated albums more evenly.

---

## Responsibilities

Album mode owns:

* album-oriented scheduling
* album repetition penalties
* album candidate scoring
* album-mode randomness
* album-mode candidate selection

Its configuration uses the:

```text
album_*
```

parameter family.

---

# Spotify Shuffle Balanced.js

## Purpose

Combine artist and album considerations into one shuffle mode.

Balanced mode is not simply a second independent implementation of the Artist and Album algorithms.

It coordinates their scoring concepts and produces a combined selection result.

---

## Responsibilities

Balanced mode owns:

* artist/album score combination
* relative artist weighting
* relative album weighting
* Balanced-mode randomness
* Balanced candidate selection
* Balanced-specific debug data

Its configuration uses:

```text
balanced_*
```

parameters while also relying on Artist and Album scoring behavior.

---

# Module Dependencies

The current dependency direction is conceptually:

```text
Spotify Shuffle Engine v5.js
        │
        ├── Common
        ├── Validation
        ├── Output
        ├── Artist
        ├── Album
        └── Balanced
              │
              ├── Artist behavior
              └── Album behavior
```

Dependencies should remain directional.

For example:

```text
Artist
```

should not import the main Engine.

Likewise:

```text
Common
```

should not depend on a specific shuffle mode.

This helps prevent circular dependencies.

---

# Data Ownership

Each module should own one area.

| Module                | Owns                            |
| --------------------- | ------------------------------- |
| `Flatten Track Lists` | Spotify response normalization  |
| `Engine v5`           | orchestration and mode dispatch |
| `Common`              | shared utilities                |
| `Validation`          | common contracts and validation |
| `Output`              | final engine output             |
| `Artist`              | Artist shuffle behavior         |
| `Album`               | Album shuffle behavior          |
| `Balanced`            | combined Artist/Album behavior  |

A module should not take responsibility for another layer simply because the data is available.

---

# Debug Data

Debug information may be generated by algorithms and attached to the final result through the Output module.

The engine-level configuration currently uses:

```text
debug_enabled
debug_limit
```

Debug output is intended for:

* development
* algorithm inspection
* troubleshooting

Normal execution should not depend on debug data being present.

A mode should still produce a valid shuffle result when debug output is disabled.

---

# Adding a New Shuffle Mode

The architecture is designed so that adding a mode should require only localized changes.

Conceptually, a new mode named:

```text
genre
```

would normally require:

```text
Spotify Shuffle Genre.js
```

plus registration in the engine.

The implementation flow should be:

```text
Create mode module
      │
      ▼
Define config keys
      │
      ▼
Register mode in Engine
      │
      ▼
Add module to manifest
      │
      ▼
Expose mode in Settings if appropriate
      │
      ▼
Update relevant documentation
```

The Playlist Loader and Playlist Writer should not require changes merely because a new shuffle mode exists.

---

# New Mode Contract

A new mode should:

* accept the normalized track collection
* accept configuration
* use shared helpers where appropriate
* return a valid shuffled track collection or the documented mode-specific intermediate result
* preserve all tracks
* avoid Spotify API access
* avoid direct filesystem access
* avoid constructing Writer output

The main Engine and Output layers remain responsible for the external engine contract.

---

# New Module Naming

New algorithm modules should follow the existing naming convention:

```text
Spotify Shuffle <Mode>.js
```

Examples:

```text
Spotify Shuffle Genre.js
Spotify Shuffle History.js
Spotify Shuffle Energy.js
```

Configuration keys should use a matching prefix where possible:

```text
genre_*
history_*
energy_*
```

This keeps configuration ownership clear.

---

# Manifest Registration

Every distributable Scriptable module must be listed in:

```text
manifest.json
```

A module entry contains metadata such as:

```json
{
  "id": "shuffle_genre",
  "filename": "Spotify Shuffle Genre.js",
  "version": "1.0.0",
  "required": true,
  "download_url": "..."
}
```

The installer should obtain Scriptable components from the manifest rather than from a separate hardcoded module list.

---

# Installation

The active Scriptable modules live inside Scriptable's iCloud container.

The installer does not write remote downloads directly into production.

Conceptually:

```text
GitHub
  │
  ▼
Spotify True Shuffle/Test
  │
  ▼
Validation
  │
  ▼
Backup existing module
  │
  ▼
Scriptable/
```

This staging process is installation infrastructure.

The Scriptable runtime itself does not know how it was installed.

---

# Versioning

Scriptable components have several independent version concepts.

## Engine Version

The current engine contract reports:

```text
engine_version = 5
```

This identifies the engine/output generation.

---

## Module Version

Individual modules have their own versions in:

```text
manifest.json
```

For example:

```text
Spotify Shuffle Artist.js
version 1.0.0
```

Module versions allow individual components to evolve without requiring every module to share the same version number.

---

## Project Version

The complete Spotify True Shuffle release has a separate project version.

These values should not be treated as interchangeable.

---

# Testing Strategy

Scriptable's separation from Spotify makes algorithm testing easier.

Useful test categories include:

* empty or invalid input
* small playlists
* large playlists
* repeated artists
* repeated albums
* extreme frequency distributions
* configuration boundaries
* preservation of every input track
* duplicate track handling
* debug enabled/disabled
* deterministic structural validation

Shuffle quality tests should be separated from contract validation.

A result can be structurally valid while still producing poor distribution.

---

# Best Practices

When modifying Scriptable code:

* keep one clear responsibility per module
* reuse Common helpers instead of copying logic
* keep Spotify HTTP access outside Scriptable
* preserve normalized track structures
* validate common contracts centrally
* generate final output through Output
* preserve all tracks during shuffle
* avoid hidden dependencies between modes
* namespace configuration by owning mode
* keep module filenames stable once distributed

---

# What Should Not Trigger Architectural Changes

Normal algorithm tuning should not require changes to the surrounding framework.

Examples:

```text
Change Artist penalty calculation
→ Artist.js + relevant tests/docs

Change Balanced weighting
→ Balanced.js + configuration/docs if behavior changes

Improve shared helper
→ Common.js + dependent tests

Add Genre mode
→ new module + Engine registration + manifest + relevant docs
```

None of these should require rewriting:

* Playlist Loader
* Playlist Writer
* Spotify API
* authentication
* installer architecture

unless their contracts genuinely change.

---

# Documentation Maintenance

This document should describe the Scriptable module architecture and responsibility boundaries, not every implementation detail.

Update it when:

* a module is added or removed
* module responsibilities change
* dependencies change
* the engine contract changes
* the extension model changes

Do not rewrite this document for ordinary scoring or tuning adjustments that preserve the same architecture.

Algorithm-specific details belong primarily in:

```text
docs/07_Shuffle_Engine.md
```

This separation is intentional so future shuffle development does not require broad documentation rewrites.

---

# Next Step

Continue with:

```text
docs/07_Shuffle_Engine.md
```

for the current shuffle modes, scoring concepts and algorithm behavior.
