# Roadmap

> Audience: End Users / Developers / Advanced Users

Spotify True Shuffle is evolving from a personal Apple Shortcuts workflow into a maintainable, distributable shuffle framework.

The current architecture is largely established.

Future development should therefore focus on improving the project incrementally rather than redesigning working components without a clear reason.

This roadmap describes direction and priorities.

It is not a promise that every listed feature will be implemented.

---

# Current State

Spotify True Shuffle currently provides:

- modular Apple Shortcuts
- centralized Spotify Web API access
- Authorization Code with PKCE
- automatic access-token refresh
- persistent configuration
- saved playlist management
- Scriptable-based shuffle processing
- Random shuffle
- Artist-aware shuffle
- Album-aware shuffle
- Balanced Artist/Album shuffle
- dedicated cache playlist playback
- manifest-based distribution metadata
- guided Shortcut installation
- staged Scriptable deployment
- Scriptable module backups
- installation documentation
- developer documentation

The current project version remains in the beta phase.

The immediate goal is therefore not to add as many features as possible.

The immediate goal is to turn the existing system into a stable baseline for future development.

---

# Guiding Principles

Future development should:

- preserve modularity
- preserve stable component contracts
- remain configuration-driven
- avoid duplicated logic
- preserve user data
- remain backwards compatible whenever practical
- keep installation simple
- keep normal user interaction simple
- prefer measurable improvements over unnecessary complexity

New functionality should fit the existing architecture whenever possible.

---

# Development Phases

The roadmap is organized into broad development phases rather than fixed release promises.

```text
Current Beta
     │
     ▼
Baseline Stabilization
     │
     ▼
Update Infrastructure
     │
     ▼
Shuffle Expansion
     │
     ▼
Quality & Analysis
     │
     ▼
Long-Term Platform Evolution
```

Individual ideas may move between phases as the project evolves.

---

# Phase 1 — Baseline Stabilization

## Goal

Complete the current beta architecture and establish a reliable baseline.

This phase should be completed before substantial new functionality is introduced.

---

## Complete Distribution Metadata

All distributed Apple Shortcuts must have valid official iCloud links in:

```text
manifest.json
```

Placeholder values must not remain in a release manifest.

The installer itself should also receive its final distribution link when appropriate.

---

## End-to-End Fresh Installation Test

Perform a complete installation as close as possible to a new user environment.

The test should cover:

```text
Installer
   │
   ▼
Directory creation
   │
   ▼
Scriptable installation
   │
   ▼
Shortcut detection
   │
   ▼
install.html
   │
   ▼
Shortcut installation
   │
   ▼
Configuration
   │
   ▼
Spotify Login
   │
   ▼
First successful shuffle
```

The goal is to verify the complete user journey rather than individual components.

---

## Existing Installation Test

The installer should also be tested against an already configured installation.

Important checks include:

- existing configuration remains unchanged
- existing playlist library remains unchanged
- authentication remains usable
- Scriptable backup is created
- Scriptable modules are updated correctly
- installed Shortcuts are detected correctly
- repeated installer execution remains safe

---

## Documentation Completion

Complete the initial documentation set and add missing screenshots where they improve installation or configuration.

Documentation should then move from broad rewrites to targeted maintenance.

---

## Beta Cleanup

Before considering the current baseline stable:

- remove temporary development values
- verify filenames
- verify manifest URLs
- verify iCloud links
- verify repository paths
- verify GitHub Pages
- verify configuration templates
- verify known issues
- verify release metadata

---

# Phase 2 — Update Infrastructure

## Goal

Use the existing manifest architecture to make future releases easier for users to maintain.

The project already has much of the required metadata.

The next step is to use it.

---

# Version Detection

Future update logic should be able to compare installed and remote versions for:

- project
- installer
- Apple Shortcuts
- Scriptable modules
- configuration schema

The manifest should remain the remote source of truth.

---

# Scriptable Updates

Scriptable modules are the easiest components to update automatically because the installer already controls their deployment.

A future update flow could:

```text
Load Remote Manifest
        │
        ▼
Compare Module Versions
        │
        ▼
Update Required?
   │            │
  no           yes
   │            │
   ▼            ▼
Continue      Stage
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

Only modules requiring an update should eventually need replacement.

---

# Shortcut Update Detection

Apple Shortcuts cannot be silently replaced through the current public sharing mechanism.

However, Spotify True Shuffle can still automate most of the update experience.

A future update workflow could:

1. detect outdated Shortcut components
2. collect their manifest IDs
3. open the installation/update page
4. display only affected components
5. provide official iCloud links
6. verify the components afterwards

This can reuse the existing:

```text
manifest.json
+
install.html
```

architecture.

---

# Installed Version State

Component-level update detection will require a reliable way to determine which version is installed locally.

The implementation method is intentionally not fixed yet.

Possible approaches should be evaluated based on:

- reliability
- maintenance cost
- user transparency
- compatibility with Apple Shortcuts
- resistance to renamed or manually modified components

The solution should avoid adding unnecessary runtime complexity.

---

# Configuration Migration

Future configuration schema changes may require migration support.

Conceptually:

```text
Installed Config
      │
      ▼
Read config_version
      │
      ▼
Migration Required?
   │             │
  no            yes
   │             │
   ▼             ▼
Continue      Backup
                 │
                 ▼
              Migrate
                 │
                 ▼
              Validate
```

Migration should preserve existing user settings whenever possible.

Replacing the complete configuration with a new template is not an acceptable migration strategy.

---

# Integrity Verification

The manifest already contains:

```text
sha256
```

fields for Scriptable modules.

These are currently unused.

A future installer version may use checksums to verify downloaded Scriptable modules before production deployment.

This could provide:

- corruption detection
- stronger staging validation
- reproducible release artifacts

Checksum support should only be added when the installation workflow can use it reliably.

---

# Automatic Rollback

The installer already creates backups before Scriptable production deployment.

A future improvement could automatically restore the previous version when deployment fails.

Conceptually:

```text
Backup
   │
   ▼
Deploy
   │
   ▼
Success?
 │     │
yes    no
 │     │
 ▼     ▼
Done  Restore Backup
```

This would extend the current backup system rather than introduce a separate recovery mechanism.

---

# Phase 3 — Shuffle Expansion

## Goal

Return development focus to the core reason Spotify True Shuffle exists:

> generating better and more interesting playback orders.

The existing modular engine should make experimentation possible without redesigning the surrounding application.

---

# New Shuffle Modes

Additional shuffle modes should be explored rather than predetermined.

Potential directions include:

- genre-aware distribution
- release-era or decade distribution
- listening-history-aware shuffle
- discovery-oriented shuffle
- favorites-aware shuffle
- metadata-based sequencing
- hybrid scoring strategies

These are ideas, not committed features.

A mode should only be added when:

- its behavior can be clearly defined
- required Spotify data is realistically available
- it provides a meaningful difference from existing modes
- it fits the engine architecture
- its result can be evaluated

---

# Spotify Metadata Constraints

Some potential shuffle ideas depend on metadata that may not be directly available through the current Spotify Web API workflow.

Before implementing a mode, verify:

```text
Required Data
     │
     ▼
Available through Spotify?
     │
     ├── yes → evaluate implementation
     │
     └── no  → reconsider the mode
```

The project should not design algorithms around assumed Spotify fields.

---

# Existing Mode Improvements

New modes are not the only path to better shuffle quality.

Existing modes may continue to improve:

```text
Artist
Album
Balanced
```

Possible improvements include:

- scoring refinements
- better candidate selection
- improved behavior for highly uneven playlists
- better handling of unavoidable repetitions
- more useful debug information

Algorithm changes should be evaluated against actual playlist behavior rather than only theoretical improvements.

---

# Balanced Mode Evolution

Balanced is currently the most general intelligent shuffle mode.

It may become a foundation for future multi-factor algorithms.

Future development could explore additional scoring dimensions while preserving the principle that each mode should remain understandable.

Balanced should not become an uncontrolled collection of every available metric.

---

# Shuffle Presets

A future preset system could allow users to save combinations of mode and configuration.

Examples might include:

```text
Driving
Relax
Party
Focus
```

A preset could eventually contain:

```text
shuffle mode
mode parameters
weights
randomness
```

Presets should be considered only after the underlying modes and configuration model are sufficiently stable.

---

# Phase 4 — Quality and Analysis

## Goal

Make shuffle development easier to evaluate objectively.

---

# Shuffle Statistics

Possible diagnostic statistics include:

- artist spacing
- album spacing
- repetition distance
- distribution variance
- unavoidable conflicts
- candidate-selection behavior

Statistics should primarily help development rather than clutter the normal user experience.

---

# Benchmark Framework

A future benchmark framework could compare shuffle algorithms using known test playlists.

Potential metrics include:

- execution time
- artist spacing
- album spacing
- repetition frequency
- distribution fairness
- variation between runs

The purpose would not be to produce one universal "shuffle score".

Different modes optimize different goals.

---

# Regression Test Playlists

A reusable test set could include playlists designed to stress specific behaviors.

Examples:

```text
Balanced distribution
One dominant artist
One dominant album
Many single-track artists
Very small playlist
Very large playlist
Duplicate tracks
Extreme frequency imbalance
```

This would make algorithm changes easier to compare across releases.

---

# Automated Engine Verification

Because the Scriptable engine has structured input and output contracts, future tooling could automate checks such as:

- every input track is preserved
- no unexpected track is introduced
- output count matches input count
- chunk generation is valid
- supported modes complete successfully
- invalid input fails correctly

This would reduce manual regression testing.

---

# Performance Profiling

Performance optimization should remain evidence-driven.

Potential areas include:

- candidate scoring
- repeated sorting
- normalization
- large playlist handling
- debug generation

Optimization should not make the algorithms harder to understand unless there is a measurable benefit.

---

# Phase 5 — User Experience Improvements

## Goal

Improve normal use without moving algorithm complexity into the user interface.

Potential areas include:

- easier initial setup
- clearer update notifications
- better error presentation
- configuration presets
- improved Settings organization
- optional diagnostics
- clearer installation progress

The project should continue to prefer:

> sensible defaults over mandatory configuration.

Advanced tuning should remain optional.

---

# Installation Experience

The current installer already reduces setup to one bootstrap Shortcut plus the manual steps required by Apple.

Future improvements should focus on reducing uncertainty rather than adding more installer components.

Examples include:

- clearer progress information
- better resume behavior
- update detection
- automatic rollback
- stronger validation

---

# Documentation

The documentation should evolve with the project without becoming a maintenance burden.

Future improvements may include:

- screenshots
- diagrams
- worked examples
- contribution examples
- release-specific migration guides when required

Documentation should remain split by responsibility rather than accumulating one large universal guide.

---

# Phase 6 — Community and Open Source

## Goal

Make the project understandable and usable by people other than its original developer.

Potential steps include:

- first public beta release
- clearer contribution guidance
- issue templates
- feature request templates
- release notes
- community testing
- public feedback
- external playlist test cases

Community expansion should happen when the project is sufficiently stable to support it.

There is no requirement for Spotify True Shuffle to become a large public project.

The repository should simply be ready if other people find it useful.

---

# Distribution Channels

The primary project source should remain:

```text
GitHub
```

Official Apple Shortcuts should use:

```text
iCloud Shortcut links
```

This provides a direct and recognizable installation path.

Other distribution platforms may be evaluated later if they provide meaningful additional value.

They should not become separate sources of truth for project metadata.

---

# Community Feedback

If Spotify True Shuffle is shared more broadly, community feedback may help identify:

- installation problems
- Spotify API edge cases
- unusual playlist distributions
- algorithm weaknesses
- useful shuffle-mode ideas
- platform-specific behavior

Feature popularity alone should not determine architecture.

Changes should still fit the project's design principles.

---

# Long-Term Runtime Evolution

The current implementation is built around:

```text
Apple Shortcuts
+
Scriptable
+
Spotify Web API
```

This architecture should remain the focus while it continues to serve the project well.

---

# Standalone Application

A native or standalone Spotify True Shuffle application may be explored in the long term.

Potential reasons could include:

- easier distribution
- stronger update control
- richer user interfaces
- more predictable local storage
- better testing
- fewer Apple Shortcuts platform limitations

However, moving to an application would be a major architectural decision.

It should not be pursued simply because an app appears more conventional than Shortcuts.

Before considering a migration, evaluate:

- which current limitations an app would actually solve
- development and maintenance effort
- Spotify platform requirements
- authentication architecture
- App Store requirements if applicable
- whether the existing Shortcut implementation already meets user needs

The current project can also serve as a prototype and specification for a future application.

---

# Architecture Portability

Even if the runtime changes one day, several current concepts should remain reusable:

```text
Normalized Track Model
Shuffle Algorithms
Configuration Concepts
Manifest / Version Concepts
Engine Contracts
Test Cases
```

Keeping these layers independent reduces the cost of future experimentation.

---

# Ideas Under Exploration

The following ideas are intentionally kept as an unordered exploration list:

- additional shuffle modes
- shuffle presets
- listening-history integration
- smarter cache handling
- richer diagnostics
- statistics
- benchmarks
- automated tests
- integrity verification
- rollback
- component update management
- native application experiments

Presence in this list does not indicate implementation priority.

Ideas should move into a development phase only when they become concrete enough to design and test.

---

# What Is Not a Goal

Spotify True Shuffle does not currently aim to:

- replace the Spotify client
- become a general Spotify management application
- reproduce every Spotify feature
- modify source playlists during normal shuffle execution
- add complexity solely for architectural purity
- implement every possible shuffle metric
- guarantee mathematically optimal playlist ordering

The project should remain focused on improving playlist shuffle behavior.

---

# Roadmap Maintenance

This document should remain directional rather than becoming a detailed task tracker.

Update it when:

- a major roadmap phase is completed
- a planned capability becomes implemented
- priorities materially change
- a significant new development direction is adopted
- an idea is intentionally abandoned

Do not update the roadmap for every bug fix or small implementation change.

Detailed release history belongs in:

```text
CHANGELOG.md
```

Development rules belong in:

```text
docs/08_Development.md
```

Current limitations belong in:

```text
docs/10_Known_Issues.md
```

---

# Near-Term Priority

The current priority is:

```text
1. Complete manifest distribution metadata
2. Perform fresh-install end-to-end testing
3. Perform existing-install/update testing
4. Complete the initial documentation baseline
5. Stabilize the current beta
6. Design the first update/version-detection workflow
7. Return to shuffle-engine experimentation
```

Once the current baseline is stable, development can shift from infrastructure back toward new shuffle behavior.

---

# Long-Term Vision

Spotify True Shuffle should remain:

- modular
- understandable
- extensible
- safe to update
- easy to install
- enjoyable to experiment with

The project began as a way to produce a better shuffle.

Its architecture should support future ideas without allowing the infrastructure to become more important than that original purpose.
