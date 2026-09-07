#!/usr/bin/env bash
# =============================================================================
#  Equalizer 19 – Deploy-Skript (statisches Vue/Vite-Frontend)
#
#  Ablauf:
#    1. Quellcode nach $APP_DIR/src klonen bzw. aktualisieren (git)
#    2. Abhängigkeiten installieren (npm ci) und bauen (vite build)
#    3. Build prüfen (index.html, Base-Pfad /equaliser19/)
#    4. Aktuellen Webroot nach $APP_DIR/backups/<zeitstempel> sichern
#    5. dist/ per rsync nach $WEB_ROOT deployen, Rechte setzen
#    6. Health-Check über HTTP(S)
#
#  Aufruf (auf dem Server, als root oder mit sudo):
#    /opt/equaliser19/deploy.sh                 # Branch "main" deployen
#    BRANCH=feature-x /opt/equaliser19/deploy.sh
#    /opt/equaliser19/deploy.sh rollback        # letztes Backup zurückspielen
#    /opt/equaliser19/deploy.sh rollback 20260907-120000
#    /opt/equaliser19/deploy.sh list-backups
#
#  Alle Pfade lassen sich per Umgebungsvariable überschreiben (siehe unten).
# =============================================================================
set -Eeuo pipefail

# ----------------------------------------------------------------------------
# Konfiguration
# ----------------------------------------------------------------------------
REPO_URL="${REPO_URL:-https://github.com/KodiniTools/Equalizer-19.git}"
BRANCH="${BRANCH:-main}"

APP_DIR="${APP_DIR:-/opt/equaliser19}"          # Arbeitsverzeichnis (Quellen, Backups)
SRC_DIR="${SRC_DIR:-$APP_DIR/src}"              # Git-Checkout
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"    # Sicherungen des Webroots
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"               # Anzahl aufzubewahrender Backups

WEB_ROOT="${WEB_ROOT:-/var/www/kodinitools.com/equaliser19}"
WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"

BASE_PATH="${BASE_PATH:-/equaliser19/}"         # muss zu vite.config.js + nginx alias passen
HEALTH_URL="${HEALTH_URL:-https://kodinitools.com/equaliser19/}"
SKIP_HEALTHCHECK="${SKIP_HEALTHCHECK:-0}"
MIN_NODE_MAJOR="${MIN_NODE_MAJOR:-18}"

# ----------------------------------------------------------------------------
# Hilfsfunktionen
# ----------------------------------------------------------------------------
log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[  ok  ]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[ warn ]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[ fail ]\033[0m %s\n' "$*" >&2; exit 1; }

on_error() {
  local line=$1
  die "Abbruch in Zeile $line. Webroot wurde NICHT verändert, falls der Fehler vor dem Deploy-Schritt auftrat. Rollback: $0 rollback"
}
trap 'on_error $LINENO' ERR

require_root() {
  [[ "${EUID}" -eq 0 ]] || die "Bitte als root ausführen (sudo $0 ...). Nötig für $APP_DIR und $WEB_ROOT."
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Benötigtes Programm fehlt: $1  ($2)"
}

check_prereqs() {
  require_cmd git   "apt install git"
  require_cmd rsync "apt install rsync"
  require_cmd curl  "apt install curl"
  require_cmd node  "Node.js >= $MIN_NODE_MAJOR installieren, siehe DEPLOY.md"
  require_cmd npm   "kommt mit Node.js"

  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "$major" -ge "$MIN_NODE_MAJOR" ]] || die "Node.js $major gefunden, benötigt wird >= $MIN_NODE_MAJOR."
  ok "Voraussetzungen: git, rsync, curl, node $(node -v), npm $(npm -v)"
}

prepare_dirs() {
  mkdir -p "$APP_DIR" "$BACKUP_DIR"
  mkdir -p "$WEB_ROOT"
  ok "Verzeichnisse vorhanden: $APP_DIR, $BACKUP_DIR, $WEB_ROOT"
}

# ----------------------------------------------------------------------------
# Schritt 1: Quellcode holen
# ----------------------------------------------------------------------------
fetch_source() {
  if [[ -d "$SRC_DIR/.git" ]]; then
    log "Aktualisiere Repository in $SRC_DIR (Branch: $BRANCH)"
    git -C "$SRC_DIR" remote set-url origin "$REPO_URL"
    git -C "$SRC_DIR" fetch --prune origin "$BRANCH"
    git -C "$SRC_DIR" checkout -q -B "$BRANCH" "origin/$BRANCH"
    git -C "$SRC_DIR" reset -q --hard "origin/$BRANCH"
  else
    log "Klone $REPO_URL (Branch: $BRANCH) nach $SRC_DIR"
    rm -rf "$SRC_DIR"
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$SRC_DIR"
  fi
  # root-Checkouts in /opt gelten für git sonst als "unsafe"
  git config --global --add safe.directory "$SRC_DIR" >/dev/null 2>&1 || true

  DEPLOY_COMMIT="$(git -C "$SRC_DIR" rev-parse --short HEAD)"
  DEPLOY_SUBJECT="$(git -C "$SRC_DIR" log -1 --pretty=%s)"
  ok "Stand: $BRANCH @ $DEPLOY_COMMIT – $DEPLOY_SUBJECT"
}

# ----------------------------------------------------------------------------
# Schritt 2: Bauen
# ----------------------------------------------------------------------------
build() {
  log "Installiere Abhängigkeiten (npm ci)"
  ( cd "$SRC_DIR" && npm ci --no-audit --no-fund --loglevel=error )

  log "Baue Produktions-Build (vite build)"
  ( cd "$SRC_DIR" && rm -rf dist && npm run build --silent )
  ok "Build fertig: $SRC_DIR/dist"
}

# ----------------------------------------------------------------------------
# Schritt 3: Build prüfen
# ----------------------------------------------------------------------------
verify_build() {
  local dist="$SRC_DIR/dist"
  [[ -f "$dist/index.html" ]] || die "dist/index.html fehlt – Build fehlgeschlagen?"
  [[ -d "$dist/assets" ]]     || die "dist/assets fehlt – Build unvollständig?"

  # Base-Pfad muss zum nginx-alias passen, sonst 404 auf alle Assets
  grep -q "src=\"${BASE_PATH}assets/" "$dist/index.html" \
    || die "index.html referenziert Assets nicht unter ${BASE_PATH}assets/. vite.config.js 'base' prüfen."

  ok "Build geprüft: index.html + assets, Base-Pfad $BASE_PATH"
}

# ----------------------------------------------------------------------------
# Schritt 4: Backup des aktuellen Webroots
# ----------------------------------------------------------------------------
backup_current() {
  if [[ -z "$(ls -A "$WEB_ROOT" 2>/dev/null)" ]]; then
    warn "Webroot ist leer, kein Backup nötig."
    return
  fi
  local stamp; stamp="$(date +%Y%m%d-%H%M%S)"
  local target="$BACKUP_DIR/$stamp"
  mkdir -p "$target"
  rsync -a "$WEB_ROOT/" "$target/"
  ok "Backup: $target"

  # alte Backups aufräumen
  local old
  old="$(ls -1d "$BACKUP_DIR"/*/ 2>/dev/null | sort | head -n -"$KEEP_BACKUPS" || true)"
  if [[ -n "$old" ]]; then
    echo "$old" | xargs -r rm -rf
    log "Alte Backups entfernt (behalte $KEEP_BACKUPS)."
  fi
}

# ----------------------------------------------------------------------------
# Schritt 5: Deploy
# ----------------------------------------------------------------------------
deploy_files() {
  log "Deploye nach $WEB_ROOT"
  rsync -a --delete "$SRC_DIR/dist/" "$WEB_ROOT/"

  chown -R "$WEB_USER:$WEB_GROUP" "$WEB_ROOT"
  find "$WEB_ROOT" -type d -exec chmod 755 {} +
  find "$WEB_ROOT" -type f -exec chmod 644 {} +

  printf 'branch=%s\ncommit=%s\nsubject=%s\ndeployed_at=%s\n' \
    "$BRANCH" "$DEPLOY_COMMIT" "$DEPLOY_SUBJECT" "$(date -Is)" > "$APP_DIR/last-deploy.txt"
  ok "Dateien deployed, Besitzer $WEB_USER:$WEB_GROUP"
}

# ----------------------------------------------------------------------------
# Schritt 6: Health-Check
# ----------------------------------------------------------------------------
healthcheck() {
  if [[ "$SKIP_HEALTHCHECK" == "1" ]]; then
    warn "Health-Check übersprungen (SKIP_HEALTHCHECK=1)."
    return
  fi
  log "Health-Check: $HEALTH_URL"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$HEALTH_URL" || echo "000")"
  [[ "$code" == "200" ]] || die "Startseite liefert HTTP $code (erwartet 200). Rollback: $0 rollback"

  # erstes JS-Asset aus index.html laden – erkennt falschen Base-Pfad / alias
  local asset
  asset="$(grep -o "src=\"${BASE_PATH}assets/[^\"]*\"" "$WEB_ROOT/index.html" | head -1 | sed 's/src="//; s/"$//')"
  if [[ -n "$asset" ]]; then
    local origin="${HEALTH_URL%%"$BASE_PATH"*}"
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$origin$asset" || echo "000")"
    [[ "$code" == "200" ]] || die "Asset $asset liefert HTTP $code. nginx alias / Base-Pfad prüfen. Rollback: $0 rollback"
  fi
  ok "Health-Check bestanden (HTTP 200)."
}

# ----------------------------------------------------------------------------
# Rollback / Backup-Liste
# ----------------------------------------------------------------------------
list_backups() {
  log "Backups in $BACKUP_DIR:"
  ls -1d "$BACKUP_DIR"/*/ 2>/dev/null | xargs -rn1 basename || echo "  (keine)"
}

rollback() {
  local name="${1:-}"
  local source
  if [[ -z "$name" ]]; then
    source="$(ls -1d "$BACKUP_DIR"/*/ 2>/dev/null | sort | tail -n 1 || true)"
    [[ -n "$source" ]] || die "Kein Backup in $BACKUP_DIR vorhanden."
  else
    source="$BACKUP_DIR/$name/"
    [[ -d "$source" ]] || die "Backup $name nicht gefunden. Verfügbar: $(ls -1 "$BACKUP_DIR" | tr '\n' ' ')"
  fi
  log "Rollback von $source nach $WEB_ROOT"
  rsync -a --delete "$source" "$WEB_ROOT/"
  chown -R "$WEB_USER:$WEB_GROUP" "$WEB_ROOT"
  ok "Rollback abgeschlossen."
  healthcheck
}

# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
main() {
  local cmd="${1:-deploy}"
  case "$cmd" in
    deploy)
      require_root
      check_prereqs
      prepare_dirs
      fetch_source
      build
      verify_build
      backup_current
      deploy_files
      healthcheck
      ok "Deploy abgeschlossen: $BRANCH @ $DEPLOY_COMMIT → $HEALTH_URL"
      ;;
    rollback)
      require_root
      require_cmd rsync "apt install rsync"
      require_cmd curl  "apt install curl"
      rollback "${2:-}"
      ;;
    list-backups)
      list_backups
      ;;
    -h|--help|help)
      sed -n '2,20p' "$0"
      ;;
    *)
      die "Unbekannter Befehl: $cmd (deploy | rollback [name] | list-backups)"
      ;;
  esac
}

main "$@"
