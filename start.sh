#!/bin/bash

echo "========================================"
echo "  EQUALIZER 19 - Vue 3 Edition"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "FEHLER: Node.js ist nicht installiert!"
    echo "Bitte installieren Sie Node.js von https://nodejs.org/"
    echo ""
    exit 1
fi

echo "Node.js gefunden: $(node --version)"
echo ""

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "Installiere Dependencies..."
    echo "Dies kann beim ersten Start einige Minuten dauern..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "FEHLER beim Installieren der Dependencies!"
        exit 1
    fi
fi

echo ""
echo "Starte Entwicklungsserver..."
echo "Die Anwendung öffnet sich automatisch im Browser."
echo ""
echo "Drücken Sie STRG+C zum Beenden."
echo ""

npm run dev
