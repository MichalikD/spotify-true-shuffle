# Installation

> **Audience:** End Users

This guide describes the recommended installation process for **Spotify True Shuffle**.

Spotify True Shuffle uses an installer to automate as much of the setup as iOS currently allows.

By the end of this guide you will have:

* all required Scriptable modules
* all required Apple Shortcuts
* a Spotify True Shuffle configuration
* a dedicated cache playlist
* working Spotify authentication
* your first successful shuffle

---

## Prerequisites

Before starting, make sure you have:

* an iPhone or iPad
* Apple Shortcuts
* Scriptable
* iCloud Drive enabled for Shortcuts and Scriptable
* a Spotify Premium subscription
* a Spotify Developer account

> **Note:** A GitHub account is not required for normal installation.

---

## Required Apps

### Apple Shortcuts

Apple Shortcuts provides the main application layer of Spotify True Shuffle.

It is used for:

* user interaction
* configuration
* Spotify authentication
* Spotify Web API communication
* playlist loading and writing
* installation and maintenance

> **Screenshot Placeholder**

### Scriptable

Scriptable runs the shuffle engine and supporting JavaScript modules.

It is used for:

* shuffle algorithms
* track processing
* validation
* shared shuffle utilities
* debug output

Scriptable must be installed before running the Spotify True Shuffle Installer.

Open Scriptable at least once and make sure iCloud Drive is available.

> **Screenshot Placeholder**

---

## Spotify Developer Application

Spotify True Shuffle communicates with Spotify through the Spotify Web API.

Each user currently needs their own Spotify Developer application.

Open the Spotify Developer Dashboard:

https://developer.spotify.com/dashboard

Create a new application.

Example:

```text
Name:
Spotify True Shuffle
```

The application does **not** require a Client Secret.

Spotify True Shuffle uses the **Authorization Code flow with PKCE**.

### Redirect URI

The Redirect URI must point to the Spotify True Shuffle GitHub Pages callback:

```text
https://michalikd.github.io/spotify-true-shuffle/
```

Add this exact URI to the Spotify Developer application.

The value configured later in Spotify True Shuffle must match the URI registered with Spotify exactly.

### Client ID

After creating the Spotify application, copy its:

```text
Client ID
```

You will enter it during Spotify True Shuffle setup.

> **Important:** Do not use or distribute the Client Secret.

---

## Cache Playlist

Spotify True Shuffle uses a dedicated Spotify playlist as its playback target.

Before completing setup, create a new empty Spotify playlist.

Recommended name:

```text
Spotify True Shuffle Cache
```

The playlist is automatically overwritten whenever a new shuffle is generated.

Do not use it as a normal playlist or store tracks in it manually.

Copy the playlist link or ID. You will need it during setup.

---

## Install Spotify True Shuffle

Start the:

```text
Spotify True Shuffle Installer
```

The installer uses the project's remote `manifest.json` to determine the current project version, required components, and download locations.

The installation is divided into several stages.

### Stage 1 — Environment

The installer prepares the required directory structure in iCloud Drive.

Spotify True Shuffle uses:

```text
Shortcuts/
└── Spotify True Shuffle/
    ├── Data/
    ├── Backup/
    └── Test/
```

The directories are created automatically when required.

The Scriptable iCloud directory is managed separately by Scriptable.

### Stage 2 — Scriptable Modules

The installer automatically downloads the required Scriptable modules listed in the project manifest.

Modules are first downloaded into the temporary staging directory:

```text
Shortcuts/Spotify True Shuffle/Test/
```

The installer validates the staged modules before installing them.

Existing Spotify True Shuffle Scriptable modules are backed up before they are replaced.

Backups are stored in:

```text
Shortcuts/Spotify True Shuffle/Backup/
```

using a timestamped backup directory.

After validation and backup, the new modules are copied into Scriptable.

No manual JavaScript installation is required.

---

## Apple Shortcut Installation

Apple does not allow shared Shortcuts to be silently installed by another Shortcut.

Because of this iOS limitation, the Apple Shortcut components require one manual installation stage.

The installer automatically checks which required Spotify True Shuffle Shortcuts are already installed.

If one or more components are missing, the installer opens the Spotify True Shuffle installation page.

The page displays only the missing components.

Example:

```text
Spotify API
Spotify Settings
Spotify True Shuffle
```

Tap each installation button and add the Shortcut using Apple's official iCloud Shortcut interface.

The installation page may mark a component as:

```text
Opened ✓
```

This only means that its iCloud installation link was opened.

The Spotify True Shuffle Installer performs the actual installation verification.

### Return to the Installer

After installing every Shortcut shown on the installation page:

1. Return to the Shortcuts app.
2. Run **Spotify True Shuffle Installer** again.

The installer checks all required component names again.

If components are still missing, the installation page opens again and displays the remaining components.

When all required Shortcuts are present, installation continues automatically.

### Shortcut Organization

After verification, the installer creates the Shortcuts folder:

```text
Spotify True Shuffle
```

All recognized Spotify True Shuffle project Shortcuts are moved into this folder automatically.

This keeps the installed project components together and makes them easier to identify.

> **Important:** Shortcut names are part of the component identification process. Do not rename Spotify True Shuffle component Shortcuts unless instructed by the project documentation.

---

## Initial Configuration

The installer checks for:

```text
config.json
playlists.json
```

inside:

```text
Shortcuts/Spotify True Shuffle/Data/
```

If the files do not exist, they are created automatically from the current project templates.

Existing user configuration and playlist files are preserved.

---

## Spotify Settings

On a new installation, the installer starts:

```text
Spotify Settings
```

Use it to configure the installation.

At minimum, configure the following settings.

### Spotify Client ID

Enter the Client ID from your Spotify Developer application.

### Redirect URI

Use:

```text
https://michalikd.github.io/spotify-true-shuffle/
```

This must exactly match the Redirect URI registered in the Spotify Developer Dashboard.

### Cache Playlist

Enter the Spotify playlist link or ID of the dedicated cache playlist created earlier.

Additional settings include:

* shuffle mode
* debug options
* saved source playlists

The default shuffle algorithm settings are already provided by the configuration template.

---

## Spotify Authentication

After configuration, the installer checks whether Spotify authentication already exists.

If authentication is required, it starts:

```text
Spotify Login
```

The Spotify Login Shortcut opens the configured Redirect URI and passes the user's Spotify Client ID to the authentication page.

The authentication page does not contain a hardcoded Spotify Client ID.

This allows every installation to use its own Spotify Developer application while sharing the same Spotify True Shuffle authentication page.

Safari opens the Spotify authorization page.

Log in to Spotify and grant the requested permissions.

Spotify then redirects to the Spotify True Shuffle GitHub Pages callback.

The callback returns control to Apple Shortcuts and stores the authentication tokens locally.

Spotify True Shuffle uses **PKCE authentication**.

No Client Secret is stored or required.

### Authentication Tokens

Authentication information is stored locally in:

```text
tokens.json
```

Spotify True Shuffle automatically refreshes the access token when required.

A new login is normally only required if the existing authorization can no longer be refreshed or if authentication-related configuration changes.

---

## Complete the Installation

Because Spotify authentication leaves the installer and opens Safari, the installer may need to be started once more after the first successful login.

Run:

```text
Spotify True Shuffle Installer
```

again.

When the installer detects:

* required Scriptable modules
* all required Apple Shortcuts
* `config.json`
* `playlists.json`
* Spotify authentication

the installation is complete.

The installer displays:

```text
Installation Complete
```

Spotify True Shuffle is now ready to use.

---

## First Shuffle

Run:

```text
Spotify True Shuffle
```

Choose one of your configured playlists.

The workflow will:

1. load the Spotify playlist
2. process its tracks
3. generate a new order using the selected shuffle mode
4. write the result to the cache playlist
5. start playback

If playback starts successfully, Spotify True Shuffle is operational.

---

## Re-running the Installer

The installer can be run again after the initial installation.

It verifies the current project components and preserves existing user data.

In particular, existing:

```text
config.json
playlists.json
tokens.json
```

are not intentionally replaced during a normal installation check.

Existing Scriptable modules are backed up before replacement.

This makes the installer useful for installation verification and basic repair scenarios as well as first-time installation.

---

## Updating

The current installer infrastructure already uses the project manifest as the central source for component versions and download locations.

A complete automatic update system is still planned.

Until that system is available, follow the release-specific update instructions when upgrading Spotify True Shuffle.

Do not delete:

```text
config.json
playlists.json
tokens.json
```

unless specifically instructed to do so.

---

## Installation Website

The Shortcut installation page is hosted through GitHub Pages:

https://michalikd.github.io/spotify-true-shuffle/install.html

Normally you do not need to open this page manually.

The installer opens it automatically and passes the IDs of missing Shortcut components to the page.

The page reads the current project manifest and generates the appropriate iCloud installation links.

---

## Troubleshooting

If installation does not complete:

* run the installer again
* verify that Scriptable is installed and has iCloud Drive access
* verify that all Shortcuts shown on the installation page were actually added
* verify that the Spotify Client ID is correct
* verify that the Redirect URI exactly matches the Spotify Developer Dashboard
* verify that the cache playlist exists
* verify that iCloud Drive is available

More detailed troubleshooting is documented in:

```text
docs/09_Troubleshooting.md
```

Known project limitations are documented in:

```text
docs/10_Known_Issues.md
```

---

## Next Step

Continue with:

```text
docs/02_Architecture.md
```

to understand how Spotify True Shuffle works internally.
