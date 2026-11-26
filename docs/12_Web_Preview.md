# Spotify True Shuffle im Browser

Die Vorschau unterstützt den Random-Modus. Safari lädt die Web-App und ruft Spotify direkt auf. Du brauchst dafür weder einen Server zu Hause noch Scriptable.

## Einrichtung

1. Öffne [Spotify True Shuffle im Browser](https://michalikd.github.io/spotify-true-shuffle/web/). Wenn du einen Fork betreibst, aktiviere GitHub Pages für das Stammverzeichnis deines Veröffentlichungsbranches und öffne dort `/web/`.
2. Öffne deine App im Spotify Developer Dashboard. Hinterlege die in der Web-App angezeigte Callback-URL zusätzlich zu vorhandenen URLs. Der Schrägstrich am Ende gehört zur URL.
3. Trage in der Web-App deine Spotify Client-ID ein und verbinde dein Konto. Spotify Premium ist für den Wiedergabestart erforderlich. Bei Apps im Development Mode muss das verwendete Spotify-Konto für die App zugelassen sein.
4. Öffne die Spotify-App auf deinem gewünschten Wiedergabegerät. Gib in der Web-App den Link zu einer eigenen Spotify-Playlist ein und tippe auf **Zufällig mischen und abspielen**.

Beim ersten Shuffle erstellt die Vorschau die private Playlist **True Shuffle – Web**. Weitere Starts überschreiben diese Playlist. Beiträge in der Quellplaylist und die Wiedergabeliste der Shortcut-Beta werden von der Vorschau nicht geändert. Wenn Spotify auf keinem Gerät die Wiedergabe annimmt, kannst du die vorbereitete Playlist über den angezeigten Link öffnen und in Spotify abspielen.

Die Web-App speichert Client-ID, Tokens, zuletzt verwendete Quelle und die ID der erzeugten Wiedergabeliste im Browserspeicher. Beim Ablauf des Access-Tokens wird die Verbindung automatisch erneuert. Wenn Spotify den Refresh-Token nicht mehr akzeptiert, kannst du Spotify erneut verbinden. **Spotify-Verbindung trennen** löscht die lokal gespeicherten Tokens.

## Optionaler Start über iOS

Du kannst die Web-App als Lesezeichen oder Home-Bildschirm-Symbol hinzufügen. Für einen Kurzbefehl genügt die Aktion **URLs öffnen** mit der Adresse der Web-App. Dieselbe URL kannst du nach einem Update weiterverwenden.

Eine feste Playlist kannst du mit `?playlist=PLAYLIST_ID` vorauswählen. Der Shuffle startet beim Tippen auf die Schaltfläche.
