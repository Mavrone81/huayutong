# MandaMix — CI/CD (server-side pull auto-deploy)

`git push` to `main` → the server (cron, every minute) detects the new commit, fast-forwards
the code, and — **only if `web/` changed** — rebuilds the Next app and reloads it. **No GitHub
secrets / Actions.** The database and server secrets are never touched.

## Live setup (production: 157.230.240.163)
- **App:** PM2 process `huayutong-web` (fork) running `next start`, cwd `/root/huayutong/web`,
  **PORT 20001**, Node v20 (nvm). *(Not Docker — only the DB is containerised.)*
- **DB:** Docker `mandamix-db` (postgres:16, volume `mmdata`, :20002) — left untouched by deploys.
- **Repo:** `/root/huayutong` (branch `main`).
- **Secrets:** `/root/huayutong/web/.env.local` (git-ignored; loaded by Next at runtime).
- **Deploy script:** `/root/auto-deploy-mandamix.sh` (a standalone copy of
  [`auto-deploy-mandamix.sh`](auto-deploy-mandamix.sh) — kept outside the repo so a bad commit
  can't break the deployer).
- **Cron:** `* * * * * flock -n /tmp/mandamix-deploy.lock /root/auto-deploy-mandamix.sh >> /var/log/mandamix-deploy.log 2>&1`
- **Log:** `/var/log/mandamix-deploy.log`

## What the deploy does
```
cd /root/huayutong; git fetch origin main
HEAD == origin/main ?  → exit quietly
else: git reset --hard origin/main           # CODE only
      web/ changed?  → (web/package*.json changed? npm ci) ; npm run build ; pm2 reload huayutong-web
      else           → sync only, skip rebuild   # docs/PRD-only pushes are cheap
```
Safe by design: `git reset --hard` only moves **code**; `web/.env.local`, `node_modules`, `.next`
and the Docker DB volume are git-ignored / untouched. **No `docker compose down -v`, no
`volume rm`** — the DB is never recreated.

## Verify
```bash
tail -f /var/log/mandamix-deploy.log
git -C /root/huayutong rev-parse --short HEAD          # == the pushed commit
curl -s localhost:20001/api/v1/version                  # {"status":"ok",...}
pm2 ls                                                   # huayutong-web online; others untouched
```

## Rollback
```bash
# stop auto-deploy first or it will re-pull main:
crontab -e   # comment the mandamix line
cd /root/huayutong && git reset --hard <previous-good-sha>
cd web && npm ci && npm run build && pm2 reload huayutong-web
```

## Notes / gotchas
- **Brief reload** (~1–2 s) on :20001 when `web/` changes (PM2 fork reload ≈ restart). Ask if you
  need zero-downtime (build-to-temp + atomic swap, or cluster mode).
- **DB schema/seed changes do NOT auto-apply** — `db/*.sql` only run on first DB init (the volume
  persists by design, so no data wipe). Run migrations manually.
- **First-time bootstrap** (if recreating on a new box): clone repo, create `web/.env.local`,
  `cd web && npm ci && npm run build`, `PORT=20001 pm2 start npm --name huayutong-web -- start`,
  bring up the DB with `docker compose -f web/docker-compose.yml up -d db`, install the cron above.
- **Backups before first run:** `cp web/.env.local ~/mandamix-env-$(date +%F).bak` and
  `docker exec mandamix-db pg_dump -U mandamix mandamix | gzip > ~/mandamix-db-$(date +%F).sql.gz`.
