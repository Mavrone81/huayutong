#!/usr/bin/env bash
# MandaMix auto-deploy — Dockerised stack (web + db via docker compose).
# Cron runs this every minute via flock. It pulls origin/main and, ONLY when
# web/ changed, rebuilds & restarts the `web` service. CODE ONLY:
#   - web/.env.local (secrets) is git-ignored and never touched
#   - the Postgres named volume `mmdata` is never recreated (no down -v / volume rm)
#   - the `db` service is left running untouched (we only act on `web`)
# cron has a minimal PATH, so set an explicit one (docker/git live in /usr/bin here).
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

REPO=/root/huayutong
WEBDIR="$REPO/web"
TS(){ date '+%F %T'; }

cd "$REPO"
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] && exit 0   # nothing new — quiet exit

echo "[$(TS)] new commit ${REMOTE:0:7} (was ${LOCAL:0:7}) — deploying"
CHANGED=$(git --no-pager diff --name-only "$LOCAL" "$REMOTE")
echo "$CHANGED" | sed 's/^/      /'

git reset --hard origin/main          # CODE only; secrets/data untouched

if echo "$CHANGED" | grep -qE '^web/'; then
  GIT_SHA=$(git rev-parse --short HEAD)
  echo "[$(TS)] web/ changed -> rebuild + restart ONLY the web service (GIT_SHA=$GIT_SHA)"
  cd "$WEBDIR"
  GIT_SHA=$GIT_SHA docker compose up -d --build web
  docker image prune -f >/dev/null   # drop dangling layers so the disk doesn't fill
  echo "[$(TS)] deploy complete -> $(git -C "$REPO" rev-parse --short HEAD)"
else
  echo "[$(TS)] no web/ changes — code synced, skipped rebuild -> $(git rev-parse --short HEAD)"
fi
