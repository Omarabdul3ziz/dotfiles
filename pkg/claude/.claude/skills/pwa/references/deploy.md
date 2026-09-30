# /pwa deploy (alias: verify)

Goal: the built app, matching the plan, running on the homelab, tested there,
and the user holding a working URL.

## 1. Boundaries — does the build match the plan?

Before touching the host, audit (use a subagent for the sweep):

- every phase's acceptance criteria → pass/fail, with evidence (test name,
  screenshot, command)
- every screen and rule in the plan exists; every edge-case row has a test
- **non-goals are absent** — nothing crept in (extra screens, settings,
  stats, deps not in the plan)
- no secrets in git; `.gitignore` covers `pb_data`, `bin`, `build`, `.env`
- repo leftovers from abandoned directions are gone

Report the table. Fix gaps now if they're small and in the plan; anything
that changes scope goes back to the user.

## 2. Follow the host's conventions — don't invent

Read `~/src/omarz/homelab/CLAUDE.md` (the working agreement) and its README
**now**, and follow its checklist for adding a service. Known shape:

- one compose stack per service in the homelab repo, `restart: unless-stopped`,
  healthcheck, bound to `127.0.0.1` only; ingress only via `tailscale serve`
  on the next free HTTPS port — each app its own port, never a sub-path
- data in `~/srv/<app>/`, wired into the backup script in the same change
- dashboard labels on the container; never hand-edit the dashboard's
  `services.yaml`. **Every app made with /pwa goes in the `PWA` group:**
  `homepage.group=PWA`. If `compose/homepage/config/settings.yaml` has no
  `PWA` entry under `layout:`, add `PWA: { style: row, columns: 1 }` in the
  same homelab commit
- ingress line added to the install script (not just run by hand), the new
  port added to the check script
- homelab repo is the source of truth: commit + push there per its rules

Find free ports from the real state too, not only the docs:
`ssh homelab 'docker ps --format "{{.Names}} {{.Ports}}"; tailscale serve status'`.

Earlier apps skipped the homelab-repo registration and drifted. Do the
full checklist.

## 3. Ship

- `scripts/deploy.sh`: build + check + test locally, `rsync -az --delete` the
  SPA to `~/srv/<app>/pb_public/` (exclude any extra served paths), hooks and
  migrations likewise, `docker restart <app>` so hooks/migrations reload,
  then curl the health endpoint. **Never touch `pb_data`.**
- Before a deploy that adds migrations to a live app: snapshot `pb_data`
  (PocketBase backup) and test the migration on a copy.
- First deploy: create the superuser and the user account(s) on the host
  (`pocketbase superuser upsert …`), generated passwords written to
  `~/srv/<app>/credentials.txt` mode 600. Never print, never commit.
- Long operations over ssh: `setsid nohup`, the link can drop.
- Never: bind 0.0.0.0, `docker run`, systemd units, change existing ports,
  run the homelab `make install` casually (it re-enables paused jobs — read
  the CLAUDE.md first).

## 4. Test it live

- `curl -I` the public URL → 200; manifest, service worker and icons return
  the right content types; health check green; container healthy.
- Rules test and Playwright e2e **against the deployed URL**
  (`PB_URL` / `<APP>_URL`).
- Screenshot the live app at phone size, light + dark.
- Offline: load, go offline, reload → app shell still opens.
- Backup: trigger one, restore it into a throwaway instance on another port,
  check the data, remove the instance. Only then trust backups.
- Homelab `make check` (note pre-existing failures, don't fix what isn't yours).

## 5. Hand over

Plan status → `deployed <date> — <url>`. Final report, lead with access:

1. **URL** and how to reach it (on the tailnet)
2. **Login:** where the credentials file is (not the password) — change it after first login
3. **Install:** iPhone Safari → Share → Add to Home Screen; Android Chrome → Install app
4. What's live, per screen
5. Verified live (tests + counts), and what is **not** verified
6. Bugs found and fixed during deploy
7. Homelab changes (ports, backup wiring) and their commit status
8. Redeploy: `scripts/deploy.sh`
9. Pre-existing problems noticed on the host, not touched
