# Known Issues

> Audience: End Users / Developers / Advanced Users

This document describes currently known limitations and unresolved behavior in Spotify True Shuffle.

Not every unexpected result is caused by the project itself.

Some limitations originate from:

* Spotify playback behavior
* Spotify client synchronization
* Apple Shortcuts
* Scriptable
* the current Spotify True Shuffle architecture

For troubleshooting steps, see:

```text
docs/09_Troubleshooting.md
```

Future features and planned improvements belong in:

```text
docs/11_Roadmap.md
```

---

# Issue Severity

The following labels are used throughout this document.

## Low

The issue may be visible but normally does not prevent Spotify True Shuffle from working.

## Medium

The issue may require user intervention or another run.

## High

The issue may prevent an installation or shuffle from completing successfully.

---

# Spotify Playback Context May Lag Behind Playlist Updates

## Severity

```text
Low
```

## Description

After Spotify True Shuffle replaces the contents of the cache playlist, Spotify may occasionally begin playback using an older cached playback context.

Observed behavior can include:

* the first track from the previous cache state plays briefly
* playback then continues with the newly generated order
* the current playlist contents are correct even though playback initially reflects an older state

This behavior has not been consistently reproducible.

---

## Current Status

The cache playlist itself can already contain the correct newly generated contents while Spotify playback still references an older context.

The project therefore treats this primarily as a Spotify synchronization issue rather than a Playlist Writer failure.

---

## Workaround

Usually no action is required.

If playback remains stale:

1. switch to another Spotify playlist
2. return to the cache playlist
3. restart playback if necessary

In normal testing, subsequent runs may work without any intervention.

---

# Spotify Playlist View May Not Refresh Immediately

## Severity

```text
Low
```

## Description

After a playlist is modified through the Spotify Web API, the Spotify client may continue showing an older version of the playlist.

The API can already return the updated playlist contents while the graphical Spotify client still displays stale information.

---

## Current Status

This is considered Spotify client synchronization behavior.

It does not necessarily indicate that Playlist Writer failed.

---

## Workaround

Refresh the playlist view or:

1. open another playlist
2. return to the cache playlist

The updated contents should then become visible.

---

# Spotify Connect Playback Behavior Can Vary by Device

## Severity

```text
Low
```

## Description

Spotify True Shuffle controls playback through Spotify's active playback context.

Behavior may vary depending on the active Spotify Connect device.

Examples may include differences between:

* the iPhone running the Shortcut
* CarPlay
* another Spotify Connect device
* desktop or speaker playback

---

## Current Status

Spotify controls parts of playback synchronization internally.

The project cannot guarantee identical timing or context-refresh behavior on every Connect device.

---

# Cache Playlist Is Required

## Severity

```text
Framework Limitation
```

## Description

Spotify True Shuffle currently requires a dedicated Spotify playlist as its playback target.

Every generated shuffle replaces the contents of this cache playlist.

---

## Reason

The cache playlist provides a reliable way to:

* preserve the generated track order
* support large playlists
* hand playback back to Spotify
* avoid modifying the user's original playlist

Other playback approaches were tested during development but were less predictable.

---

## User Impact

Users must create and maintain one dedicated Spotify playlist for Spotify True Shuffle.

The playlist should not be used as a normal manually managed playlist.

---

# Cache Playlist Playback May Briefly Use Previous Contents

## Severity

```text
Low
```

## Description

This is the user-visible consequence of the Spotify playback-context issue described earlier.

Even after a successful new shuffle, Spotify may briefly use the previously loaded cache playlist context.

In observed cases, playback usually corrects itself or uses the new playlist state on a subsequent run.

---

## Current Decision

Spotify True Shuffle continues using one cache playlist.

Creating a new cache playlist for every shuffle or alternating between multiple cache playlists would increase complexity and has not been justified by the current frequency of the issue.

This decision may be revisited if the behavior becomes more frequent or reproducible.

---

# Apple Shortcuts Cannot Be Installed Silently

## Severity

```text
Platform Limitation
```

## Description

Apple does not provide a supported mechanism for one Shortcut to silently install multiple shared Apple Shortcuts.

Spotify True Shuffle therefore cannot fully automate installation of all Shortcut components.

---

## Current Solution

The installer:

1. detects missing project Shortcuts
2. collects their manifest IDs
3. opens `install.html`
4. displays only the missing components
5. lets the user install them through official iCloud Shortcut links
6. verifies installation when the installer is run again

---

## User Impact

Initial installation requires a manual iCloud import step.

After the required components are installed, normal runtime use does not require this process.

---

# Installer Requires Multiple Runs During Fresh Installation

## Severity

```text
Low
```

## Description

A completely fresh installation may require the Spotify True Shuffle Installer to be started more than once.

This occurs because parts of setup leave the running Shortcut and move into:

* Safari
* Apple's Shortcut import interface
* Spotify authentication

The original installer execution cannot always reliably resume afterwards.

---

## Typical Flow

Conceptually:

```text
Installer
   │
   ▼
Install missing Shortcuts
   │
   ▼
Run Installer again
   │
   ▼
Configuration / Login
   │
   ▼
Run Installer again if required
   │
   ▼
Complete
```

---

## Current Status

This behavior is intentional within the current platform limitations.

The installer detects existing progress rather than requiring the user to repeat configuration from scratch.

---

# Shortcut Names Must Remain Unchanged

## Severity

```text
Medium
```

## Description

Spotify True Shuffle currently relies on exact Apple Shortcut names for:

* component discovery
* inter-Shortcut calls
* installer verification

A renamed component may therefore be interpreted as missing.

For example:

```text
Spotify Settings
```

is valid.

These are not:

```text
Spotify Setti
Spotify Settings 2
```

---

## Workaround

Do not rename distributed Spotify True Shuffle component Shortcuts.

If a component was renamed, restore its official name or reinstall it from the official installation page.

---

## Future Direction

The project already uses stable manifest IDs for distribution metadata.

Future tooling may reduce reliance on human-readable Shortcut names where Apple Shortcuts allows it.

---

# Scriptable Is Required

## Severity

```text
Framework Limitation
```

## Description

Spotify True Shuffle requires Scriptable for the shuffle engine and JavaScript modules.

---

## Reason

Advanced shuffle logic is significantly easier to maintain and extend in JavaScript than directly inside Apple Shortcuts.

Scriptable provides:

* modular JavaScript files
* reusable helpers
* clearer algorithm implementation
* better separation from Shortcut orchestration

---

## User Impact

Scriptable must be installed and its iCloud storage initialized before Spotify True Shuffle can operate.

---

# Scriptable Staging Files May Appear as Text Files

## Severity

```text
Low
```

## Description

Files downloaded into:

```text
Spotify True Shuffle/Test/
```

may internally appear to the Files app as text files.

For example, a staged file visually named:

```text
Spotify Shuffle Artist.js
```

may expose metadata suggesting an underlying `.txt` type.

---

## Current Status

The production files installed into Scriptable are correctly created as:

```text
*.js
```

and the installer can still retrieve the expected `.js` filename from staged files.

The behavior therefore currently affects only staging metadata.

---

## User Impact

None during normal operation.

The staging directory is installer working storage and should not be used as the production Scriptable source.

---

# No Automatic Rollback

## Severity

```text
Medium
```

## Description

Before replacing existing Scriptable modules, the installer creates a timestamped backup.

However, if production deployment fails partway through, the installer does not currently restore the previous modules automatically.

---

## Current Safety Mechanism

Deployment follows:

```text
Download
   │
   ▼
Stage
   │
   ▼
Validate
   │
   ▼
Backup
   │
   ▼
Deploy
```

Existing modules are therefore backed up before production replacement begins.

---

## Recovery

Backups are stored under:

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Backup/
        └── <timestamp>/
```

If required, the previous Scriptable files can be restored manually.

See:

```text
docs/09_Troubleshooting.md
```

---

# No Automatic Update Manager Yet

## Severity

```text
Framework Limitation
```

## Description

The project already has the metadata required for future update handling:

* project version
* installer version
* Shortcut versions
* Scriptable module versions
* manifest component IDs

However, Spotify True Shuffle does not yet provide a complete automatic update workflow.

---

## Current Status

The installer reads the current remote manifest and can deploy the current Scriptable modules, but component-level update detection and automated Shortcut updating are not yet implemented.

Release-specific update instructions may therefore still be required.

---

# Apple Shortcut Updates Still Require iCloud Import

## Severity

```text
Platform Limitation
```

## Description

Even when a future update manager detects that an Apple Shortcut component is outdated, Apple still requires user confirmation when importing a shared Shortcut through iCloud.

---

## Impact

A future updater can automate:

* version comparison
* identification of outdated components
* navigation to the correct update links
* post-update verification

but it cannot currently guarantee a completely silent Shortcut update process.

---

# Spotify Web API Rate Limiting

## Severity

```text
External Limitation
```

## Description

Spotify applies rate limits to Web API requests.

Large numbers of requests over a short period may return:

```text
HTTP 429
```

---

## Current Status

Spotify True Shuffle should not retry immediately in a tight loop.

When available, the API's:

```text
Retry-After
```

information should be respected.

---

## User Impact

Normal playlist shuffling should rarely trigger this under typical use.

Development and repeated automated testing are more likely to encounter rate limits.

---

# Spotify Authentication May Require Login Again

## Severity

```text
Low
```

## Description

Spotify True Shuffle automatically refreshes access tokens while the stored authorization remains usable.

There are situations where automatic refresh may no longer work, for example if:

* authorization was revoked
* authentication state became invalid
* Spotify requires new authorization
* relevant authentication configuration changed

---

## Solution

Run:

```text
Spotify Login
```

again.

A fixed lifetime for every refresh token should not be assumed by the project.

---

# Spotify Premium Is Required for Playback Control

## Severity

```text
External Requirement
```

## Description

Spotify True Shuffle relies on Spotify playback functionality that requires an account capable of Web API playback control.

---

## User Impact

The project currently targets Spotify Premium users.

This is an external Spotify limitation rather than something Spotify True Shuffle can bypass.

---

# One Shuffle Strategy Runs Per Invocation

## Severity

```text
Design Limitation
```

## Description

The engine selects one shuffle strategy for each run.

Current modes are:

```text
random
artist
album
balanced
```

---

## Reason

Each mode should have a clear, predictable algorithm.

When multiple concepts need to be combined, they should normally be implemented as a dedicated mode.

`balanced` is the current example: it combines Artist and Album scoring inside one explicit algorithm.

---

# Algorithm Quality Is Heuristic

## Severity

```text
Expected Behavior
```

## Description

Artist, Album and Balanced modes use heuristic scoring and controlled randomness.

They optimize distribution according to their configured rules but do not mathematically guarantee a globally optimal arrangement.

---

## Consequences

Two runs can legitimately produce different results.

A result may also contain unavoidable close repetitions when:

* one artist dominates the playlist
* one album dominates the playlist
* the playlist is very small
* the available track distribution makes ideal spacing impossible

---

## Current Goal

The engine aims for:

> better practical distribution without making the result deterministic.

It does not attempt exhaustive global optimization.

---

# Duplicate Tracks Are Not Automatically Removed

## Severity

```text
Expected Behavior
```

## Description

Spotify True Shuffle shuffles the tracks supplied by the source playlist.

If the same track appears multiple times in the source data, the engine does not automatically treat those occurrences as unwanted duplicates.

---

## Reason

Removing duplicate entries would modify the semantic contents of the user's source playlist rather than only changing order.

The engine is expected to preserve the supplied track collection.

---

# Source Playlist Is Not Modified

## Severity

```text
Intentional Limitation
```

## Description

Spotify True Shuffle never writes the generated order back into the selected source playlist.

---

## Reason

The project deliberately separates:

```text
Source Playlist
```

from:

```text
Cache Playlist
```

This prevents shuffle execution from modifying the user's original playlist.

Users who want a permanently reordered playlist must currently manage that separately.

---

# Cross-Platform Runtime Is Not Supported

## Severity

```text
Framework Limitation
```

## Description

The current implementation depends on:

* Apple Shortcuts
* Scriptable
* iCloud Drive

The runtime is therefore designed for Apple's automation ecosystem.

---

## Current Status

A standalone cross-platform application is not part of the current implementation.

Such a project would represent a different runtime architecture rather than a small extension of the existing Shortcut framework.

---

# Known Issues vs Roadmap

This document should contain only:

* reproducible current problems
* external platform limitations
* current framework limitations
* intentional behavior that may surprise users

Future feature ideas belong in:

```text
docs/11_Roadmap.md
```

Examples that should **not** be maintained here include:

* possible future shuffle modes
* statistics
* presets
* benchmarking
* plugin ideas

Keeping roadmap material separate prevents unresolved bugs from being mixed with speculative development ideas.

---

# Reporting a New Known Issue

A behavior should normally be added here when:

* it is reproducible or has been observed repeatedly
* it cannot currently be fully resolved
* users or developers are likely to encounter it again
* documenting it prevents unnecessary troubleshooting

When adding an issue, include where possible:

```text
Description
Severity
Current Status
Workaround
```

Do not add temporary development mistakes that have already been fixed.

Those belong in:

```text
CHANGELOG.md
```

when they are relevant to a release.

---

# Next Step

Continue with:

```text
docs/11_Roadmap.md
```

for planned future development.
