# MandaMix — CI/CD (server-side pull auto-deploy)

`git push` to `main` → the server (cron, every minute) detects the new commit, fast-forwards
the code, and rebuilds **only this app's Docker service(s)** — within ~1 minute. **No GitHub
secrets / Actions** required. Persistent data (DB volume, uploads, server `.env`) is never touched.

## How it works
```
push to main ──▶ GitHub
                   ▲ git fetch (read-only deploy key)
   cron (1 min) ──┘
   deploy/auto-deploy.sh:
     fetch → compare HEAD vs origin/main → (unchanged? exit quietly)
     git reset --hard origin/main         # CODE only; volumes & .env are git-ignored
     docker compose -f <file> up -d --build <this app's services>   # (or pull && up -d)
     docker image prune -f                # reclaim disk
```
Safe by design: requires explicit `SERVICES` (never blank → never "all services"), never runs
`down -v` or `volume rm`, and only ever fast-forwards code.

## Files
| File | Purpose |
|---|---|
| `deploy/auto-deploy.sh` | the deploy script (committed; cron points at it) |
| `deploy/deploy.env.example` | template for server-specific config |
| `deploy/deploy.env` | **server-only, git-ignored** — real REPO_DIR/COMPOSE_FILE/SERVICES |
| `deploy/crontab.example` | the cron line |

## One-time setup on the server

> Run as the user that owns the Docker deploy (often `root`). Confirm `docker compose ps`
> works for that user first.

**1. Let the server fetch this private repo (read-only deploy key).** On the server:
```bash
ssh-keygen -t ed25519 -C "mandamix-deploy" -f ~/.ssh/mandamix_deploy -N ""
cat ~/.ssh/mandamix_deploy.pub        # add this PUBLIC key to GitHub → repo → Settings → Deploy keys (read-only)
cat >> ~/.ssh/config <<'EOF'
Host github.com-mandamix
  HostName github.com
  User git
  IdentityFile ~/.ssh/mandamix_deploy
  IdentitiesOnly yes
EOF
```
Point the checkout's remote at that host alias (or just use the existing access if the box can already fetch):
```bash
cd "$REPO_DIR"
git remote set-url origin git@github.com-mandamix:Mavrone81/huayutong.git
git fetch origin main && echo "fetch OK"
```

**2. Configure the deploy:**
```bash
cd "$REPO_DIR"
cp deploy/deploy.env.example deploy/deploy.env
$EDITOR deploy/deploy.env      # set REPO_DIR, COMPOSE_FILE, SERVICES, BUILD_MODE
chmod +x deploy/auto-deploy.sh
```

**3. BACK UP data before the first automated run** (one-time safety):
```bash
# DB (adjust container/user/db names):
docker exec <db-container> pg_dump -U mandamix mandamix | gzip > ~/mandamix-db-$(date +%F).sql.gz
# server .env(s):
cp <server>/.env  ~/mandamix-env-$(date +%F).bak   2>/dev/null || true
# (optional) named-volume snapshot:
docker run --rm -v mmdata:/v -v "$PWD":/b alpine tar czf /b/mmdata-$(date +%F).tgz -C /v .
```

**4. Dry-run the script manually (proves it before cron):**
```bash
deploy/auto-deploy.sh    # with HEAD already == origin it exits silently; force one test by
                         # checking out one commit back, then re-running to watch it redeploy
```

**5. Install the cron job:**
```bash
sudo crontab -e
# paste (adjust path):
* * * * * flock -n /tmp/mandamix-deploy.lock /opt/mandamix/huayutong/deploy/auto-deploy.sh >> /var/log/mandamix-deploy.log 2>&1
systemctl status cron   # or crond — confirm the cron daemon is active
```

## Verify end-to-end
```bash
tail -f /var/log/mandamix-deploy.log          # watch a deploy land
docker compose -f "$COMPOSE_FILE" ps          # this app's services Up; others untouched
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:<port>/   # expect 200
git -C "$REPO_DIR" rev-parse --short HEAD      # matches the pushed commit
```

## Rollback
```bash
cd "$REPO_DIR"
git reset --hard <previous-good-sha>
docker compose -f "$COMPOSE_FILE" up -d --build $SERVICES
```
(Temporarily disable auto-deploy first by commenting the cron line, or it will re-pull `main`.)

## Safety guarantees
- **Data is never destroyed:** the script only `git reset --hard`s code; volumes/bind-mounts/`.env`
  are git-ignored and untouched. No `down -v`, no `volume rm`.
- **Other apps untouched:** every command is scoped to `-f <file>` + explicit `SERVICES`.
- **No overlap:** `flock` ensures one deploy at a time.
- **Disk safe:** `docker image prune -f` removes only dangling images.

## ⚠️ Open items before this is live (need from you)
This repo currently ships **no app Dockerfile and no app service** (the only compose service is
Postgres). So before the deploy can build/restart the app, we must confirm/point at the real
server compose + Dockerfile that runs the Next.js app, then fill `deploy.env` and install cron:
1. SSH access (host/user/auth) so I can do server recon and install + verify.
2. The server's `COMPOSE_FILE` path and the exact `SERVICES` name(s) for this app.
3. Whether that app service uses `build:` (BUILD_MODE=build) or `image:` (BUILD_MODE=pull).
4. That the server can `git fetch` this repo (deploy key step above).
5. prod vs staging (caution level).
