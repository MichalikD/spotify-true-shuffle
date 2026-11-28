# Shuffle-Engine

`web/engine.mjs` nimmt normalisierte Tracks entgegen und liefert die gemischten Spotify-URIs. Ein Track hat `uri`, `name`, `artists` und ein `album` mit Name und URI. Die Validierung stellt sicher, dass beim Mischen jeder Titel einschließlich seiner Duplikate erhalten bleibt.

- **Random** verwendet Fisher–Yates.
- **Artist** berücksichtigt den Abstand zu wiederkehrenden Artists und deren Verteilung über die Playlist.
- **Album** wendet eine ähnliche Bewertung auf Alben an.
- **Balanced** gewichtet Artist- und Albumverteilung gemeinsam mit den Standardwerten.
- **Benutzerdefiniert** nutzt denselben Algorithmus mit den gewählten Einstellungen.

Alle Modi verwenden Zufall. Die bewerteten Modi versuchen, Wiederholungen zu verteilen. Bei einer Playlist, die von wenigen Artists oder Alben dominiert wird, können Wiederholungen direkt aufeinanderfolgen. Die Standardwerte liegen in `web/engine/defaults.json`. Der Regler im benutzerdefinierten Modus verschiebt Gewicht zwischen Artist und Album bei konstanter Summe. Der Variationsregler skaliert den Zufallsanteil der Kandidatenbewertung. Die Mitte beider Regler erhält die Balanced-Standardwerte.

`web/playlists.mjs` liest Playlists seitenweise und schreibt das gemischte Ergebnis in Blöcken in die Wiedergabeliste. Die App beginnt die Wiedergabe erst nach dem erfolgreichen Schreiben aller Blöcke.
