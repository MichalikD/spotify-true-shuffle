# Shuffle-Engine

`web/engine.mjs` nimmt normalisierte Tracks entgegen und liefert die gemischten Spotify-URIs. Ein Track hat `uri`, `name`, `artists` und ein `album` mit Name und URI. Die Validierung stellt sicher, dass beim Mischen jeder Titel einschließlich seiner Duplikate erhalten bleibt.

- **Random** verwendet Fisher–Yates.
- **Artist** berücksichtigt den Abstand zu wiederkehrenden Artists und deren Verteilung über die Playlist.
- **Album** wendet eine ähnliche Bewertung auf Alben an.
- **Balanced** gewichtet Artist- und Albumverteilung gemeinsam.

Alle Modi verwenden Zufall. Die bewerteten Modi versuchen, Wiederholungen zu verteilen. Bei einer Playlist, die von wenigen Artists oder Alben dominiert wird, können Wiederholungen direkt aufeinanderfolgen. Die Gewichte und Standardwerte liegen in `web/engine/defaults.json`.

`web/playlists.mjs` liest Playlists seitenweise und schreibt das gemischte Ergebnis in Blöcken in die Wiedergabeliste. Die App beginnt die Wiedergabe erst nach dem erfolgreichen Schreiben aller Blöcke.
