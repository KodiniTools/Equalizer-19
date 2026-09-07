# Deployment auf kodinitools.com

Equalizer 19 ist ein rein statisches Vue/Vite-Frontend. Es gibt kein Backend:
die Nginx-Locations `/equaliser19/api/`, `/equaliser19/files/` und
`/equaliser19/health` (Port 9013) werden von dieser App nicht benutzt und
können unverändert bleiben.

Deployt wird der Inhalt von `dist/` nach `/var/www/kodinitools.com/equaliser19/`.
`vite.config.js` (`base: '/equaliser19/'`) und der Router-Base-Pfad passen
bereits zum Nginx-`alias`.

## 1. Einmalige Vorbereitung auf dem Server (als root)

```bash
# Werkzeuge
apt update && apt install -y git rsync curl

# Node.js >= 18 (nur falls nicht vorhanden; prüfen mit: node -v)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Arbeitsverzeichnis anlegen und deploy.sh holen
mkdir -p /opt/equaliser19
curl -fsSL https://raw.githubusercontent.com/KodiniTools/Equalizer-19/main/deploy.sh \
  -o /opt/equaliser19/deploy.sh
chmod +x /opt/equaliser19/deploy.sh

# Webroot anlegen (falls noch nicht vorhanden)
mkdir -p /var/www/kodinitools.com/equaliser19
chown www-data:www-data /var/www/kodinitools.com/equaliser19
```

Ergebnis in `/opt/equaliser19/`:

```
/opt/equaliser19/
├── deploy.sh          # dieses Skript
├── src/               # Git-Checkout (wird beim ersten Deploy angelegt)
├── backups/           # Sicherungen des Webroots, je Deploy ein Ordner
└── last-deploy.txt    # Branch, Commit, Zeitpunkt des letzten Deploys
```

## 2. Deployen

```bash
# Branch "main" bauen und deployen
sudo /opt/equaliser19/deploy.sh

# Einen anderen Branch deployen
sudo BRANCH=claude/filter-vs-echte-prozesse-yo3nby /opt/equaliser19/deploy.sh
```

Das Skript führt aus: git clone/fetch → `npm ci` → `vite build` → Build-Prüfung
(Base-Pfad `/equaliser19/`) → Backup des Webroots → rsync nach Webroot →
Rechte `www-data`, 755/644 → Health-Check auf `https://kodinitools.com/equaliser19/`
inklusive erstem JS-Asset.

Nginx muss nicht neu geladen werden, es werden nur statische Dateien ersetzt.

## 3. Rollback

```bash
sudo /opt/equaliser19/deploy.sh list-backups
sudo /opt/equaliser19/deploy.sh rollback                # letztes Backup
sudo /opt/equaliser19/deploy.sh rollback 20260907-120000
```

## 4. Konfiguration per Umgebungsvariable

| Variable           | Standard                                   | Bedeutung                              |
|--------------------|--------------------------------------------|----------------------------------------|
| `BRANCH`           | `main`                                     | zu deployender Git-Branch              |
| `REPO_URL`         | `https://github.com/KodiniTools/Equalizer-19.git` | Quelle                          |
| `APP_DIR`          | `/opt/equaliser19`                         | Arbeitsverzeichnis                     |
| `WEB_ROOT`         | `/var/www/kodinitools.com/equaliser19`     | Zielverzeichnis (Nginx `alias`)        |
| `WEB_USER`/`WEB_GROUP` | `www-data`                             | Besitzer der deployten Dateien         |
| `KEEP_BACKUPS`     | `5`                                        | Anzahl aufbewahrter Backups            |
| `HEALTH_URL`       | `https://kodinitools.com/equaliser19/`     | URL für den Health-Check               |
| `SKIP_HEALTHCHECK` | `0`                                        | `1` = Health-Check überspringen        |

## 5. Hinweise

- `index.html` bindet `/fontawesome/...` und die SSI-Partials
  (`/partials/nav.html` usw.) der Hauptseite ein. Der Snippet
  `kodini-spa-static.conf` muss dafür wie bei den anderen KodiniTools-Apps
  `ssi on` gesetzt haben.
- Das Skript bricht bei jedem Fehler ab. Tritt der Fehler vor dem Schritt
  „Deploye nach …“ auf, ist der Webroot unverändert.
- Der Health-Check schlägt fehl, wenn Startseite oder erstes JS-Asset nicht
  mit HTTP 200 antworten. Dann `rollback` ausführen und Nginx-`alias` prüfen.
