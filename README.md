# Spotify True Shuffle

Spotify True Shuffle erzeugt eine neue Reihenfolge für deine Spotify-Playlist und startet sie in einer separaten Wiedergabeliste. Die statische Web-App läuft im Browser auf GitHub Pages. Sie benötigt keinen eigenen Server.

**[Web-App öffnen](https://michalikd.github.io/spotify-true-shuffle/web/)** · [Einrichtung und iOS-Kurzbefehl](docs/setup.md)

| Modus | Verhalten |
| --- | --- |
| Random | Mischt die Titel per Fisher–Yates. |
| Artist | Verteilt wiederkehrende Artists über die Playlist. |
| Album | Verteilt Titel desselben Albums über die Playlist. |
| Balanced | Berücksichtigt Artist und Album gemeinsam. |

Die App speichert Einstellungen und Startlinks im Browser. Auf dem iPhone kann ein Kurzbefehl über **URLs öffnen** ein gespeichertes Preset starten. Die Wiedergabe benötigt Spotify Premium. Mit der offiziellen Spotify-API kannst du eigene Playlists und Listen verwenden, bei denen du mitwirkst.

## Entwicklung

`web/` enthält die App, die Spotify-Anbindung und die [Shuffle-Engine](docs/engine.md). Starte im Repo-Stammverzeichnis `python3 -m http.server 8000 --bind 127.0.0.1` und öffne `http://127.0.0.1:8000/web/`. Für einen echten Spotify-Login muss auch diese Callback-URL in deiner Spotify-App hinterlegt sein.

Der bisherige Stand mit Scriptable, dem iOS-Installer und dem optionalen Node.js-Dienst liegt auf dem [Archivbranch](https://github.com/MichalikD/spotify-true-shuffle/tree/archive/pre-web-cleanup). Die öffentliche Web-App verwendet weiter `/web/`. Der alte Login an der Projektwurzel und die Installer-Seite werden durch den Web-Einstieg abgelöst.
