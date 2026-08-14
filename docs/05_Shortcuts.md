# Apple Shortcuts

> Audience: Developers / Advanced Users

Spotify True Shuffle uses multiple Apple Shortcuts as modular application components.

Each runtime Shortcut has a focused responsibility and communicates with other components through defined inputs and outputs.

This improves:

- maintainability
- readability
- debugging
- testing
- extensibility

The main exception is the installer. It intentionally combines several installation responsibilities so users only need one bootstrap Shortcut.

---

# Shortcut Overview

The current runtime consists of the following Apple Shortcuts:

| Shortcut | Responsibility |
|---|---|
| `Spotify True Shuffle` | Main user-facing workflow |
| `Spotify Shuffle Engine` | Bridge between Shortcuts and Scriptable |
| `Spotify Playlist Loader` | Loads and normalizes Spotify playlists |
| `Spotify Playlist Writer` | Writes generated track orders to the cache playlist |
| `Spotify API` | Central Spotify Web API communication |
| `Spotify API Result Check` | Common API result validation |
| `Spotify Login` | Starts PKCE authentication |
| `Spotify Login Callback` | Completes authentication and stores tokens |
| `Spotify Refresh Token` | Refreshes expired access tokens |
| `Spotify Settings` | User-facing configuration interface |
| `Spotify Load Config` | Reads `config.json` |
| `Spotify Save Config` | Writes `config.json` |
| `Spotify Load Playlists` | Reads `playlists.json` |
| `Spotify Save Playlists` | Writes `playlists.json` |

Installation is handled separately by:

```text
Spotify True Shuffle Installer
```

The installer is project infrastructure and is not part of the normal shuffle runtime.

---

# Runtime Call Graph

A normal shuffle follows approximately this path:

```text
Spotify True Shuffle
        │
        ├── Spotify Load Config
        ├── Spotify Load Playlists
        │
        ▼
Spotify Playlist Loader
        │
        ├── Spotify API
        │       │
        │       └── Spotify Refresh Token
        │
        ├── Spotify API Result Check
        │
        ▼
Spotify Flatten Track Lists.js
        │
        ▼
Spotify Shuffle Engine
        │
        ▼
Spotify Shuffle Engine v5.js
        │
        ▼
Spotify Playlist Writer
        │
        ├── Spotify Load Config
        ├── Spotify API
        └── Spotify API Result Check
        │
        ▼
Spotify Playback
```

Authentication and configuration workflows exist alongside this runtime path but are only invoked when required.

---

# Spotify True Shuffle

## Purpose

Main user-facing entry point.

It coordinates the complete shuffle workflow without implementing the specialized behavior of its child components.

---

## Responsibilities

- load configuration
- load the saved playlist library
- present playlist selection
- execute the Playlist Loader
- build the shuffle-engine input
- execute the Shuffle Engine
- execute the Playlist Writer
- disable Spotify's native shuffle
- start playback

---

## Input

None during normal interactive use.

---

## Output

Successful execution results in playback of the generated order from the configured cache playlist.

---

## Dependencies

- `Spotify Load Config`
- `Spotify Load Playlists`
- `Spotify Playlist Loader`
- `Spotify Shuffle Engine`
- `Spotify Playlist Writer`
- Spotify playback API functionality

---

## Error Handling

The main workflow must stop when an underlying component reports a failure.

Playback must only start after the generated playlist has been written successfully.

This prevents stale or partially written cache playlists from being treated as a successful shuffle result.

---

## Design Note

`Spotify True Shuffle` intentionally contains very little specialized logic.

It acts as an orchestrator while playlist loading, shuffle generation, playlist writing, configuration and Spotify communication remain separate components.

---

# Spotify Shuffle Engine

## Purpose

Bridge between Apple Shortcuts and the Scriptable shuffle engine.

---

## Responsibilities

- receive normalized tracks
- receive current configuration
- build Scriptable input
- execute the Scriptable engine
- return the engine output

---

## Input

Conceptually:

```json
{
  "config": {},
  "tracks": []
}
```

---

## Output

The standardized engine output.

The engine contract is documented in:

```text
docs/07_Shuffle_Engine.md
```

---

## Dependencies

Scriptable and the installed shuffle-engine modules.

---

## Design Note

The bridge isolates the main Apple Shortcut workflow from the internal JavaScript implementation.

The Scriptable engine can therefore evolve as long as its external input/output contract remains compatible.

---

# Spotify Playlist Loader

## Purpose

Load the complete contents of a Spotify playlist and prepare them for the shuffle engine.

---

## Responsibilities

- receive a playlist URL or ID
- extract the Spotify playlist ID
- request playlist items
- handle pagination
- validate API responses
- collect playlist pages
- pass the collected data to the flattening module
- return normalized tracks

---

## Input

A Spotify playlist URL or playlist ID.

---

## Spotify Endpoint

Playlist items are loaded through:

```text
/playlists/{playlist_id}/items
```

The deprecated `/tracks` playlist endpoint is not used.

---

## Pagination

Spotify playlists may require multiple requests.

Conceptually:

```text
Request first page
      │
      ▼
Store page
      │
      ▼
More items?
  │       │
 yes      no
  │       │
  ▼       ▼
next    flatten
page     pages
```

The loader collects the API responses before normalization.

Pagination should remain independent from the shuffle algorithms.

---

## Track Normalization

Collected playlist pages are passed to:

```text
Spotify Flatten Track Lists.js
```

The Scriptable module recursively extracts valid Spotify tracks and produces the internal representation used by the engine.

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

---

## Output

Conceptually:

```json
{
  "tracks": [],
  "count": 0
}
```

The calling workflow uses the normalized track list as shuffle-engine input.

---

## Dependencies

- `Spotify API`
- `Spotify API Result Check`
- `Spotify Flatten Track Lists.js`

---

## Error Handling

If a Spotify request fails, the loader must stop instead of continuing pagination with invalid data.

A flattening or validation failure must likewise prevent the shuffle workflow from continuing.

---

## Design Note

The loader knows how to retrieve Spotify playlists.

It does not know how to shuffle them.

---

# Spotify Playlist Writer

## Purpose

Write the generated track order to the configured Spotify cache playlist.

---

## Responsibilities

- load the cache playlist configuration
- receive engine output
- replace the initial cache playlist contents
- append additional chunks
- validate each Spotify API operation
- return a successful completion state only after all chunks are written

---

## Input

Shuffle-engine output.

The output may contain multiple upload chunks.

Conceptually:

```text
chunk_1
chunk_2
chunk_3
...
```

---

## Write Strategy

The first chunk replaces the existing playlist contents.

Conceptually:

```text
chunk_1
   │
   ▼
PUT playlist items
```

Additional chunks are appended:

```text
chunk_2
   │
   ▼
POST playlist items

chunk_3
   │
   ▼
POST playlist items
```

The writer continues until every generated chunk has been processed.

---

## Output

Successful completion returns the writer's success result to the parent workflow.

The exact success value is an implementation contract and should remain stable for callers that depend on it.

---

## Dependencies

- `Spotify Load Config`
- `Spotify API`
- `Spotify API Result Check`

---

## Error Handling

Every API result is checked before the next chunk is processed.

If one write operation fails:

```text
API failure
    │
    ▼
Result Check
    │
    ▼
Writer stops
    │
    ▼
Parent workflow stops
```

The writer must never report success after a partial write failure.

---

# Spotify API

## Purpose

Provide one central access point to the Spotify Web API.

Runtime Shortcuts should not independently implement Spotify HTTP or token handling.

---

## Input

Conceptually:

```json
{
  "method": "GET",
  "endpoint": "/me/player"
}
```

For requests with a body:

```json
{
  "method": "PUT",
  "endpoint": "/me/player/play",
  "body": {}
}
```

The body is optional.

---

## Responsibilities

- load authentication state
- determine whether the access token needs refreshing
- call `Spotify Refresh Token` when required
- reload authentication state after refresh
- construct authenticated Spotify requests
- support required HTTP methods
- attach JSON bodies when supplied
- execute the request
- return the Spotify response or API error result

---

## Supported Request Types

The component supports the HTTP methods required by Spotify True Shuffle, including:

```text
GET
POST
PUT
DELETE
```

Query parameters may be supplied as part of the endpoint where required.

---

## Request Bodies

A request body is attached only when one is provided by the caller.

This allows the same API component to handle both:

```text
GET /me/player
```

and requests requiring structured JSON content.

Callers should pass dictionaries or other appropriate structured values instead of manually constructing JSON strings where possible.

---

## Output

The API returns the result of the Spotify request to the caller.

API errors must also be returned rather than being silently replaced by unrelated Shortcut output.

This allows the calling component to pass the result to:

```text
Spotify API Result Check
```

---

## Dependencies

- `Spotify Load Config`
- `Spotify Refresh Token`
- local `tokens.json`

---

## Design Note

Spotify API is the transport layer.

It should not contain playlist-specific or shuffle-specific business logic.

---

# Spotify API Result Check

## Purpose

Provide a reusable validation step for Spotify API responses.

---

## Responsibilities

- inspect an API result
- detect Spotify/API error results
- surface meaningful failure information
- return a simple success/failure state to the caller

---

## Input

The output returned by:

```text
Spotify API
```

---

## Output

The current calling convention uses success/failure values such as:

```text
API_OK
```

or:

```text
API_ERROR
```

Calling workflows should stop when the result check reports failure.

---

## Why It Exists

Without a shared result check, a failed Spotify request can produce secondary errors later in the workflow.

For example:

```text
Spotify request fails
        │
        ▼
invalid response
        │
        ▼
dictionary conversion fails
        │
        ▼
later API calls still execute
```

The shared check instead allows:

```text
Spotify request fails
        │
        ▼
API Result Check
        │
        ▼
workflow stops
```

This preserves the original failure and avoids misleading follow-up errors.

---

# Spotify Login

## Purpose

Start Spotify authentication.

---

## Responsibilities

- load Spotify authentication configuration
- validate the configured Spotify Client ID
- validate the configured Redirect URI
- URL-encode the Client ID
- open the configured Redirect URI with the Client ID as a query parameter
- initiate the browser-based PKCE flow

Conceptually:

```text
[spotify_redirect_uri]?client_id=[spotify_client_id]
```
The authentication page derives its Redirect URI from its own location and does not contain a hardcoded Client ID.

---

## Input

Normal execution requires no direct user input.

Required values are loaded from configuration.

---

## Dependencies

- `Spotify Load Config`
- project GitHub Pages authentication endpoint
- Spotify Developer application configuration

---

## Design Note

Authentication setup is browser-based.

The Login Shortcut itself remains small and delegates the web portion of the flow to the project's GitHub Pages infrastructure.

---

# Spotify Login Callback

## Purpose

Complete Spotify PKCE authentication after authorization.

---

## Responsibilities

- receive the authorization result
- load the stored PKCE verifier
- exchange the authorization code for tokens
- calculate token expiration information
- create/update `tokens.json`

---

## Output

A successful callback produces the authentication state required by `Spotify API`.

The current workflow may additionally return a success status for user feedback.

---

## Dependencies

- `Spotify Load Config`
- local PKCE verifier
- Spotify token endpoint

---

# Spotify Refresh Token

## Purpose

Refresh an expired or expiring Spotify access token.

---

## Responsibilities

- load the stored refresh token
- request a new access token
- preserve the refresh token when Spotify does not return a replacement
- update token expiration information
- save the updated token state
- return refresh status

---

## Output

Successful refresh:

```text
TOKEN_REFRESHED
```

A failed refresh returns a failure state that allows `Spotify API` to stop instead of retrying with invalid authentication.

---

## Design Note

Only the API layer should normally decide when token refresh is required.

Playlist and playback components should not implement their own token lifecycle logic.

---

# Spotify Settings

## Purpose

Provide the central user-facing configuration interface.

---

## Responsibilities

Current settings include management of:

- Spotify Client ID
- Spotify Redirect URI
- cache playlist
- shuffle mode
- debug options
- saved source playlists

The configuration template provides advanced algorithm defaults that do not necessarily need to be exposed in the normal Settings UI.

---

## Playlist Management

Saved playlists can be:

- viewed
- added
- removed

Direct editing is not required because an existing entry can be removed and added again when necessary.

Playlist persistence is delegated to:

```text
Spotify Load Playlists
Spotify Save Playlists
```

---

## Menu Behavior

Settings behaves as a persistent menu.

After a setting is changed, the workflow returns to the Settings menu.

The user can therefore perform several configuration changes in one session.

An explicit exit action ends the workflow.

---

## Dependencies

- `Spotify Load Config`
- `Spotify Save Config`
- `Spotify Load Playlists`
- `Spotify Save Playlists`

---

## Design Note

Normal users should configure Spotify True Shuffle through Settings rather than editing JSON files manually.

---

# Spotify Load Config

## Purpose

Read the local application configuration.

---

## Responsibilities

- locate `config.json`
- load its contents
- convert it into the configuration structure expected by callers
- report invalid or unavailable configuration

---

## Input

None.

---

## Output

The current configuration dictionary.

---

## Storage

```text
Shortcuts/Spotify True Shuffle/Data/config.json
```

---

# Spotify Save Config

## Purpose

Persist application configuration.

---

## Responsibilities

- receive updated configuration
- serialize the configuration
- write `config.json`

---

## Input

Configuration dictionary.

---

## Storage

```text
Shortcuts/Spotify True Shuffle/Data/config.json
```

---

# Spotify Load Playlists

## Purpose

Read the user's saved source playlist library.

---

## Responsibilities

- locate `playlists.json`
- load the playlist dictionary
- return it to the caller

---

## Input

None.

---

## Output

Conceptually:

```json
{
  "Playlist Name": "https://open.spotify.com/playlist/..."
}
```

---

## Storage

```text
Shortcuts/Spotify True Shuffle/Data/playlists.json
```

---

# Spotify Save Playlists

## Purpose

Persist the user's saved source playlist library.

---

## Responsibilities

- receive the playlist dictionary
- serialize it
- write `playlists.json`

Input validation should occur before invalid playlist data is persisted.

---

## Input

Playlist dictionary.

---

## Storage

```text
Shortcuts/Spotify True Shuffle/Data/playlists.json
```

---

# Spotify True Shuffle Installer

## Purpose

Bootstrap, install and verify Spotify True Shuffle.

The installer is separate from the normal runtime architecture.

---

## Responsibilities

The current installer handles:

- installer version validation
- remote manifest loading
- project compatibility checks
- local directory creation
- Scriptable module staging
- Scriptable module validation
- backup of existing Scriptable modules
- production Scriptable deployment
- Apple Shortcut discovery
- missing Shortcut detection
- guided Shortcut installation
- project Shortcut organization
- initial configuration creation
- initial playlist-file creation
- first-time Settings
- Spotify authentication bootstrap
- final installation verification

---

## Manifest

The installer reads:

```text
manifest.json
```

rather than maintaining its own independent list of distributable components.

This provides the installer with:

- project version
- installer version
- required Shortcuts
- Shortcut names and IDs
- Scriptable modules
- download URLs
- configuration template URLs

---

## Shortcut Detection

Required Apple Shortcuts are identified by their exact names.

For example:

```text
Spotify Settings
```

matches.

These do not:

```text
Spotify Setting
Spotify Settings 2
```

If required components are missing, their stable manifest IDs are collected and passed to:

```text
install.html
```

Conceptually:

```text
install.html?missing=spotify_settings,spotify_api
```

---

## Guided Installation

Apple does not provide a supported silent-import mechanism for shared Shortcuts.

The installer therefore opens the project installation website.

`install.html` reads the manifest and displays the iCloud installation links for only the missing component IDs.

After installing the components, the user runs the installer again.

The installer then performs the actual verification.

---

## Shortcut Organization

Once all required Shortcuts are present, recognized project components are moved into the Apple Shortcuts folder:

```text
Spotify True Shuffle
```

Moving the Shortcuts does not modify their workflow contents.

---

## Scriptable Installation

Scriptable modules follow a staged deployment process:

```text
Download
   │
   ▼
Test/
   │
   ▼
Validate
   │
   ▼
Backup existing modules
   │
   ▼
Deploy to Scriptable
```

The installer itself remains the only installer Shortcut.

Installation is intentionally not split into multiple additional installer modules.

---

## Initial Configuration

If local files are missing, the installer creates:

```text
config.json
playlists.json
```

from the templates referenced in `manifest.json`.

Existing user files are preserved.

A fresh configuration causes `Spotify Settings` to open so the required installation-specific values can be entered.

---

## Authentication

If no local authentication state exists, the installer starts:

```text
Spotify Login
```

Because authentication moves through Safari, completion may require the installer to be run again.

Existing authentication is not intentionally replaced during a normal installer run.

---

## Design Note

The installer is an intentional exception to the project's small-Shortcut principle.

A larger single installer provides a better user experience than requiring users to manually install and coordinate several installer-specific Shortcuts.

Runtime components should still remain modular.

---

# Component Identification and Naming

Shortcut names are currently part of the runtime and installation contract.

They are used for:

- installer component discovery
- `Run Shortcut` actions
- project organization

Users should therefore not rename Spotify True Shuffle component Shortcuts.

The stable IDs in `manifest.json` are used for distribution metadata and communication with `install.html`, while Apple Shortcuts still relies on component names at runtime.

---

# Versioning

Each distributed Shortcut has its own version in:

```text
manifest.json
```

Conceptually:

```json
{
  "id": "spotify_playlist_loader",
  "name": "Spotify Playlist Loader",
  "version": "1.0.0",
  "required": true,
  "install_order": 110,
  "icloud_url": "https://www.icloud.com/shortcuts/..."
}
```

Component versions are independent from:

- project version
- installer version
- Scriptable engine version
- configuration version

This provides the metadata required for future component-level update handling.

Automatic Shortcut updates are not currently implemented.

---

# Adding a New Shortcut

When introducing a new distributed Shortcut:

1. define one clear responsibility
2. define its input contract
3. define its output contract
4. identify its dependencies
5. implement error propagation
6. test the component independently
7. test all parent workflows
8. create an official iCloud sharing link
9. add the component to `manifest.json`
10. assign a stable component ID
11. assign a component version
12. assign an installation order
13. update only the documentation affected by the new component

Once the component is present in the manifest, the existing installer and `install.html` infrastructure can distribute it without requiring a separate installation mechanism.

---

# Design Rules

## One Runtime Responsibility per Shortcut

Runtime components should remain focused.

Do not add unrelated behavior to an existing Shortcut simply to avoid creating an appropriate module.

---

## Centralize Spotify Communication

Spotify HTTP and authentication behavior belongs in:

```text
Spotify API
```

Do not duplicate API transport logic in playlist or playback workflows.

---

## Centralize Persistent Storage

Configuration and playlist storage should use:

```text
Spotify Load Config
Spotify Save Config
Spotify Load Playlists
Spotify Save Playlists
```

Do not spread hardcoded file access throughout runtime components.

---

## Keep Algorithms in Scriptable

Complex shuffle logic belongs in JavaScript.

Apple Shortcuts should orchestrate the engine rather than reproduce algorithm behavior.

---

## Check API Results Immediately

Every Spotify API request whose result is required by the workflow should be validated before dependent actions continue.

This keeps the original error visible and prevents cascading failures.

---

## Preserve Component Contracts

Changing the input or output of a Shortcut is an interface change.

All callers must be identified and tested before changing an existing contract.

---

## Avoid Hardcoded User Values

Distributed Shortcuts must not contain installation-specific values such as:

- Spotify Client ID
- Redirect URI
- cache playlist ID
- personal playlist URLs
- authentication tokens

These belong in the configuration/data layer.

---

# Documentation Maintenance

This document describes the Shortcut component architecture.

It should be updated when:

- a Shortcut is added or removed
- a component's responsibility changes
- a component contract changes
- dependencies change significantly
- installer behavior changes significantly

It does not need to be rewritten for:

- internal implementation changes that preserve the contract
- tuning shuffle parameters
- changes isolated to Scriptable algorithms
- documentation-only changes
- releases that do not affect Shortcut architecture

This keeps documentation maintenance proportional to the actual change.

---

# Next Step

Continue with:

```text
docs/06_Scriptable.md
```

for the JavaScript module architecture.
