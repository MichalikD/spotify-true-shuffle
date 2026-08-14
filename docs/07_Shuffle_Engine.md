# Shuffle Engine

> **Audience:** Developers / Advanced Users

---

# Overview

The Scriptable Shuffle Engine is the computational core of Spotify True Shuffle.

Its purpose is simple:

> Receive a playlist and configuration, generate a deterministic playback order and return a standardized output.

The engine is completely independent from

- Spotify
- Apple Shortcuts
- Networking
- Authentication
- Configuration files

It only operates on validated input.

---

> 💡 **Design Note**
>
> The engine was designed to become a reusable shuffle framework rather than a collection of shuffle algorithms.
>
> New algorithms should integrate into the existing architecture instead of extending it.

---

# Philosophy

The engine follows several design principles.

## Deterministic

Given identical

- configuration
- playlist
- shuffle mode

the engine should always produce reproducible behaviour.

Randomness is intentionally controlled.

---

## Modular

Every shuffle algorithm is isolated.

No algorithm should know how another one works.

---

## Stateless

The engine owns no persistent state.

Every execution starts from scratch.

---

## Expandable

Future shuffle modes should require no architectural changes.

---

# Engine Pipeline

```text
Engine Input

      │

      ▼

Validation

      │

      ▼

Configuration

      │

      ▼

Shuffle Mode

      │

      ▼

Shuffle Module

      │

      ▼

Output Generation

      │

      ▼

Engine Output
```

Every stage has exactly one responsibility.

---

# Engine Input

The engine always receives

```json
{
    "config": {},
    "tracks": []
}
```

Nothing more.

Nothing less.

---

## Configuration

Contains user preferences.

Examples

- shuffle mode
- debug
- debug limit

Future versions may extend this object.

---

## Tracks

Each track follows the internal track model.

```json
{
    "uri": "...",
    "name": "...",
    "artists": [],
    "album": {
        "name": "...",
        "uri": "..."
    }
}
```

The engine never receives raw Spotify responses.

---

# Validation Pipeline

Validation is performed at multiple points in the engine pipeline.

The common Validation module currently verifies:

* The input track collection
* The shuffled track result
* The final engine output

The engine itself is responsible for mode dispatch and rejects unsupported shuffle modes.

Conceptually:

```text
Input Tracks
     │
     ▼
Validation
     │
     ▼
Shuffle Mode
     │
     ▼
Algorithm
     │
     ▼
Shuffled Tracks
     │
     ▼
Validation
     │
     ▼
Output Generation
     │
     ▼
Output Validation
```

Validation should fail as close as possible to the source of invalid data.

---

> 💡 **Design Note**
>
> Common structural validation is intentionally centralized.
>
> Mode-specific validation may remain with the component that owns the corresponding behavior.

---

# Shuffle Mode Selection

The Engine selects exactly one shuffle strategy.

Current modes:

```text
random
artist
album
balanced
```

Dedicated algorithm modules currently exist for:

```text
artist
album
balanced
```

Random mode is intentionally lightweight and uses the shared Fisher-Yates implementation from `Spotify Shuffle Common.js` directly.

Conceptually:

```text
shuffle_mode
    │
    ├── random
    │     └── Common / Fisher-Yates
    │
    ├── artist
    │     └── Artist Module
    │
    ├── album
    │     └── Album Module
    │
    └── balanced
          └── Balanced Module
```

Future complex shuffle modes should normally be implemented as dedicated modules rather than adding substantial algorithm logic to the main Engine.

---

# Shuffle Mode Selection

The Engine selects exactly one module.

Current modes

```text
random

artist

album

balanced
```

Future modes should be added here.

The Engine itself should not contain algorithm logic.

---

# Shuffle Module Interface

Every shuffle module follows the same interface.

Input

```text
Tracks

Configuration
```

Output

```text
Track Array
```

No module generates

- chunks
- debug output
- engine metadata

Those responsibilities belong elsewhere.

---

# Random

## Goal

Generate an unbiased random playback order.

Implementation

Fisher-Yates Shuffle.

Responsibilities

- randomness only

No scoring.

No scheduling.

---

# Artist

## Goal

Separate tracks belonging to the same artist.

The algorithm scores candidates based on artist distribution.

Primary considerations include

- previous appearances
- spacing
- scheduling
- weighted randomness

---

# Album

## Goal

Separate tracks belonging to the same album.

The overall structure mirrors Artist Shuffle while using album information instead.

---

# Balanced

## Goal

Combine Artist and Album Shuffle.

Balanced calculates both scores independently before combining them into a final candidate score.

This creates a compromise between

- artist distribution
- album distribution

without strongly favouring either.

---

> 💡 **Design Note**
>
> Balanced is intentionally implemented as a composition of existing algorithms rather than a completely separate implementation.
>
> Improvements to Artist or Album scoring automatically benefit Balanced.

---

# Candidate Selection

Every shuffle algorithm follows the same general idea.

```text
Remaining Tracks

      │

      ▼

Candidate Filtering

      │

      ▼

Scoring

      │

      ▼

Weighted Selection

      │

      ▼

Track Selected
```

Each algorithm differs only in how candidates are scored.

---

# Scoring

The engine intentionally separates

candidate generation

from

candidate scoring.

Future algorithms may completely replace the scoring logic without affecting the remaining pipeline.

Examples

- Artist Score
- Album Score
- Mood Score
- BPM Score

---

# Randomness

Randomness exists on multiple levels.

Examples include

- Fisher-Yates
- weighted candidate selection
- configurable randomness windows

Randomness should always remain controlled.

Pure randomness is rarely desirable for music playback.

---

# Scheduling

Several shuffle modes implement scheduling concepts.

Examples include

- overdue weighting
- spacing
- candidate windows

Scheduling determines *when* a track should become attractive.

Scoring determines *how attractive* it currently is.

---

> 💡 **Design Note**
>
> Separating scheduling from scoring makes future algorithms significantly easier to develop.

---

# Debug Pipeline

Debugging is optional.

When disabled

```json
"debug": null
```

When enabled

the engine returns additional diagnostic information.

Examples

- candidate scores
- penalties
- selected tracks
- scheduling decisions

Debug output should never affect playback.

---

# Output Generation

The Output module converts

Track Array

into

Engine Output.

Responsibilities include

- metadata
- chunk generation
- debug attachment
- version information

---

# Engine Output

Current output

```json
{
    "engine_version": 5,
    "mode": "...",
    "count": 0,
    "chunk_count": 0,
    "tracks": [],
    "debug": null
}
```

Additional chunk fields

```json
chunk_1
chunk_2
chunk_3
...
```

are generated automatically.

---

# Engine Contract

The Engine guarantees

✔ identical output structure

✔ identical metadata

✔ identical chunk format

regardless of shuffle mode.

This contract should remain backwards compatible.

---

# Future Shuffle Modes

The architecture intentionally supports additional algorithms.

Examples

```
Mood Shuffle

Genre Shuffle

BPM Shuffle

Energy Shuffle

Release Year Shuffle

Discovery Shuffle

Live Performance Shuffle
```

Each new mode should

- implement its own module
- register itself in the Engine
- expose itself in Settings
- update documentation

Nothing else should change.

---

# Future Engine Features

Possible future improvements include

- shuffle presets
- hybrid algorithms
- statistics
- learning algorithms
- plugin modules
- performance profiling
- benchmark mode

The architecture has been designed with these extensions in mind.

---

# Best Practices

✔ Keep algorithms independent.

✔ Never duplicate helper functions.

✔ Never modify Output.

✔ Never bypass Validation.

✔ Keep scoring deterministic.

✔ Keep modules focused.

✔ Preserve the Engine Contract.

---

# Version History

| Version | Milestone |
|----------|-----------|
| v1 | Initial Shuffle Engine |
| v2 | Artist Shuffle |
| v3 | Album Shuffle |
| v4 | Balanced Shuffle |
| v5 | Modular Engine Architecture |

Future versions should extend functionality without breaking compatibility.

---

# Next Step

Continue with

```
docs/08_Development.md
```

to learn how to extend Spotify True Shuffle and contribute new features.
