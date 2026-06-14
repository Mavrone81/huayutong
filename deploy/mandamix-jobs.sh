#!/usr/bin/env bash
# MandaMix background jobs — driven by cron on the app host.
#   run-billing       : trial→charge, renewals, dunning retries/downgrade
#   run-notifications : flush due reminders / receipts / dunning prompts
#
# Both internal endpoints require the x-internal-secret header. The secret is read
# from $INTERNAL_BILLING_SECRET or, failing that, from web/.env.local.
#
# Usage: mandamix-jobs.sh [billing|notifications|all]   (default: all)
# Cron example:
#   */15 * * * * /root/huayutong/deploy/mandamix-jobs.sh billing       >> /var/log/mandamix-billing.log 2>&1
#   */5  * * * * /root/huayutong/deploy/mandamix-jobs.sh notifications >> /var/log/mandamix-notify.log  2>&1
set -euo pipefail

PORT="${MANDAMIX_PORT:-20001}"
ENVFILE="${MANDAMIX_ENV:-/root/huayutong/web/.env.local}"
SECRET="${INTERNAL_BILLING_SECRET:-}"

if [ -z "$SECRET" ] && [ -f "$ENVFILE" ]; then
  # take the value after the first '=', strip surrounding quotes
  SECRET="$(sed -n 's/^INTERNAL_BILLING_SECRET=//p' "$ENVFILE" | head -1 | tr -d '"'"'"'\r')"
fi
[ -n "$SECRET" ] || { echo "[$(date '+%F %T')] INTERNAL_BILLING_SECRET not set (env or $ENVFILE)"; exit 1; }

BASE="http://localhost:${PORT}/api/v1/internal"
hit() {
  echo "[$(date '+%F %T')] POST /$1"
  curl -fsS -X POST "$BASE/$1" -H "x-internal-secret: $SECRET" -H "content-type: application/json" -d '{}'
  echo
}

case "${1:-all}" in
  billing)        hit run-billing ;;
  notifications)  hit run-notifications ;;
  all)            hit run-billing; hit run-notifications ;;
  *)              echo "usage: $0 [billing|notifications|all]"; exit 2 ;;
esac
