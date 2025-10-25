@echo off
echo ========================================
echo   EQUALIZER 19 - Vue 3 Edition
echo ========================================
echo.
echo Pruefe Node.js Installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER: Node.js ist nicht installiert!
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js gefunden!
echo.

if not exist "node_modules\" (
    echo Installiere Dependencies...
    echo Dies kann beim ersten Start einige Minuten dauern...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo FEHLER beim Installieren der Dependencies!
        pause
        exit /b 1
    )
)

echo.
echo Starte Entwicklungsserver...
echo Die Anwendung oeffnet sich automatisch im Browser.
echo.
echo Druecken Sie STRG+C zum Beenden.
echo.
call npm run dev

pause
