# Troubleshooting

> Audience: End Users / Developers / Advanced Users

This document covers common problems that may occur while installing or using Spotify True Shuffle.

Spotify True Shuffle follows a fail-fast design:

> When a component detects a failure, execution should stop as close as possible to the original problem.

When troubleshooting, always start with the **first error message** rather than errors produced by later manual retries.

---

# Quick Troubleshooting

Before investigating individual components, try these basic steps:

1. Run `Spotify True Shuffle Installer` again.
2. Verify that iCloud Drive is available.
3. Verify that Scriptable is installed and has been opened at least once.
4. Verify that all Spotify True Shuffle Shortcuts are installed.
5. Open `Spotify Settings` and verify the Spotify configuration.
6. Verify that Spotify itself is working and an active playback device is available.

If the installer completes successfully but Spotify True Shuffle still fails, continue with the runtime sections below.

---

# Installation

## Installer does not start correctly

### Symptoms

- installer stops immediately
- manifest cannot be loaded
- installation does not continue

### Possible Causes

- no network connection
- GitHub unavailable
- invalid remote manifest
- incompatible installer version
- project compatibility check failed

### Solution

Verify that the device has internet access.

Then run:

```text
Spotify True Shuffle Installer
```

again.

If the problem persists, check whether the project repository and `manifest.json` are reachable.

Do not manually replace local project files before identifying the installer error.

---

# Manifest Cannot Be Loaded

### Symptoms

The installer reports that the remote manifest could not be downloaded or parsed.

### Possible Causes

- network failure
- GitHub unavailable
- malformed `manifest.json`
- invalid manifest URL

### Solution

Verify that:

```text
manifest.json
```

is reachable from the project repository.

For development builds, validate the JSON syntax before publishing changes.

The installer depends on the remote manifest for component metadata and should not continue with incomplete distribution information.

---

# Installer Version Mismatch

### Symptoms

The installer reports that it is incompatible with the current project manifest.

### Explanation

The manifest contains the current supported installer version.

An older installer may not understand a newer installation process.

### Solution

Install the current version of:

```text
Spotify True Shuffle Installer
```

using the official project installation link.

Then run the new installer again.

Do not attempt to work around an installer compatibility error by manually modifying the manifest.

---

# Required Directories Are Missing

### Symptoms

The installer cannot stage files or create configuration.

### Expected Structure

```text
Shortcuts/
└── Spotify True Shuffle/
    ├── Data/
    ├── Backup/
    └── Test/
```

### Solution

Run the installer again.

The installer creates the Spotify True Shuffle directory structure when required.

The Scriptable iCloud directory is managed separately by Scriptable.

If Scriptable storage is unavailable:

1. open Scriptable
2. verify that iCloud Drive is enabled
3. allow Scriptable to initialize its storage
4. run the installer again

---

# Scriptable Module Download Fails

### Symptoms

- staging fails
- expected module is missing
- installer stops before deployment

### Possible Causes

- invalid `download_url` in `manifest.json`
- repository file renamed
- network failure
- GitHub raw content unavailable
- manifest filename and repository filename differ

### Solution

For normal installations, retry the installer first.

For development, compare:

```text
scriptable_modules[].filename
```

with:

```text
scriptable_modules[].download_url
```

and the actual filename in:

```text
scriptable/
```

Filename capitalization and pluralization should remain consistent.

Do not continue to production deployment if staging is incomplete.

---

# Scriptable Staging Validation Fails

### Symptoms

Modules appear in:

```text
Spotify True Shuffle/Test/
```

but installation does not continue.

### Explanation

The installer stages Scriptable modules before replacing production files.

This is intentional.

Conceptually:

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
Backup
   │
   ▼
Production
```

### Solution

Identify which expected module failed validation.

Verify:

- filename
- download result
- expected module count
- manifest entry

Do not manually force staging files into production while validation is failing.

---

# Staged Files Appear as `.js.txt`

### Symptoms

A staged module appears as:

```text
Spotify Shuffle Artist.js
```

in the Files app, but file metadata identifies it as a text file or shows an underlying `.txt` type.

### Explanation

Apple Shortcuts may internally treat downloaded or generated text content as a text file even when a `.js` filename is assigned.

If the final installed Scriptable module is correctly named:

```text
*.js
```

and Scriptable can import it successfully, the staging representation itself does not necessarily indicate a broken installation.

### Solution

Verify the **production Scriptable file**, not only the staging file metadata.

If Scriptable successfully loads the module and the installed filename is correct, no action is required.

If Scriptable cannot import the module, continue with:

```text
Scriptable → Module cannot be imported
```

below.

---

# Backup Fails

### Symptoms

The installer detects existing Scriptable modules but cannot create their backup.

### Expected Behavior

Existing project modules should be copied to:

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Backup/
        └── <timestamp>/
```

before production deployment.

### Solution

Verify:

- iCloud Drive availability
- Shortcuts file permissions
- available storage
- access to the existing Scriptable files

Do not intentionally bypass a failed backup during normal installation or update testing.

---

# Production Deployment Fails

### Symptoms

Staging succeeds but one or more Scriptable modules are not installed correctly.

### Solution

Check:

```text
Spotify True Shuffle/Backup/
```

for the backup created before deployment.

Then verify which files exist in the Scriptable iCloud directory.

Do not repeatedly rerun a failing development installer without first identifying whether production contains a partial deployment.

Automatic rollback is not currently implemented.

---

# Missing Apple Shortcuts

### Symptoms

The installer opens the Spotify True Shuffle installation page.

### Explanation

This is normal when one or more required Apple Shortcuts are missing.

Apple does not allow the installer to silently import shared Shortcuts.

The installer therefore passes the missing component IDs to:

```text
install.html
```

which displays the corresponding iCloud installation links.

### Solution

Install every Shortcut displayed on the page.

Then return to Apple Shortcuts and run:

```text
Spotify True Shuffle Installer
```

again.

The installer performs the actual verification.

---

# Installation Page Shows the Wrong Shortcuts

### Symptoms

`install.html` displays:

- components that are already installed
- unexpected components
- no components despite missing Shortcuts

### Possible Causes

- incorrect `missing` query parameter
- manifest component ID mismatch
- outdated page or manifest
- installer detection error

### Solution

Run the installer again rather than opening `install.html` manually.

For development, verify that the missing IDs correspond exactly to:

```text
shortcuts[].id
```

inside `manifest.json`.

`install.html` should use the IDs supplied by the installer and should not independently determine which Shortcuts are installed.

---

# Shortcut Installation Button Does Not Work

### Symptoms

Tapping a component on `install.html` does not open the expected iCloud Shortcut page.

### Possible Causes

- missing iCloud URL
- invalid iCloud URL
- placeholder URL remains in the manifest

### Solution

For normal users, verify that the installation page belongs to the official project.

For development, inspect:

```text
shortcuts[].icloud_url
```

inside `manifest.json`.

Every released Shortcut must have a valid official iCloud sharing URL.

---

# Installer Still Reports a Shortcut as Missing

### Symptoms

A Shortcut was installed, but the installer continues to report it as missing.

### Possible Cause

The Shortcut was renamed.

Spotify True Shuffle currently uses exact Shortcut names for component detection.

For example:

```text
Spotify Settings
```

is valid.

These are different names:

```text
Spotify Setting
Spotify Settings 2
```

### Solution

Restore the official Shortcut name.

If unsure, reinstall the component using the official iCloud link.

Do not rename project component Shortcuts.

---

# Shortcut Folder Organization Fails

### Symptoms

All components are installed, but one or more Shortcuts are not moved into:

```text
Spotify True Shuffle
```

### Solution

Verify that the affected Shortcut has its official project name.

The folder is organizational and does not contain application data.

If the Shortcut itself runs correctly, moving it manually into the project folder is safe.

Do not rename it while moving it.

---

# Configuration Files Are Missing

### Symptoms

One or both files are missing:

```text
config.json
playlists.json
```

### Expected Location

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Data/
```

### Solution

Run:

```text
Spotify True Shuffle Installer
```

again.

If the files do not exist, the installer should create them from:

```text
config.example.json
playlists.example.json
```

Existing files should not be replaced during a normal installer run.

---

# Authentication

## Spotify Login Does Not Open Correctly

### Symptoms

- Safari does not open
- Spotify authorization does not appear
- login workflow stops early

### Possible Causes

- missing Spotify Client ID
- missing Redirect URI
- invalid configuration
- GitHub Pages unavailable

### Solution

Open:

```text
Spotify Settings
```

and verify:

```text
Spotify Client ID
Spotify Redirect URI
```

Then run:

```text
Spotify Login
```

again.

---

# `redirect_uri: Not matching configuration`

### Symptoms

Spotify login succeeds or begins, but Safari displays an error similar to:

```text
redirect_uri: Not matching configuration
```

### Cause

The Redirect URI sent during authorization does not exactly match the Redirect URI registered in the Spotify Developer Dashboard.

### Solution

Verify the Redirect URI in:

```text
Spotify Settings
```

and compare it character-for-character with the Spotify Developer application.

For the standard project installation, use the Redirect URI documented in:

```text
docs/01_Installation.md
```

Check for differences such as:

- missing trailing slash
- incorrect repository name
- old GitHub Pages URL
- `http` instead of `https`

After correcting the value, start Spotify Login again.

---

# Login Succeeds but Callback Does Not Return

### Symptoms

Spotify authorization succeeds, but:

- Safari remains open
- the callback does not launch correctly
- authentication state is not created

### Possible Causes

- Redirect URI mismatch
- GitHub Pages unavailable
- callback page unavailable
- Shortcut callback association failed
- PKCE state missing

### Solution

Verify:

- the project GitHub Pages callback is reachable
- Redirect URI matches exactly
- the Spotify Developer application uses the same URI
- `Spotify Login Callback` is installed with its official name

Then restart the login flow.

---

# Login Completed but Installer Does Not Finish

### Symptoms

Authentication succeeds in Safari, but the installer does not automatically continue.

### Explanation

This can be normal.

The authentication flow leaves Apple Shortcuts and moves through Safari.

The original installer execution may therefore no longer be active.

### Solution

After successful authentication, run:

```text
Spotify True Shuffle Installer
```

again.

The installer should detect the existing authentication state and continue verification.

---

# Refresh Token Fails

### Symptoms

Spotify API requests begin returning authentication errors.

### Possible Causes

- authorization revoked
- invalid Client ID
- missing or damaged `tokens.json`
- refresh token no longer valid
- authentication configuration changed

### Solution

Run:

```text
Spotify Login
```

again.

This creates a new authentication state.

If the problem persists, verify the Client ID and Redirect URI first.

---

# `tokens.json` Missing

### Symptoms

Spotify API cannot find authentication state.

### Solution

Run:

```text
Spotify Login
```

and complete authentication.

`tokens.json` is created by the authentication workflow.

Do not create this file manually.

---

# Configuration

## Configuration Cannot Be Loaded

### Symptoms

`Spotify Load Config` stops or returns an invalid result.

### Possible Causes

- `config.json` missing
- invalid JSON
- damaged configuration
- required runtime value missing

### Solution

First open:

```text
Spotify Settings
```

and verify the required user settings.

If `config.json` itself is missing, rerun:

```text
Spotify True Shuffle Installer
```

The installer can recreate a missing configuration from the repository template.

Do not replace an existing configuration with the template unless recovery actually requires it.

---

# Cache Playlist Is Missing or Invalid

### Symptoms

Playlist Writer fails or the generated playlist cannot be played.

### Possible Causes

- cache playlist deleted
- wrong playlist configured
- invalid cache playlist ID
- playlist no longer accessible

### Solution

Create or select a dedicated Spotify playlist and configure it through:

```text
Spotify Settings
```

The cache playlist should be reserved for Spotify True Shuffle.

---

# Playlist Library Is Empty

### Symptoms

No source playlists are available in Spotify True Shuffle.

### Possible Causes

- fresh installation
- empty `playlists.json`
- saved playlists removed

### Solution

Open:

```text
Spotify Settings
```

and add at least one Spotify playlist.

An empty:

```json
{}
```

is valid for a fresh installation.

---

# Playlist Cannot Be Saved

### Symptoms

`Spotify Save Playlists` reports an error.

### Possible Causes

- invalid Spotify playlist URL
- invalid playlist data
- storage failure

### Solution

Verify that the supplied URL points to a valid Spotify playlist.

Then try adding the playlist through:

```text
Spotify Settings
```

again.

---

# Playlist Loader

## Playlist Cannot Be Loaded

### Symptoms

`Spotify Playlist Loader` stops.

### Possible Causes

- playlist deleted
- playlist unavailable
- invalid playlist URL or ID
- Spotify API error
- network failure
- authentication failure

### Solution

Verify that the playlist opens normally in Spotify.

Then run Spotify True Shuffle again.

If an API error is displayed, troubleshoot that error before changing the playlist loader.

---

# Playlist Contains Fewer Tracks Than Expected

### Symptoms

The engine receives fewer tracks than expected.

### Possible Causes

- playlist changed during loading
- Spotify API request failed
- unsupported/non-track playlist items were ignored
- incomplete pagination

### Solution

Run the shuffle again.

If the problem is reproducible, compare:

```text
PlaylistPages
```

with the output of:

```text
Spotify Flatten Track Lists.js
```

to determine whether tracks were lost during retrieval or normalization.

---

# Pagination Problems

### Symptoms

Only the first part of a large playlist is loaded.

### Possible Causes

- pagination loop stopped early
- Spotify API request failed
- next page was not requested correctly

### Solution

Inspect the Playlist Loader rather than the shuffle engine.

The shuffle engine only receives the normalized tracks returned by the loader and does not perform Spotify pagination.

---

# Shuffle Engine

## Engine Validation Failed

### Symptoms

The Scriptable engine stops before returning a valid result.

### Possible Causes

- invalid normalized track structure
- empty or malformed track collection
- shuffled result failed validation
- final output failed validation

### Solution

Inspect, in order:

```text
Playlist Loader output
Spotify Flatten Track Lists.js output
Shuffle Engine input
Validation error
```

Start with the earliest invalid structure.

Do not troubleshoot the Playlist Writer until the engine returns valid output.

---

# Unsupported Shuffle Mode

### Symptoms

The engine reports an unsupported or unknown mode.

### Cause

`shuffle_mode` contains a value not registered by the current engine.

Current modes are:

```text
random
artist
album
balanced
```

### Solution

Open:

```text
Spotify Settings
```

and select a supported mode.

For development builds, verify that a newly added mode has been registered in the main engine.

---

# Debug Output Is Missing

### Symptoms

The engine returns:

```text
debug: null
```

### Explanation

Debug output is disabled during normal operation.

### Solution

Enable debug mode through:

```text
Spotify Settings
```

if the option is exposed there, or through the configuration when performing advanced development diagnostics.

The relevant configuration key is:

```text
debug_enabled
```

Debug output is not required for normal operation.

---

# Playlist Writer

## Cache Playlist Is Not Updated

### Symptoms

The engine succeeds, but the cache playlist remains unchanged.

### Possible Causes

- Spotify API write error
- invalid cache playlist
- Spotify synchronization delay
- Playlist Writer stopped before completion

### Solution

Check the first error returned by:

```text
Spotify Playlist Writer
Spotify API Result Check
```

If no error is reported, refresh the playlist in Spotify after a short delay.

Playback should not normally begin after a failed Writer operation.

---

# Only Part of the Playlist Was Uploaded

### Symptoms

The cache playlist contains fewer tracks than the engine generated.

### Explanation

Large generated playlists are written in multiple chunks.

### Possible Causes

- later chunk failed
- API interruption
- network failure
- Spotify rejected a write request

### Solution

Inspect the first failed Writer/API result.

Then run the shuffle again after resolving the underlying issue.

Do not assume the shuffle engine lost tracks until its:

```text
count
chunk_count
```

and generated chunks have been checked.

---

# Playback

## Playback Does Not Start

### Symptoms

The cache playlist was written successfully, but Spotify does not start playback.

### Possible Causes

- no active Spotify playback device
- Spotify Connect issue
- playback restriction
- authentication/API error

### Solution

Start playback manually on a Spotify device.

Then run Spotify True Shuffle again.

If playback still fails, inspect the Spotify API response.

---

# Previous Cache Playlist Starts Briefly

### Symptoms

Playback briefly uses the previous cache playlist state before the newly generated contents appear.

### Explanation

Spotify may delay synchronization between playlist modification and playback context.

### Solution

If the playlist updates correctly shortly afterwards, no project recovery action is normally required.

See:

```text
docs/10_Known_Issues.md
```

for known Spotify-related behavior.

---

# Spotify API

## `API_ERROR` Returned

### Symptoms

`Spotify API Result Check` reports:

```text
API_ERROR
```

### Solution

Read the original Spotify error message first.

Spotify True Shuffle attempts to preserve useful API failure information so the original problem can be diagnosed.

Common categories include:

- authentication
- permissions/scopes
- invalid request
- unavailable resource
- rate limiting

Do not troubleshoot downstream components until the API error has been resolved.

---

# HTTP 401

### Meaning

Authentication is missing, invalid or expired.

### Solution

Allow the normal token refresh process to run.

If refresh fails, run:

```text
Spotify Login
```

again.

---

# HTTP 403

### Meaning

Spotify understood the request but refused it.

Possible causes include:

- missing permission
- playback restriction
- unavailable operation
- account/device restrictions

### Solution

Read the Spotify error message.

Do not automatically treat every `403` as an authentication-expiration problem.

---

# HTTP 404

### Meaning

The requested Spotify resource could not be found.

### Possible Causes

- invalid playlist ID
- deleted playlist
- incorrect endpoint
- unavailable resource

### Solution

Verify the resource and request endpoint.

---

# HTTP 429 — Rate Limit

### Symptoms

Spotify rejects requests because the API rate limit was reached.

### Solution

Do not retry immediately in a tight loop.

Respect Spotify's returned:

```text
Retry-After
```

value when available.

For repeated development failures, stop the workflow and wait before testing again.

---

# Scriptable

## Module Cannot Be Imported

### Symptoms

Scriptable reports an import/file error or the engine stops immediately.

### Possible Causes

- missing module
- renamed module
- incorrect capitalization
- filename mismatch
- incomplete installer deployment

### Solution

Verify that all required modules exist in Scriptable with their official names.

Current modules are:

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

If one is missing, rerun:

```text
Spotify True Shuffle Installer
```

The installer should restore the required project modules.

---

# Engine Shortcut Returns No Output

### Symptoms

`Spotify Shuffle Engine` finishes without returning usable output.

### Possible Causes

- Scriptable engine missing
- imported module missing
- invalid engine input
- JavaScript execution error
- validation failure

### Solution

Inspect:

```text
Engine input
Scriptable error
module filenames
validation result
```

If the failure began after an installation/update, compare the production modules with the latest installer backup.

---

# Installer Backup Recovery

### When to Use

Manual backup recovery is intended for cases where Scriptable production files became unusable after deployment.

### Backup Location

```text
Shortcuts/
└── Spotify True Shuffle/
    └── Backup/
        └── <timestamp>/
```

### Recovery

Identify the most recent known-good backup.

Restore only the affected Scriptable modules to Scriptable.

Do not replace:

```text
config.json
playlists.json
tokens.json
```

from the Scriptable backup directory.

Those files are separate user data and are not part of Scriptable module backups.

Automatic rollback is not currently implemented.

---

# Updating

## Project Works but Installer Wants to Replace Scriptable Modules

### Explanation

The installer obtains the current Scriptable module list from:

```text
manifest.json
```

and deploys the distributable versions.

Existing modules are backed up before replacement.

### Solution

If you are intentionally running a development-modified local Scriptable module, back it up separately before running the public installer.

For normal installations, allow the installer to deploy the official project modules.

---

# Configuration Stops Working After an Update

### Possible Cause

A release introduced a configuration schema change.

### Solution

Read the release notes for that project version.

Do not delete `config.json` automatically.

If migration is required, follow the documented migration instructions so existing user settings are preserved.

---

# Re-running the Installer

The installer is designed to be rerunnable.

A normal rerun may:

- verify directories
- download current Scriptable modules
- stage modules
- back up existing modules
- deploy project modules
- verify required Shortcuts
- verify local setup

It should preserve:

```text
config.json
playlists.json
tokens.json
```

unless a future migration explicitly documents otherwise.

---

# Collecting Diagnostic Information

If a problem persists, collect the smallest useful diagnostic set.

Useful information includes:

- exact error message
- component where the error occurred
- project version
- installer version if installation-related
- engine version if shuffle-related
- configuration version
- selected shuffle mode
- debug output when relevant
- whether the issue is reproducible

For installation problems, also note whether the failure occurred during:

```text
manifest loading
directory preparation
staging
validation
backup
deployment
Shortcut verification
configuration
authentication
```

This significantly reduces troubleshooting time.

---

# Do Not Share Secrets

When reporting a problem, never publish:

```text
tokens.json
refresh tokens
access tokens
PKCE verifier
```

A Spotify Client ID may also be removed from diagnostic output when it is not relevant to the problem.

Playlist URLs can reveal user playlist information and should only be shared when necessary.

---

# Reporting an Issue

Before creating an issue:

1. reproduce the problem if possible
2. identify the first failing component
3. record the exact error
4. check `docs/10_Known_Issues.md`
5. remove authentication/private data
6. include relevant version information

Avoid reporting only:

```text
It doesn't work
```

A useful report should make it possible to identify which project layer failed.

---

# Next Step

Continue with:

```text
docs/10_Known_Issues.md
```

for currently known limitations and project-specific behavior.
