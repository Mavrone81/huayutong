# MandaMix — CI/CD (server-side pull auto-deploy)

`git push` to `main` → the server (cron, every minute) detects the new commit, fast-forwards
the code, and — **only if `web/` changed** — rebuilds the `web` Docker image and restarts that
container. **No GitHub secrets / Actions.** The database and server secrets are never touched.

## Live setup (production: 165.22.246.45 — huayutong.urbanwerkzsg.com)
- **Stack:** docker compose project `web` from `/root/huayutong/web/docker-compose.yml`:
  - **web:** container `mandamix-web` (Next.js `next start`), published on `127.0.0.1:20001`,
    image built from `web/Dockerfile` with the deployed `GIT_SHA` baked in.
  - **db:** container `mandamix-db` (postgres:16), volume `mmdata`, `127.0.0.1:20002` — **left
    untouched by deploys**; reached by the app over the compose network at `db:5432`.
- **Edge:** nginx terminates TLS for `huayutong.urbanwerkzsg.com` and proxies → `127.0.0.1:20001`.
- **Repo:** `/root/huayutong` (branch `main`).
- **Secrets:** `/root/huayutong/web/.env.local` (git-ignored; injected at runtime via compose
  `env_file`, never baked into the image). `DATABASE_URL` is overridden in compose to `db:5432`.
- **Deploy script:** `/root/auto-deploy-mandamix.sh` (a standalone copy of
  [`auto-deploy-mandamix.sh`](auto-deploy-mandamix.sh) — kept outside the repo so a bad commit
  can't break the deployer).
- **Cron:** `* * * * * flock -n /tmp/mandamix-deploy.lock /root/auto-deploy-mandamix.sh >> /var/log/mandamix-deploy.log 2>&1`
- **Log:** `/var/log/mandamix-deploy.log`

## What the deploy does
```
cd /root/huayutong; git fetch origin main
HEAD == origin/main ?  → exit quietly
else: git reset --hard origin/main                          # CODE only
      web/ changed?  → GIT_SHA=<sha> docker compose up -d --build web ; docker image prune -f
      else           → sync only, skip rebuild              # docs/PRD-only pushes are cheap
```
Safe by design: `git reset --hard` only moves **code**; `web/.env.local` and the Postgres volume
`mmdata` are git-ignored / untouched. The deploy acts on the **`web` service only** — the `db`
container is never recreated. **No `docker compose down -v`, no `volume rm`.**

## Database migrations (manual — NOT auto-applied)
`db/schema.sql` is the full fresh-install schema; the deploy script never touches the DB.
Existing databases apply new deltas in order after pulling (run against `127.0.0.1:20002`):
```bash
for m in /root/huayutong/db/migrations/*.sql; do
  psql "postgresql://mandamix:mandamix@127.0.0.1:20002/mandamix" -v ON_ERROR_STOP=1 -f "$m"
done
```
Application code degrades gracefully if a delta is unapplied, but related features stay dormant.

## Background jobs (billing & notifications)
Driven by cron via the committed [`mandamix-jobs.sh`](mandamix-jobs.sh), which reads
`INTERNAL_BILLING_SECRET` from `web/.env.local` and POSTs the internal endpoints on `localhost:20001`:
```cron
# trial→charge, renewals, dunning retries/downgrade  (every 15 min)
*/15 * * * * /root/huayutong/deploy/mandamix-jobs.sh billing       >> /var/log/mandamix-billing.log 2>&1
# flush due reminders / receipts / dunning prompts     (every 5 min)
*/5  * * * * /root/huayutong/deploy/mandamix-jobs.sh notifications >> /var/log/mandamix-notify.log  2>&1
```
Manual run: `deploy/mandamix-jobs.sh all`.

## Verify
```bash
tail -f /var/log/mandamix-deploy.log
git -C /root/huayutong rev-parse --short HEAD             # the checked-out commit
curl -s localhost:20001/api/v1/version                    # {"status":"ok","commit":"<sha>","builtAt":...}
docker compose -f /root/huayutong/web/docker-compose.yml ps   # mandamix-web + mandamix-db up
curl -s -o /dev/null -w '%{http_code}\n' https://huayutong.urbanwerkzsg.com/api/v1/version
```
> `version.commit` is baked in at build time, so it confirms the **built/running** commit — if it
> lags `git rev-parse HEAD`, the rebuild didn't run (check the deploy log).

## Rollback
```bash
# stop auto-deploy first or it will re-pull main:
crontab -l | grep -v auto-deploy-mandamix | crontab -    # (or comment the line)
cd /root/huayutong && git reset --hard <previous-good-sha>
cd web && GIT_SHA=$(git rev-parse --short HEAD) docker compose up -d --build web
# then re-add the cron line
```

## Notes / gotchas
- **Brief restart** (~5–15 s) on :20001 when `web/` changes (`up -d --build web` recreates the
  container after the image build). The build runs while the old container keeps serving; the
  swap is the only downtime. Ask if you need zero-downtime (blue/green on a temp port + nginx flip).
- **DB schema/seed changes do NOT auto-apply** — `db/*.sql` only run on first DB init (the volume
  persists by design, so no data wipe). Run migrations manually (above).
- **First-time bootstrap** (new box): clone repo, create `web/.env.local`, then
  `cd web && GIT_SHA=$(git -C .. rev-parse --short HEAD) docker compose up -d --build`, point nginx
  at `127.0.0.1:20001`, install the cron lines above.
- **Backups before risky changes:** `cp web/.env.local ~/mandamix-env-$(date +%F).bak` and
  `docker exec mandamix-db pg_dump -U mandamix mandamix | gzip > ~/mandamix-db-$(date +%F).sql.gz`.
