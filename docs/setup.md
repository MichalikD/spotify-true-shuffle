# Spotify True Shuffle einrichten

Die Web-App läuft in Safari und ruft Spotify direkt auf.

## Einrichtung

1. Öffne [Spotify True Shuffle im Browser](https://michalikd.github.io/spotify-true-shuffle/web/). Wenn du einen Fork betreibst, aktiviere GitHub Pages für das Stammverzeichnis deines Veröffentlichungsbranches und öffne dort `/web/`.
2. Öffne deine App im Spotify Developer Dashboard. Hinterlege die in der Web-App angezeigte Callback-URL zusätzlich zu vorhandenen URLs hinzu. Der Schrägstrich am Ende gehört zur URL.
3. Trage in der Web-App deine Spotify Client-ID ein und verbinde dein Konto. Spotify Premium ist für den Wiedergabestart erforderlich. Bei Apps im Development Mode muss das verwendete Spotify-Konto für die App zugelassen sein.
4. Öffne die Spotify-App auf deinem gewünschten Wiedergabegerät. Gib in der Web-App den Link zu einer eigenen Spotify-Playlist ein und tippe auf **Mischen und abspielen**.

Beim ersten Shuffle erstellt die Web-App standardmäßig die private Playlist **True Shuffle – Web**. Unter **Wiedergabeliste einstellen** kannst du eine vorhandene eigene Playlist speichern, etwa eine bereits genutzte Shuffle-Playlist. Das Speichern ändert die Playlist noch nicht. Beim nächsten Shuffle wird ihr Inhalt ersetzt. Quelle und Wiedergabeliste müssen unterschiedlich sein. Wenn du bereits vor dem Update angemeldet warst und eine öffentliche Liste als Ziel wählst, verbinde Spotify erneut, um die Schreibberechtigung dafür zu erteilen.

Wenn Spotify auf keinem Gerät die Wiedergabe annimmt, kannst du die vorbereitete Playlist über den angezeigten Link öffnen und in Spotify abspielen.

Die Web-App speichert Client-ID, Tokens, zuletzt verwendete Quelle und die ID der Wiedergabeliste im Browserspeicher. Beim Ablauf des Access-Tokens wird die Verbindung automatisch erneuert. Wenn Spotify den Refresh-Token nicht mehr akzeptiert, kannst du Spotify erneut verbinden. **Spotify-Verbindung trennen** löscht die lokal gespeicherten Tokens.

## Optionaler Start über iOS

Du kannst die Web-App als Lesezeichen oder Home-Bildschirm-Symbol hinzufügen. Für einen Kurzbefehl genügt die Aktion **URLs öffnen** mit der Adresse der Web-App. Dieselbe URL kannst du nach einem Update weiterverwenden.

Mit `?playlist=PLAYLIST_ID&mode=balanced` kannst du Playlist und Modus vorauswählen. Mögliche Werte für `mode` sind `random`, `artist`, `album` und `balanced`. Ohne Modus in der URL verwendet die App den zuletzt ausgeführten Modus.

Unter **Startlinks** kannst du die gewählte Playlist und den Modus unter einem Namen speichern, etwa **Auto**. Kopiere die angezeigte URL mit `?preset=auto` in die Aktion **URLs öffnen**. Speichere unter demselben Namen erneut, um die Zuordnung zu ändern. Die URL bleibt dabei gleich.

Aktiviere den Direktstart im jeweiligen Startlink, wenn der Shuffle beim Öffnen automatisch beginnen soll. Die Einstellungen gelten für den Browser, in dem du den Startlink gespeichert hast. Bei einer erneuten Spotify-Anmeldung bleibt die Auswahl erhalten. Den Shuffle startest du nach dem Login einmal über die Schaltfläche.

Namen können bis zu 32 Buchstaben (A–Z), Ziffern oder Bindestriche enthalten und beginnen mit einem Buchstaben oder einer Ziffer. Zum Entfernen eines Startlinks wähle **Löschen** neben seinem Namen. Die Spotify-Playlists bleiben erhalten.

Startlinks und Einstellungen liegen im Website-Speicher des Browsers. Ein normales Update unter derselben Adresse oder das reine Leeren des Datei-Caches löscht diese Einstellungen nicht. Wenn du die Website-Daten löschst oder einen anderen Browser beziehungsweise ein anderes Profil verwendest, musst du die Einstellungen dort erneut hinterlegen.

Der Kurzbefehl verwendet **URLs öffnen**, damit der Browser die Web-App ausführt. **Inhalte von URL abrufen** lädt lediglich die Antwort von GitHub Pages und führt den Shuffle nicht aus.

Beim Direktstart braucht die Web-App etwas Zeit, um die Playlist zu laden, zu mischen und die Wiedergabe zu starten. Wenn du im Kurzbefehl anschließend die zuvor geöffnete App oder Spotify in den Vordergrund holst, ist ein fester Timer unabhängig vom tatsächlichen Erfolg des Shuffles.
