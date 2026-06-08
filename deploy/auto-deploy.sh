#!/usr/bin/env bash
# =============================================================================
# MandaMix — server-side pull-based auto-deploy
# Cron runs this every minute. It fast-forwards code to origin/<branch> and
# rebuilds ONLY the configured service(s). It NEVER touches named volumes,
# bind-mounted data, or the server .env — those are git-ignored and persist.
# Config lives in deploy.env next to this script (git-ignored). See DEPLOY.md.
# =============================================================================
set -euo pipefail

# Cron has a minimal PATH; set it explicitly so git/docker/flock resolve.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"
# shellcheck disable=SC1090
[ -f "$CONF" ] && . "$CONF"

# Required config (fail loudly if missing — refuse to guess).
REPO_DIR="${REPO_DIR:?set REPO_DIR in deploy.env}"
COMPOSE_FILE="${COMPOSE_FILE:?set COMPOSE_FILE in deploy.env}"
SERVICES="${SERVICES:?set SERVICES in deploy.env (space-separated; NEVER blank — blank would target all services)}"
BRANCH="${BRANCH:-main}"
BUILD_MODE="${BUILD_MODE:-build}"   # build | pull

ts()  { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }
die() { log "ERROR: $*"; exit 1; }

# docker compose v2 ("docker compose") vs legacy ("docker-compose")
if docker compose version >/dev/null 2>&1; then DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then DC="docker-compose"
else die "docker compose not found on PATH"; fi

[ -d "$REPO_DIR/.git" ] || die "REPO_DIR is not a git checkout: $REPO_DIR"
cd "$REPO_DIR"

# --- 1. check for new code (quiet on no-op; cron runs every minute) ---
git fetch --quiet origin "$BRANCH" || die "git fetch failed"
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"
[ "$LOCAL" = "$REMOTE" ] && exit 0

log "New commit on origin/$BRANCH: ${LOCAL:0:7} -> ${REMOTE:0:7}"
log "Changed files:"
git --no-pager diff --name-only "$LOCAL" "$REMOTE" | sed 's/^/      /'

# --- 2. fast-forward CODE only (volumes & .env are git-ignored) ---
git reset --hard "origin/$BRANCH"
log "Code now at $(git rev-parse --short HEAD)"

[ -f "$COMPOSE_FILE" ] || die "compose file not found: $COMPOSE_FILE"

# --- 3. rebuild/restart ONLY this app's service(s) ---
# (Named volumes & bind mounts are untouched by up/build; no down -v ever.)
if [ "$BUILD_MODE" = "pull" ]; then
  log "Pulling images: $SERVICES"
  $DC -f "$COMPOSE_FILE" pull $SERVICES
  $DC -f "$COMPOSE_FILE" up -d $SERVICES
else
  log "Rebuilding + restarting: $SERVICES"
  $DC -f "$COMPOSE_FILE" up -d --build $SERVICES
fi

log "Service status:"
$DC -f "$COMPOSE_FILE" ps $SERVICES | sed 's/^/      /'

# --- 4. reclaim disk from dangling images ---
docker image prune -f >/dev/null 2>&1 || true
log "Deploy complete @ $(git rev-parse --short HEAD)"
