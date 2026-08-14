# Development Guide

> Audience: Developers / Advanced Users

This document defines the development principles and workflow used by Spotify True Shuffle.

The goal is to allow the project to evolve without losing:

- modularity
- compatibility
- maintainability
- predictable behavior
- user data
- installation reliability

Implementation details may change over time.

The architectural principles and component contracts should remain stable unless there is a deliberate reason to change them.

---

# Development Philosophy

Spotify True Shuffle is designed as a modular system.

New functionality should preferably extend existing systems instead of duplicating or restructuring them.

Whenever practical, development should follow the Open/Closed Principle:

> Existing components should remain stable while new functionality is added through extension.

Examples:

```text
New shuffle mode
→ add a Scriptable module

New shared algorithm behavior
→ extend Common

New Spotify request
→ use Spotify API

New persistent setting
→ extend configuration

New distributable component
→ register it in manifest.json
```

The goal is not to avoid modifying existing code at all costs.

The goal is to avoid unnecessary coupling and unrelated changes.

---

# Core Principles

## Single Responsibility

Each runtime component should have one clear responsibility.

Examples:

```text
Spotify Playlist Loader
→ loads playlists

Spotify Playlist Writer
→ writes playlists

Spotify API
→ communicates with Spotify

Spotify Shuffle Engine
→ bridges Shortcuts and Scriptable

Shuffle modules
→ calculate playback order
```

The installer is an intentional exception.

It combines installation responsibilities so the user only needs one bootstrap workflow.

---

## Separation of Concerns

Apple Shortcuts and Scriptable intentionally solve different problems.

### Apple Shortcuts

Owns:

- user interaction
- Spotify communication
- authentication
- configuration access
- persistent storage
- orchestration
- playback
- installation

### Scriptable

Owns:

- normalization
- algorithms
- scoring
- validation
- engine output generation

Responsibilities should not cross these boundaries without a clear architectural reason.

---

## Configuration Driven

User-specific values belong in configuration or local data.

Examples:

```text
Spotify Client ID
Redirect URI
cache playlist ID
saved playlists
shuffle mode
debug settings
```

Distributed code must not contain user-specific values.

Algorithm defaults belong in:

```text
config/config.example.json
```

---

## Reusability

If the same behavior is required in multiple places, consider moving it into a shared component.

Avoid copy-and-paste implementations that can drift apart.

Examples include:

```text
Spotify API
Spotify API Result Check
Spotify Load Config
Spotify Save Config
Spotify Shuffle Common.js
```

---

## Stable Contracts

Internal implementations may change more frequently than interfaces.

Whenever possible, preserve:

- Shortcut input contracts
- Shortcut output contracts
- normalized track format
- engine input contract
- engine output contract
- configuration compatibility
- manifest component IDs

A change that preserves a contract should normally remain local to the component being changed.

---

## User Data Preservation

Development, installation and updates must treat local user data separately from project components.

Persistent user state includes:

```text
config.json
playlists.json
tokens.json
```

These files must not be replaced simply because new project files are being installed.

Configuration schema changes require deliberate migration behavior.

---

# Spotify Web API Development Rules

Spotify True Shuffle follows Spotify's official Web API development guidance.

Development must:

- use Spotify's OpenAPI specification as the source of truth for endpoint paths, parameters and response schemas
- use Authorization Code with PKCE for user-specific access
- never expose a Client Secret in client-side code
- use valid HTTPS redirect URIs
- request only the minimum required scopes
- refresh access tokens when required
- require authentication again when authorization can no longer be refreshed
- respect HTTP `429` responses and the `Retry-After` header
- avoid deprecated endpoints
- preserve meaningful Spotify API errors
- comply with Spotify's Developer Terms

Spotify endpoint paths and response fields should not be implemented from memory when the official specification is available.

Official references:

- Spotify Web API OpenAPI specification
- Authorization Code with PKCE documentation
- Redirect URI requirements
- Spotify scope documentation
- token refresh documentation
- Spotify Developer Terms

---

# Spotify API Architecture Rule

Spotify API requests belong in:

```text
Spotify API
```

Feature components should supply:

```text
method
endpoint
body
```

as required.

They should not duplicate:

- Authorization headers
- token expiration checks
- token refresh logic
- generic HTTP handling

This keeps Spotify transport behavior centralized.

---

# Engine Contracts

Several contracts should be treated as stable.

## Input Contract

Conceptually:

```json
{
  "config": {},
  "tracks": []
}
```

---

## Normalized Track Contract

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

Shuffle algorithms should operate on this normalized structure rather than raw Spotify responses.

---

## Output Contract

Conceptually:

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

Additional:

```text
chunk_1
chunk_2
...
```

fields may be generated as required.

The Playlist Writer depends on this contract.

---

## Configuration Contract

Configuration should remain backwards compatible whenever practical.

If a breaking schema change is unavoidable:

1. increase `config_version`
2. define migration behavior
3. preserve existing user values where possible
4. test existing installations
5. update the relevant documentation

Do not solve configuration changes by replacing the user's complete `config.json` with the latest template.

---

# Manifest

Distribution metadata is centralized in:

```text
manifest.json
```

The manifest is the source of truth for distributable project components.

It currently contains:

```text
project
installer
shortcuts
scriptable_modules
configuration
```

---

# Manifest Rules

## Do Not Duplicate Distribution Metadata

If information belongs in the manifest, installer logic and web pages should read it from the manifest instead of maintaining their own copy.

Examples:

```text
Shortcut iCloud URL
→ manifest

Scriptable download URL
→ manifest

component version
→ manifest

configuration template URL
→ manifest
```

This reduces the number of locations that must be changed during a release.

---

## Stable Component IDs

Manifest component IDs should remain stable after public distribution.

Example:

```text
spotify_playlist_loader
shuffle_artist
```

Display names and implementations may evolve, but IDs are intended to provide stable machine-readable identity.

Changing an ID should be treated as a compatibility change.

---

## Component Names

Apple Shortcut names currently have additional significance because they are used for:

- installer detection
- `Run Shortcut` actions
- project organization

Renaming a distributed Shortcut therefore requires more care than changing its manifest display metadata.

---

# Versioning

Spotify True Shuffle uses multiple independent version layers.

They should not be treated as one global version number.

---

## Project Version

Stored in:

```text
manifest.json
→ project.version
```

Example:

```text
0.9.0
```

The project version identifies a complete Spotify True Shuffle release.

---

## Installer Version

Stored separately in:

```text
manifest.json
→ installer.version
```

Example:

```text
0.4.0
```

The installer can evolve independently from the main runtime.

An installer bug fix therefore does not necessarily require changing every runtime component version.

---

## Shortcut Versions

Each distributed Shortcut has its own version.

Example:

```json
{
  "id": "spotify_api",
  "version": "1.0.0"
}
```

Only components that actually change should normally require a new component version.

---

## Scriptable Module Versions

Each Scriptable module also has an independent version in the manifest.

Example:

```json
{
  "id": "shuffle_artist",
  "version": "1.0.0"
}
```

The engine entry point additionally exposes:

```text
engine_version
```

for its runtime contract.

---

## Configuration Version

```text
config_version
```

identifies the configuration schema.

It should only change when the configuration schema requires migration or compatibility handling.

A new project release does not automatically require a new configuration version.

---

# Semantic Versioning

Where semantic versioning is used:

```text
MAJOR.MINOR.PATCH
```

## Major

Use for breaking compatibility changes.

Examples:

- incompatible engine contract
- major architecture change
- incompatible public component contract

---

## Minor

Use for backwards-compatible functionality.

Examples:

- new shuffle mode
- new optional setting
- new module
- meaningful installer functionality

---

## Patch

Use for backwards-compatible fixes.

Examples:

- algorithm bug fix
- documentation correction
- installer bug fix
- API handling fix

Component versions and project versions do not have to move together.

---

# Development Workflow

A normal change should follow a predictable sequence.

```text
Define Change
     │
     ▼
Identify Owning Component
     │
     ▼
Implement
     │
     ▼
Test Component
     │
     ▼
Test Dependencies
     │
     ▼
Update Manifest if Required
     │
     ▼
Update Relevant Documentation
     │
     ▼
Update Changelog
```

The scope of testing and documentation should match the scope of the change.

---

# Change Classification

Before modifying the project, identify the type of change.

## Internal Implementation Change

Examples:

- improve Artist scoring
- optimize a helper
- clean up Shortcut actions

Expected impact:

```text
owning component
tests
possibly algorithm documentation
```

No broad documentation rewrite should be required.

---

## Contract Change

Examples:

- change engine output
- change Shortcut input
- change normalized track structure

Expected impact:

```text
component
all callers
tests
architecture documentation
component documentation
changelog
```

Contract changes require broader regression testing.

---

## Distribution Change

Examples:

- add a Scriptable module
- add a Shortcut
- change an iCloud URL
- change installer behavior

Expected impact may include:

```text
manifest.json
installer
install.html
relevant documentation
changelog
```

---

## Configuration Change

Examples:

- new setting
- changed default
- new mode parameters

Expected impact may include:

```text
config.example.json
owning component
Spotify Settings
configuration documentation
```

A migration is only required when existing configurations cannot continue safely without modification.

---

# Adding a Shuffle Mode

Adding a new shuffle mode should normally follow this workflow.

## Step 1 — Define the Mode

Define:

- purpose
- selection behavior
- required metadata
- required configuration
- debug requirements

Avoid implementing the mode before its responsibility is clear.

---

## Step 2 — Create the Scriptable Module

Example:

```text
Spotify Shuffle Mood.js
```

The module should primarily calculate track order or mode-specific scoring.

It should not:

- access Spotify
- write files
- control playback
- generate final Writer output

---

## Step 3 — Add Configuration

If required, use a mode-specific prefix.

Example:

```text
mood_*
```

Add defaults to:

```text
config/config.example.json
```

---

## Step 4 — Register the Mode

Register the new module in:

```text
Spotify Shuffle Engine v5.js
```

and add the new mode to dispatch logic.

---

## Step 5 — Register Distribution Metadata

Add the module to:

```text
manifest.json
```

with:

- stable ID
- filename
- version
- required state
- download URL

---

## Step 6 — Expose the Mode

If intended for normal users, expose it through:

```text
Spotify Settings
```

---

## Step 7 — Test

Test:

- the new mode independently
- engine validation
- output contract
- Playlist Writer compatibility
- existing Random mode
- existing Artist mode
- existing Album mode
- existing Balanced mode

Adding one mode must not break existing modes.

---

## Step 8 — Document

Normally update only:

```text
04_Configuration.md
06_Scriptable.md
07_Shuffle_Engine.md
08_Development.md only if development architecture changed
11_Roadmap.md if appropriate
CHANGELOG.md
```

Do not rewrite unrelated installation or architecture documentation unless the new mode actually affects those systems.

---

# Adding a Shortcut

When adding a distributed Shortcut:

1. define its responsibility
2. define input/output contracts
3. implement it
4. test it independently
5. test all callers
6. create its official iCloud share link
7. add it to `manifest.json`
8. assign a stable component ID
9. assign a component version
10. assign an installation order
11. test installer detection
12. test `install.html`
13. update relevant documentation
14. update the changelog

The existing installer infrastructure should distribute new Shortcut components without requiring another installer mechanism.

---

# Adding a Scriptable Module

When adding a Scriptable module:

1. create the module in `scriptable/`
2. follow the existing naming convention
3. define its responsibility
4. define its dependencies
5. test it
6. add it to `manifest.json`
7. verify the raw GitHub download URL
8. test installer staging
9. test production deployment
10. update relevant documentation
11. update the changelog

Do not hardcode a second Scriptable module list into the installer.

---

# Coding Guidelines

## Keep Functions Focused

Large functions should be split into helpers when doing so improves readability or reuse.

Avoid splitting functions purely to reduce line count.

---

## Avoid Duplicate Logic

If behavior is genuinely shared, move it into the appropriate shared component.

For Scriptable algorithms this will often be:

```text
Spotify Shuffle Common.js
```

---

## Keep Modules Independent

Modules should communicate through explicit interfaces.

Avoid hidden dependencies.

A mode module should not depend on unrelated runtime state.

---

## Validate at the Correct Boundary

Common structural validation belongs in:

```text
Spotify Shuffle Validation.js
```

Mode-specific validation may remain with the component that owns the corresponding behavior.

Validation should occur as close as practical to the boundary where invalid data enters.

---

## Generate Engine Output Centrally

Final engine output should be generated through:

```text
Spotify Shuffle Output.js
```

Individual modes should not invent their own external output structures.

---

## Comment Decisions

Comments should primarily explain:

```text
why
```

rather than restating:

```text
what
```

Bad:

```javascript
// Increase index
index++;
```

Better:

```javascript
// Keep at least one candidate available
// even for heavily duplicated artists.
```

---

# Installer Development

The installer is an intentional exception to the normal small-Shortcut philosophy.

Its goal is:

> one bootstrap Shortcut with as little manual user coordination as iOS allows.

Do not split installer behavior into several installer Shortcuts solely to reduce its size.

That would move complexity from the implementation to the user.

---

# Installer Safety

Changes to the installer require special care because it can modify production Scriptable files.

The deployment order should preserve the current safety model:

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

Production files should not be replaced before staging and validation succeed.

Existing user configuration should remain separate from Scriptable deployment.

---

# install.html Development

`install.html` is a thin distribution interface.

It should not maintain its own independent Shortcut catalog.

Instead it should:

1. receive missing component IDs
2. load `manifest.json`
3. match the IDs
4. display the corresponding components
5. use the iCloud URLs from the manifest

The installer remains responsible for determining whether a Shortcut is actually installed.

Opening an iCloud URL is not proof of successful installation.

---

# Testing

Testing effort should be proportional to the change.

Not every small change requires a complete installation test.

---

## Runtime Release Test

Before a significant release, verify:

- Spotify Login
- Spotify Login Callback
- Token Refresh
- Spotify API
- Playlist Loader
- track flattening
- Shuffle Engine
- Playlist Writer
- playback
- Settings
- configuration loading/saving
- playlist library loading/saving

---

## Shuffle Tests

Every affected shuffle mode should be tested with appropriate cases such as:

- small playlists
- large playlists
- duplicate artists
- duplicate albums
- mixed artists
- repeated tracks
- edge cases

---

## Regression Testing

Algorithm changes should verify that unaffected modes continue to work.

Current modes:

```text
random
artist
album
balanced
```

The amount of regression testing should depend on shared dependencies.

For example:

```text
Artist.js-only change
→ primarily Artist regression

Common.js change
→ all dependent modes

Output.js change
→ all modes + Playlist Writer

Engine contract change
→ complete runtime regression
```

---

# Installer Tests

Installer changes should be tested separately from runtime changes.

Important scenarios include:

- fresh installation
- existing Scriptable modules
- missing Scriptable modules
- missing Apple Shortcuts
- complete Shortcut installation
- existing configuration
- missing configuration
- existing authentication
- missing authentication
- staging failure
- backup behavior
- repeated installer execution

The installer should remain safe to rerun.

---

# Release Preparation

Before creating a project release:

1. finish implementation
2. complete relevant testing
3. update changed component versions
4. update project version if appropriate
5. update installer version if appropriate
6. verify manifest URLs
7. verify Shortcut iCloud links
8. verify Scriptable raw download URLs
9. verify configuration template URLs
10. update relevant documentation
11. update `CHANGELOG.md`
12. verify release notes metadata
13. perform the required end-to-end test

Only changed components should require new component versions.

---

# Manifest Validation Before Release

Before release, verify that every required Shortcut has:

```text
id
name
version
required
install_order
icloud_url
```

and every Scriptable module has:

```text
id
filename
version
required
download_url
```

Placeholder values such as:

```text
SHORTCUT_ID
```

must not remain in a public release manifest.

All URLs should be tested directly.

---

# Documentation Strategy

Documentation is part of the project, but documentation maintenance should remain proportional to the change.

The previous rule:

> Every significant change should update all documentation.

is intentionally avoided.

Instead:

> Every significant change should update the documentation it actually affects.

---

## Documentation by Change Type

Examples:

```text
Artist algorithm tuning
→ 07_Shuffle_Engine.md if behavior meaningfully changes
→ CHANGELOG.md

New configuration value
→ 04_Configuration.md
→ owning component documentation
→ CHANGELOG.md

New Scriptable module
→ 06_Scriptable.md
→ manifest
→ CHANGELOG.md

New Shortcut
→ 05_Shortcuts.md
→ manifest
→ installation docs only if user setup changes

Installer behavior change
→ 01_Installation.md if user-facing
→ 08_Development.md if development behavior changes
→ 09/10 only when relevant

Internal refactoring
→ usually no user documentation change
```

---

# Documentation Milestones

A complete documentation review is appropriate after major milestones such as:

- major architecture changes
- first public release
- major installer redesign
- engine contract changes
- major configuration migration

Routine feature development should use targeted updates instead.

This keeps documentation accurate without turning every implementation change into a full documentation rewrite.

---

# Changelog Strategy

`CHANGELOG.md` should be updated continuously enough that release history does not need to be reconstructed later.

Changes worth recording include:

- new functionality
- behavior changes
- important bug fixes
- compatibility changes
- installation changes
- configuration migrations

Minor documentation corrections or internal refactoring do not necessarily require individual changelog entries.

---

# Performance

Shuffle quality has higher priority than micro-optimization.

However, avoid unnecessary:

- repeated normalization
- repeated sorting
- large intermediate structures
- recursion where iteration is clearer and safer
- duplicated computation

Optimization should be based on an observed problem rather than speculative complexity.

---

# Future Development

The architecture is intended to support additions such as:

- additional shuffle modes
- configurable presets
- component update detection
- automatic update workflows
- configuration migrations
- integrity verification
- rollback support
- statistics
- benchmarking
- performance profiling
- unit testing
- automated regression testing

New infrastructure should solve an actual project need rather than being added solely because the architecture could support it.

---

# Contributing

When contributing:

- keep runtime components focused
- preserve existing contracts where practical
- respect component ownership
- avoid duplicate sources of truth
- preserve user data
- use the manifest for distribution metadata
- test affected functionality
- update affected documentation
- update the changelog when appropriate

The goal is to improve Spotify True Shuffle without increasing complexity unnecessarily.

---

# Next Step

Continue with:

```text
docs/09_Troubleshooting.md
```

for common problems, diagnostics and recovery procedures.
