const messages = {
  connectTitle: ["Connect Spotify", "Spotify verbinden"],
  callbackInstructions: ["Add the callback URL below to your app in the", "Hinterlege die Callback-URL unten bei deiner App im"],
  spotifyClient: ["Spotify Client ID", "Spotify Client-ID"],
  connectButton: ["Connect Spotify", "Mit Spotify verbinden"],
  sourcePlaylist: ["Source playlist", "Quellplaylist"],
  playlistPlaceholder: ["Spotify link, URI, or playlist ID", "Spotify-Link, URI oder Playlist-ID"],
  shuffleMode: ["Shuffle mode", "Shuffle-Modus"],
  modeCustom: ["Custom", "Benutzerdefiniert"],
  customTitle: ["Custom shuffle settings", "Benutzerdefinierten Shuffle einstellen"],
  customFocus: ["Emphasis: Artist ↔ Album", "Gewichtung: Artist ↔ Album"],
  customFocusHint: ["Move left for more emphasis on artists or right for albums. The middle uses the Balanced defaults.", "Links zählt Artist stärker, rechts Album. Die Mitte entspricht dem Balanced-Standard."],
  customVariation: ["Variation in track selection", "Variation bei der Titelauswahl"],
  resetTuning: ["Reset to defaults", "Standardwerte wiederherstellen"],
  shuffleButton: ["Shuffle and play", "Mischen und abspielen"],
  presets: ["Start links", "Startlinks"],
  presetName: ["Name for the selected playlist and mode", "Name für die gewählte Playlist und den Modus"],
  presetPlaceholder: ["e.g. Car-Balanced", "z. B. Auto-Balanced"],
  presetHint: ["Up to 32 characters. Use A–Z, digits or hyphens, and start with a letter or digit.", "Bis zu 32 Zeichen ohne Leerzeichen. Erlaubt sind A–Z, 0–9 und Bindestriche. Beginne mit einem Buchstaben oder einer Zahl."],
  presetAutostart: ["Shuffle and play when this start link opens", "Beim Öffnen des Startlinks direkt mischen und abspielen"],
  autostartNote: ["Starting automatically replaces the contents of the playback playlist.", "Beim Direktstart wird die eingestellte Wiedergabeliste ersetzt."],
  savePreset: ["Save start link", "Startlink speichern"],
  shortcutUrl: ["URL for the shortcut", "URL für den Kurzbefehl"],
  destinationTitle: ["Set playback playlist", "Wiedergabeliste einstellen"],
  existingDestination: ["Existing playback playlist", "Vorhandene Wiedergabeliste"],
  destinationNote: ["Shuffling replaces the contents of this playlist. Use a separate playlist you own. If you leave this unset, the app creates a private playlist.", "Beim Shuffle wird der Inhalt dieser Playlist ersetzt. Verwende dafür eine eigene, separate Liste. Ohne Auswahl legt die Web-App eine private Liste an."],
  saveDestination: ["Save playback playlist", "Als Wiedergabeliste speichern"],
  openDestination: ["Open playback playlist in Spotify", "Wiedergabeliste in Spotify öffnen"],
  disconnect: ["Disconnect Spotify", "Spotify-Verbindung trennen"],
  failed: ["The operation failed.", "Der Vorgang ist fehlgeschlagen."],
  unknownAccount: ["Could not identify the Spotify account.", "Das Spotify-Konto konnte nicht ermittelt werden."],
  invalidSource: ["Enter a valid Spotify playlist link or ID.", "Gib einen gültigen Spotify-Playlist-Link oder eine Playlist-ID ein."],
  sameAsDestination: ["Choose a source other than the app’s playback playlist.", "Wähle eine andere Quelle als die Wiedergabeliste der Web-App."],
  loadingPlaylist: ["Loading playlist…", "Playlist wird geladen …"],
  sourceDenied: ["Spotify denied access to this playlist. Try a playlist you own or collaborate on.", "Spotify erlaubt keinen Zugriff auf diese Playlist. Teste eine eigene Playlist oder eine, an der du mitarbeitest."],
  emptyPlaylist: ["The playlist has no supported Spotify tracks.", "Die Playlist enthält keine unterstützten Spotify-Titel."],
  writingPlaylist: ["Updating playback playlist…", "Wiedergabeliste wird geschrieben …"],
  invalidDestinationId: ["Spotify returned an invalid playback playlist ID.", "Spotify hat keine gültige ID für die Wiedergabeliste geliefert."],
  noDevice: ["The playback playlist is ready. Open Spotify on your preferred device and start playing it there.", "Die Wiedergabeliste ist fertig. Öffne Spotify auf deinem Wunschgerät und starte dort die Wiedergabe."],
  playedOne: ["Shuffled {0} track. Spotify confirmed playback.", "{0} Titel gemischt. Spotify hat den Wiedergabestart bestätigt."],
  playedMany: ["Shuffled {0} tracks. Spotify confirmed playback.", "{0} Titel gemischt. Spotify hat den Wiedergabestart bestätigt."],
  invalidDestination: ["Enter a valid Spotify link for the playback playlist.", "Gib einen gültigen Spotify-Link für die Wiedergabeliste ein."],
  samePlaylists: ["The source and playback playlists must be different.", "Quelle und Wiedergabeliste müssen verschieden sein."],
  notYourDestination: ["Choose a playback playlist owned by your Spotify account.", "Wähle eine Wiedergabeliste, die deinem Spotify-Konto gehört."],
  destinationSaved: ["Playback playlist saved: {0}.", "Wiedergabeliste gespeichert: {0}."],
  destinationSavedReconnect: ["Playback playlist saved: {0}. Reconnect Spotify to allow updates to public playlists.", "Wiedergabeliste gespeichert: {0}. Trenne die Spotify-Verbindung und verbinde sie erneut, um öffentliche Playlists schreiben zu können."],
  checkingSpotify: ["Checking Spotify…", "Spotify wird geprüft …"],
  shuffleBusy: ["A shuffle is already running in another tab.", "Ein Shuffle läuft bereits in einem anderen Tab."],
  confirmDelete: ["Delete start link “{0}”?", "Startlink „{0}“ löschen?"],
  presetDeleted: ["Start link “{0}” deleted.", "Startlink „{0}“ gelöscht."],
  delete: ["Delete", "Löschen"],
  deletePreset: ["Delete start link “{0}”", "Startlink „{0}“ löschen"],
  invalidPresetName: ["Use a name without spaces, such as Car-Balanced.", "Verwende einen Namen ohne Leerzeichen, zum Beispiel Auto-Balanced."],
  missingPresetPlaylist: ["Choose a valid source playlist for the start link.", "Wähle eine gültige Quellplaylist für den Startlink."],
  presetSaved: ["Start link saved.", "Startlink gespeichert."],
  disconnected: ["Spotify disconnected.", "Spotify-Verbindung getrennt."],
  signedIn: ["Spotify is connected. Check the source, mode and linked playback playlist, then select “Shuffle and play”.", "Spotify ist verbunden. Prüfe Quelle, Modus und die verlinkte Wiedergabeliste und tippe dann auf „Mischen und abspielen“."],
  signedInNewPlaylist: ["Spotify is connected. Starting the shuffle will create the private “True Shuffle – Web” playlist.", "Spotify ist verbunden. Beim Start wird die private Wiedergabeliste „True Shuffle – Web“ angelegt."],
  missingPreset: ["This start link is not saved in this browser.", "Dieser Startlink ist in diesem Browser nicht gespeichert."],
  invalidDirectLink: ["The direct link does not contain a valid Spotify playlist.", "Der Direktlink enthält keine gültige Spotify-Playlist."],
  loginExpired: ["Your Spotify login expired. Reconnect Spotify.", "Die Spotify-Anmeldung ist abgelaufen. Bitte verbinde Spotify erneut."],
  loginNotConfirmed: ["Spotify could not confirm the login (HTTP {0}).", "Spotify konnte die Anmeldung nicht bestätigen (HTTP {0})."],
  noRefreshToken: ["Spotify did not return a refresh token.", "Spotify hat keinen Refresh-Token zurückgegeben."],
  loginMismatch: ["The Spotify login could not be matched. Start it again.", "Die Spotify-Anmeldung konnte nicht zugeordnet werden. Bitte starte sie erneut."],
  loginCancelled: ["Spotify login was cancelled.", "Die Spotify-Anmeldung wurde abgebrochen."],
  loginRequired: ["Reconnect Spotify.", "Bitte verbinde Spotify erneut."],
  invalidApiAddress: ["Spotify returned an invalid API address.", "Spotify hat eine ungültige API-Adresse geliefert."],
  spotifyDenied: ["Spotify denied access. Reconnect Spotify.", "Spotify hat den Zugriff abgelehnt. Bitte verbinde Spotify erneut."],
  spotifyRetry: ["Spotify is limiting requests. Try the shuffle again shortly.", "Spotify begrenzt gerade die Anfragen. Starte den Shuffle später erneut."],
  spotifyRetrySeconds: ["Spotify is limiting requests. Wait {0} seconds, then try the shuffle again.", "Spotify begrenzt gerade die Anfragen. Warte {0} Sekunden und starte den Shuffle erneut."],
  spotifyHttp: ["Spotify returned HTTP {0}.", "Spotify meldet HTTP {0}."],
  spotifyHttpDetail: ["Spotify returned HTTP {0} · {1}", "Spotify meldet HTTP {0} · {1}"],
  repeatedPlaylistPage: ["Spotify repeated the same playlist page.", "Spotify wiederholt dieselbe Playlist-Seite."],
  invalidPlaylistPage: ["Spotify returned an invalid playlist page.", "Spotify hat keine gültige Playlist-Seite geliefert."],
  loadDefaultsFailed: ["Could not load the shuffle settings.", "Die Shuffle-Einstellungen konnten nicht geladen werden."],
  unknownMode: ["Unknown shuffle mode.", "Unbekannter Shuffle-Modus."],
  trackListExpected: ["Expected a list of tracks.", "Der Schlüssel tracks muss eine Liste enthalten."],
  trackListEmpty: ["The track list is empty.", "Die übergebene Trackliste ist leer."],
  trackInvalid: ["Track {0} is not a valid object.", "Track {0} ist kein gültiges Wörterbuch."],
  trackUriInvalid: ["Track {0} does not have a valid Spotify URI.", "Track {0} besitzt keine gültige Spotify-URI."],
  trackArtistsInvalid: ["Track {0} does not have a valid artist list.", "Track {0} besitzt keine gültige Künstlerliste."],
  trackAlbumInvalid: ["Track {0} does not have valid album data.", "Track {0} besitzt kein gültiges Album-Wörterbuch."],
  shuffledListInvalid: ["Shuffle mode “{0}” did not return a valid track list.", "Shuffle-Modus „{0}“ hat keine gültige Trackliste zurückgegeben."],
  shuffledCountChanged: ["The track count changed during shuffling.", "Die Anzahl der Titel hat sich beim Mischen verändert."],
  shuffledTracksChanged: ["The shuffled playlist contains missing, extra, or changed tracks.", "Die gemischte Trackliste enthält fehlende, zusätzliche oder veränderte Titel."]
};

let language = "en";

export function setLanguage(value) {
  language = value === "de" ? "de" : "en";
}

export function t(key, ...values) {
  return messages[key][language === "de" ? 1 : 0]
    .replace(/\{(\d+)\}/g, (_, index) => String(values[index]));
}

export class LocalizedError extends Error {
  constructor(key, ...values) {
    super(t(key, ...values));
    this.key = key;
    this.values = values;
  }
}
