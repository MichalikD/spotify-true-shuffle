# Apple Shortcuts

> Audience: Developers / Advanced Users

Apple Shortcuts provides the orchestration, user interface, storage and Spotify API layers of Spotify True Shuffle.

The project deliberately splits functionality across multiple Shortcuts instead of implementing the complete application inside one large workflow.

This keeps runtime components focused and allows individual parts to evolve independently.

---

# Component Overview

The current runtime consists of the following Apple Shortcuts:

| Shortcut | Responsibility |
|---|---|
| `Spotify True Shuffle` | Main user-facing workflow |
| `Spotify Shuffle Engine` | Bridge between Shortcuts and the Scriptable shuffle engine |
| `Spotify Playlist Loader` | Loads all tracks from a Spotify playlist |
| `Spotify Playlist Writer` | Writes the generated order to the cache playlist |
| `Spotify API` | Central Spotify Web API client |
| `Spotify API Result Check` | Common API error validation |
| `Spotify Login` | Starts Spotify PKCE authentication |
| `Spotify Login Callback` | Completes Spotify authentication |
| `Spotify Refresh Token` | Refreshes expired Spotify access tokens |
| `Spotify Settings` | User-facing configuration |
| `Spotify Load Config` | Reads application configuration |
| `Spotify Save Config` | Writes application configuration |
| `Spotify Load Playlists` | Reads saved source playlists |
| `Spotify Save Playlists` | Writes saved source playlists |

Installation is handled separately by:

```text
Spotify True Shuffle Installer
```

The installer is bootstrap infrastructure and is not part of the normal runtime call graph.

---

# Runtime Call Graph

A normal shuffle follows approximately this path:

```text
Spotify True Shuffle
        │
        ├── Spotify Load Config
        │
        ├── Spotify Load Playlists
        │
        ▼
Spotify Playlist Loader
        │
        ├── Spotify API
        │       │
        │       ├── Spotify Refresh Token
        │       └── Spotify API Result Check
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
        ├── Spotify API
        │       └── Spotify API Result Check
        │
        ▼
Spotify Playback
```

Not every API request necessarily triggers a token refresh.

`Spotify Refresh Token` is only used when required.

---

# Spotify True Shuffle

`Spotify True Shuffle` is the main user-facing entry point.

Its responsibilities are intentionally limited to orchestration.

It:

1. loads configuration
2. loads saved playlists
3. lets the user select a source playlist
4. calls the playlist loader
5. passes the loaded tracks to the shuffle engine
6. passes the shuffled output to the playlist writer
7. starts playback after a successful write

The Shortcut should not contain Spotify authentication logic, playlist pagination logic or shuffle algorithms.

Those responsibilities belong to dedicated components.

---

## Main Workflow

Conceptually:

```text
Load Config
    │
    ▼
Load Playlists
    │
    ▼
Select Playlist
    │
    ▼
Playlist Loader
    │
    ▼
Shuffle Engine
    │
    ▼
Playlist Writer
    │
    ▼
Start Playback
```

If an earlier stage fails, later stages should not continue.

In particular, playback must not start if playlist writing fails.

---

# Spotify Playlist Loader

`Spotify Playlist Loader` retrieves the complete contents of a Spotify playlist.

Input:

```text
Spotify playlist URL or playlist ID
```

The loader extracts the playlist ID and requests playlist items through `Spotify API`.

The current Spotify endpoint is based on:

```text
/playlists/{playlist_id}/items
```

rather than the deprecated playlist tracks endpoint.

---

## Pagination

Spotify playlists may require multiple API requests.

The loader therefore handles pagination and collects the page responses before track normalization.

Conceptually:

```text
Playlist
   │
   ▼
Page 1
   │
   ├── Page 2
   │      │
   │      ├── Page 3
   │      │
   │      └── ...
   │
   ▼
PlaylistPages
```

The loader preserves the API page structures.

Flattening and normalization are handled separately by Scriptable.

---

## Output

The collected pages are passed to:

```text
Spotify Flatten Track Lists.js
```

The flattening module produces the normalized track representation used by the shuffle engine.

This keeps Spotify response parsing out of the shuffle algorithms.

---

# Spotify Shuffle Engine

`Spotify Shuffle Engine` is the bridge between Apple Shortcuts and the Scriptable engine.

It receives:

- normalized tracks
- current configuration

and passes them to:

```text
Spotify Shuffle Engine v5.js
```

The Shortcut itself should contain minimal algorithmic behavior.

Its purpose is to prepare the Scriptable input, invoke the engine and return the engine output to the calling workflow.

---

## Why a Separate Shortcut?

Keeping the bridge separate means the main `Spotify True Shuffle` Shortcut does not need to know:

- which JavaScript modules implement a mode
- how Scriptable loads engine modules
- how engine input is serialized
- how engine output is structured internally

This provides a stable boundary between Shortcuts and Scriptable.

---

# Spotify Playlist Writer

`Spotify Playlist Writer` writes the generated track order to the configured cache playlist.

Input is the output generated by the shuffle engine.

Because Spotify playlist modification requests have practical request-size limits, engine output can contain multiple chunks.

Conceptually:

```text
Engine Output
    │
    ├── chunk_1
    ├── chunk_2
    ├── chunk_3
    └── ...
```

The writer uses these chunks to replace and extend the cache playlist.

---

## Write Strategy

Conceptually:

```text
chunk_1
   │
   ▼
Replace playlist contents

chunk_2
   │
   ▼
Add playlist items

chunk_3
   │
   ▼
Add playlist items

...
```

Every Spotify API operation is checked before the next write operation continues.

A failed write must stop the writer.

---

## Cache Playlist

The writer modifies only the configured cache playlist.

The original source playlist is never changed.

Conceptually:

```text
Source Playlist
      │
      ▼
Shuffle
      │
      ▼
Cache Playlist
```

This allows Spotify True Shuffle to generate arbitrary playback orders without modifying the user's original playlists.

---

# Spotify API

`Spotify API` is the central HTTP and authentication layer.

Other project Shortcuts should use this component instead of communicating directly with Spotify.

Input is conceptually a dictionary containing:

```json
{
  "method": "GET",
  "endpoint": "/me/player",
  "body": {}
}
```

`body` is optional.

---

## Responsibilities

`Spotify API` handles:

- loading authentication state
- checking token validity
- refreshing tokens when required
- constructing Spotify API requests
- HTTP methods
- optional JSON request bodies
- returning Spotify responses
- returning API failures to the caller

Supported request methods currently include the methods required by the project, such as:

```text
GET
POST
PUT
DELETE
```

---

## Request Bodies

A body is only attached when one is supplied by the caller.

This allows the same API component to support both requests such as:

```text
GET /me/player
```

and requests requiring JSON content.

API callers should provide structured data rather than manually constructing JSON strings where possible.

---

# Spotify API Result Check

`Spotify API Result Check` provides a common validation layer after Spotify API calls.

Its purpose is to prevent workflows from continuing after a failed API request.

Conceptually:

```text
Spotify API
    │
    ▼
API Result Check
    │
    ├── Success → continue
    │
    └── Error   → stop caller
```

This is particularly important for multi-request workflows such as:

- playlist pagination
- playlist writing
- authentication-related requests

Without this layer, one failed request could cause multiple secondary Shortcut errors that hide the original Spotify API failure.

---

# Spotify Login

`Spotify Login` starts the Spotify authorization process.

The Shortcut loads the required Spotify configuration and opens the project's GitHub Pages authentication entry point.

The browser-based part of the flow handles PKCE authorization with Spotify.

The Shortcut does not contain a Client Secret.

---

# Spotify Login Callback

`Spotify Login Callback` receives the authorization result after Spotify redirects back through the project GitHub Pages callback.

Its responsibilities include:

- receiving the authorization code
- loading the PKCE verifier
- exchanging the code for Spotify tokens
- creating the local token state
- storing authentication information for future API calls

Authentication state is stored in:

```text
Shortcuts/Spotify True Shuffle/Data/tokens.json
```

---

# Spotify Refresh Token

`Spotify Refresh Token` renews the Spotify access token when required.

The refresh workflow uses the stored refresh token and updates the local authentication state.

The central `Spotify API` Shortcut decides when refresh is required.

Calling Shortcuts therefore do not need to manage token expiration themselves.

Conceptually:

```text
Calling Shortcut
       │
       ▼
   Spotify API
       │
       ├── token valid
       │      │
       │      ▼
       │   API request
       │
       └── token expired
              │
              ▼
       Spotify Refresh Token
              │
              ▼
        reload token state
              │
              ▼
          API request
```

This keeps authentication state management centralized.

---

# Spotify Load Config

`Spotify Load Config` reads:

```text
Shortcuts/Spotify True Shuffle/Data/config.json
```

and returns the configuration to the caller.

Runtime components should use this Shortcut rather than implementing their own file access.

This gives the project a common configuration access layer.

---

# Spotify Save Config

`Spotify Save Config` writes the configuration back to:

```text
Shortcuts/Spotify True Shuffle/Data/config.json
```

Configuration changes should pass through this component.

This makes future storage changes or migrations easier to implement without modifying every Shortcut that uses configuration.

---

# Spotify Load Playlists

`Spotify Load Playlists` reads:

```text
Shortcuts/Spotify True Shuffle/Data/playlists.json
```

The file maps user-defined names to Spotify playlist URLs.

Example:

```json
{
  "Chill": "https://open.spotify.com/playlist/...",
  "Rap": "https://open.spotify.com/playlist/..."
}
```

The result is used by the main workflow and Spotify Settings.

---

# Spotify Save Playlists

`Spotify Save Playlists` writes the user's saved playlist dictionary.

Playlist management is intentionally separated from the main configuration file.

This allows playlist data to evolve independently from algorithm and application settings.

---

# Spotify Settings

`Spotify Settings` is the central user-facing configuration interface.

It provides access to settings such as:

- Spotify Client ID
- Spotify Redirect URI
- cache playlist
- shuffle mode
- debug configuration
- saved source playlists

Settings uses the dedicated load/save components instead of directly duplicating file handling.

---

## Menu Behavior

Settings is designed as a persistent menu.

After a configuration action is completed, the Settings Shortcut can return to its menu so the user can perform additional changes without manually launching it again.

An explicit exit action ends the Settings workflow.

---

# Spotify True Shuffle Installer

`Spotify True Shuffle Installer` is the project bootstrap workflow.

It is intentionally not part of normal runtime operation.

Its responsibilities include:

- loading the remote manifest
- preparing project directories
- staging Scriptable modules
- backing up existing Scriptable modules
- deploying Scriptable modules
- detecting missing Apple Shortcuts
- opening the guided installation page
- organizing installed project Shortcuts
- creating initial configuration files
- starting first-time Settings
- starting Spotify authentication
- verifying installation state

The installer is intentionally larger than normal project Shortcuts.

This is a deliberate architectural tradeoff: installation complexity remains inside one user-facing installer instead of requiring several installer Shortcuts.

Detailed installer behavior is documented separately in the development and installation documentation.

---

# Shortcut Identification

The project manifest assigns each distributable Shortcut:

- a stable component ID
- a display name
- a version
- an installation order
- an iCloud sharing URL

Example conceptually:

```json
{
  "id": "spotify_api",
  "name": "Spotify API",
  "version": "1.0.0",
  "required": true,
  "install_order": 30,
  "icloud_url": "https://www.icloud.com/shortcuts/..."
}
```

The installer currently verifies installed Shortcuts using their exact names.

Therefore:

```text
Spotify Settings
```

is recognized, while:

```text
Spotify Settings 2
```

is not.

Project component Shortcuts should not be renamed by users.

---

# Shortcut Folder

After installation, project components are organized into:

```text
Spotify True Shuffle
```

inside Apple Shortcuts.

The folder is primarily organizational.

Runtime communication still uses the component Shortcut names.

---

# Design Rules

When adding or modifying a Shortcut, follow these principles.

## Keep Runtime Components Focused

A Shortcut should have a clear responsibility.

Avoid moving unrelated functionality into an existing component simply because it is convenient.

---

## Prefer Shared Components

If multiple workflows require the same behavior, prefer a shared component.

Examples already include:

```text
Spotify API
Spotify API Result Check
Spotify Load Config
Spotify Save Config
Spotify Load Playlists
Spotify Save Playlists
```

---

## Keep Algorithms in Scriptable

Complex shuffle logic belongs in JavaScript.

Shortcuts should orchestrate the engine rather than implement algorithm internals.

---

## Propagate Errors

A failed child component should prevent the parent workflow from continuing with invalid output.

Do not hide the original API or validation error behind later Shortcut failures.

---

## Preserve Contracts

Changes to component input or output should be treated as interface changes.

Before changing a contract, identify every caller that depends on it.

---

## Avoid Hardcoded User Configuration

User-specific values belong in configuration files.

Examples include:

- Spotify Client ID
- Redirect URI
- cache playlist ID
- saved playlists

They should not be embedded in distributable Shortcuts.

---

# Adding a New Shortcut

When a new required project Shortcut is introduced:

1. define its responsibility
2. define its input/output contract
3. implement and test it
4. create its official iCloud sharing link
5. add it to `manifest.json`
6. assign a stable ID
7. assign a version
8. assign an installation order
9. update the relevant documentation

Once present in the manifest, the installer and `install.html` can include it in the normal installation flow.

---

# Versioning

Shortcut versions are tracked independently in:

```text
manifest.json
```

For example:

```json
{
  "name": "Spotify Playlist Loader",
  "version": "1.0.0"
}
```

The current manifest provides the foundation for future component-level update handling.

Automatic Shortcut updating is not currently implemented.

---

# Next Step

Continue with:

```text
docs/04_Scriptable.md
```

for the JavaScript module architecture and shuffle engine internals.
