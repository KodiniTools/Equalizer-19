# 🔧 Installation und Setup

## Voraussetzungen

- **Node.js** 20.19 oder höher bzw. 22.12 oder höher (LTS empfohlen)
- **npm** (wird mit Node.js installiert)

## Node.js Installation

Falls Node.js noch nicht installiert ist:

### Windows
1. Besuchen Sie https://nodejs.org/
2. Laden Sie die LTS-Version herunter
3. Führen Sie den Installer aus

### macOS
```bash
# Mit Homebrew
brew install node
```

### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install nodejs
```

## Projekt-Installation

### Schritt 1: Projekt entpacken
Entpacken Sie die ZIP-Datei in einen beliebigen Ordner.

### Schritt 2: Terminal/Kommandozeile öffnen
- **Windows**: Rechtsklick im Projektordner → "Terminal öffnen" oder "Git Bash here"
- **macOS**: Terminal öffnen und `cd` zum Projektordner
- **Linux**: Terminal öffnen und `cd` zum Projektordner

### Schritt 3: Dependencies installieren
```bash
npm install
```

Dies lädt alle benötigten Pakete herunter (dauert ca. 1-2 Minuten).

### Schritt 4: Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung öffnet sich automatisch im Browser unter:
```
http://localhost:3000
```

## Alternative: Ohne Installation testen

Falls Sie Node.js nicht installieren möchten:

### Mit Python (bereits installiert auf macOS/Linux)
```bash
cd equalizer19-vue
python3 -m http.server 8000
```

Dann öffnen: http://localhost:8000

### Mit PHP
```bash
cd equalizer19-vue
php -S localhost:8000
```

Dann öffnen: http://localhost:8000

### Mit VS Code
1. Installieren Sie die Extension "Live Server"
2. Rechtsklick auf `index.html` → "Open with Live Server"

## Production Build erstellen

Für die Verwendung auf einem Webserver:

```bash
npm run build
```

Die fertigen Dateien befinden sich im `dist/` Ordner. Diese können Sie auf jeden Webserver hochladen.

## Problembehebung

### "npm nicht gefunden"
→ Node.js ist nicht installiert oder nicht im PATH. Installieren Sie Node.js neu.

### "EACCES: permission denied"
→ Führen Sie den Befehl mit sudo aus (Linux/macOS):
```bash
sudo npm install
```

### Port 3000 bereits belegt
→ Vite wählt automatisch einen anderen Port (z.B. 3001)

### Build-Fehler
→ Löschen Sie `node_modules` und installieren Sie neu:
```bash
rm -rf node_modules
npm install
```

## Deployment

### Netlify (empfohlen, kostenlos)
1. Erstellen Sie einen Account auf https://netlify.com
2. Ziehen Sie den `dist/` Ordner auf Netlify
3. Fertig! Ihre App ist online

### Vercel (empfohlen, kostenlos)
1. Erstellen Sie einen Account auf https://vercel.com
2. Importieren Sie das Projekt
3. Fertig!

### Eigener Server
Laden Sie einfach den Inhalt des `dist/` Ordners auf Ihren Webserver hoch.

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole (F12)
2. Schauen Sie in die README.md
3. Besuchen Sie https://kodinitools.com

## Updates

Um das Projekt zu aktualisieren:
```bash
npm update
```

Oder für ein komplettes Update:
```bash
rm -rf node_modules package-lock.json
npm install
```
