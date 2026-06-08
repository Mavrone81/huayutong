#!/usr/bin/env bash
# MandaMix auto-deploy (PM2 app + Dockerised DB).
# Cron runs this every minute via flock. Pulls origin/main; rebuilds the Next
# app ONLY when web/ changes; reloads PM2. CODE ONLY: web/.env.local,
# node_modules, .next and the Docker DB volume (mmdata) are git-ignored /
# untouched. The database is never touched by this script.
set -euo pipefail
export PATH=/root/.nvm/versions/node/v20.19.4/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

REPO=/root/huayutong
APP="$REPO/web"
APPNAME=huayutong-web
TS(){ date '+%F %T'; }

cd "$REPO"
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] && exit 0   # nothing new — quiet exit

echo "[$(TS)] new commit ${REMOTE:0:7} (was ${LOCAL:0:7}) — deploying"
CHANGED=$(git --no-pager diff --name-only "$LOCAL" "$REMOTE")
echo "$CHANGED" | sed 's/^/      /'

git reset --hard origin/main          # code only; secrets/data untouched

if echo "$CHANGED" | grep -qE '^web/'; then
  cd "$APP"
  # reinstall deps only when they change (npm ci is a full reinstall)
  if echo "$CHANGED" | grep -qE '^web/package(-lock)?\.json$'; then
    echo "[$(TS)] deps changed -> npm ci"; npm ci
  fi
  echo "[$(TS)] building Next app"; npm run build
  pm2 reload "$APPNAME"
  echo "[$(TS)] deploy complete (rebuilt) -> $(git -C "$REPO" rev-parse --short HEAD)"
else
  echo "[$(TS)] no web/ changes — code synced, skipped build/reload -> $(git rev-parse --short HEAD)"
fi
