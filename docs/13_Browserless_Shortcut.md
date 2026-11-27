# Spotify True Shuffle ohne Safari starten

Der optionale Dienst nimmt einen authentifizierten HTTP-Aufruf vom iPhone an und spricht direkt mit Spotify. Die Browser-App bleibt separat. Der Dienst ist für ein Spotify-Konto und eine laufende Instanz ausgelegt. Er kann auf einem Node.js-Host oder einem Docker-Host mit dauerhaftem Speicher laufen.

## Einmalige Einrichtung

1. Kopiere `server/.env.example` nach `server/.env`. Für den Test am selben Rechner kannst du `http://127.0.0.1:8080` verwenden. Für den Aufruf vom iPhone brauchst du eine vom iPhone erreichbare HTTPS-Adresse. Hinterlege sie als `PUBLIC_URL`, ohne einen zusätzlichen Pfad. Der Dienst spricht hinter dem HTTPS-Proxy lokal HTTP.
2. Trage die Spotify Client-ID und die ID oder URL einer **eigenen, separaten Zielplaylist** ein. Deren Inhalt wird beim Shuffle ersetzt. Lege unter `PRESETS_JSON` die Quelle und den Modus pro Name fest. Verfügbare Modi sind `random`, `artist`, `album` und `balanced`. Die Quelle muss sich vom Ziel unterscheiden. Web-Presets sind lokal im Browser gespeichert und werden hier separat eingetragen.
3. Erzeuge zwei verschiedene Schlüssel, beispielsweise zweimal mit `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Verwende `SETUP_KEY` nur zur Spotify-Anmeldung und `SHORTCUT_KEY` im Kurzbefehl. Spotify-Tokens werden beim Dienst gespeichert.
4. Ergänze im Spotify Developer Dashboard die genaue Redirect-URI `PUBLIC_URL/callback`, zum Beispiel `http://127.0.0.1:8080/callback` für den lokalen Test. Die Redirect-URI deiner GitHub-Pages-Web-App bleibt eine separate Adresse.
5. Starte den Dienst und öffne einmal `PUBLIC_URL/connect`. Gib den Einrichtungsschlüssel ein und autorisiere Spotify. Ist der Refresh-Token später nicht mehr gültig, wiederhole diesen Schritt.

### Starten

Mit Node.js 24 aus dem Repo-Stammverzeichnis:

```sh
node --env-file=server/.env server/index.mjs
```

Mit Docker aus dem Repo-Stammverzeichnis:

```sh
docker build -f server/Dockerfile -t spotify-true-shuffle .
docker run --rm --env-file server/.env -p 127.0.0.1:8080:8080 \
  -v true-shuffle-data:/data spotify-true-shuffle
```

Bei einem gehosteten Container setze die Umgebungsvariablen beim Anbieter, leite HTTPS an Port 8080 weiter und hänge einen dauerhaften Speicher unter `/data` ein. Der Prüfpfad ist `GET /healthz`. Verwende eine Instanz. Bei mehreren Instanzen könnten zwei Prozesse gleichzeitig dieselbe Zielplaylist verändern.

Für lokale Tests ohne Spotify-Konto führt `node --test server/index.test.mjs` den Dienst mit simulierten Spotify-Antworten aus.

## Kurzbefehl auf dem iPhone

Verwende die Aktion **Inhalte von URL abrufen** mit deiner HTTPS-Adresse plus `/shuffle`:

| Einstellung | Wert |
| --- | --- |
| Methode | `POST` |
| Header | `Authorization: Bearer <SHORTCUT_KEY>` |
| Anforderungstext | JSON |
| JSON-Textfeld | `preset` mit dem Wert `auto` oder einem deiner Preset-Namen |

Der Dienst antwortet bei Erfolg mit `ok`, der Anzahl gemischter Titel, dem Modus und dem Link zur Zielplaylist. Bei einem Fehler enthält die Antwort eine Meldung. Spotify Premium und ein aktives Wiedergabegerät werden für den Wiedergabestart benötigt. Ist kein Gerät aktiv, bleibt die bereits erzeugte Reihenfolge in der Zielplaylist verfügbar.

Die Adresse und der Schlüssel im Kurzbefehl bleiben beim Ändern der Presets gleich. Aktualisiere dazu die Konfiguration des Dienstes und starte ihn neu.
