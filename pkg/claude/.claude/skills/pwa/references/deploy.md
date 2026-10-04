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
- homelab repo is the source of truth: commit + push there per its rules.
  `compose/<app>/compose.yaml` changes go through that repo's git only —
  never copied over the server's checkout by a deploy script

Find free ports from the real state too, not only the docs:
`ssh homelab 'docker ps --format "{{.Names}} {{.Ports}}"; tailscale serve status'`.

Earlier apps skipped the homelab-repo registration and drifted. Do the
full checklist.

## 3. Ship

One shared deploy for every PWA, in the homelab repo: `scripts/pwa-deploy.sh`.
The app's `scripts/deploy.sh` is a one-line call to it.

```
pwa-deploy <app> [--tag T]
  local gate: pnpm check + unit + rules + e2e
  tag = YYYYMMDD-HHMM-<short commit>          (unique even on a dirty tree)
  rsync the build context (pb_public, pb_hooks, pb_migrations, Dockerfile)
    → homelab:~/srv/<app>/build/<tag>/        (KBs, not a 50 MB image)
  ssh: docker build -t <app>:<tag>  FROM the cached pocketbase:<pinned> base
  migrations differ from the running tag → pre-deploy check + pb_data snapshot
  ssh: TAG=<tag> docker compose up -d → /api/health → live smoke; keep 3 tags
rollback: pwa-deploy <app> --tag <previous>
  same migrations → switch tag
  different       → stop, restore the snapshot, switch tag ("writes since … are lost")
```

- **Never touch `pb_data`** except the snapshot/restore above. Snapshot with
  the PocketBase backup API or `sqlite3 .backup` — never `cp` a live SQLite file.
- **Migrations never throw.** A throwing migration stops `serve` and the
  container restart-loops. Safety checks ("no rows use the value I'm
  removing") belong in the deploy script, before the migration ships.
- **Pre-deploy check** (when migrations or an import change): copy live
  `pb_data`, run the new build on it locally, print per-user totals and row
  counts before vs after. Imports: dry run shown to the user, applied only on
  their go.
- **Accounts:** invite-only (`users.createRule = null`) in every app. Users and
  superusers are created only with the homelab `pb-account <app> <email>
  [--admin] [--rotate]` script. The app login is **omarabdul3ziz@gmail.com**;
  the superuser is `admin@<app>.local`. Unlocking: the `!` prompt can't take a
  hidden password, so the user runs `bw unlock --raw | install -m 600
  /dev/stdin ~/.bw_session` in a normal terminal; the agent then runs the
  script with `BW_SESSION=$(cat ~/.bw_session)`, verifies the logins against
  the live URL, and finally deletes the file and runs `bw lock`. It stores the
  login in Vaultwarden
  (`https://homelab.forest-betta.ts.net:8447`, folder `HomeLab`, item
  `<app> (user|admin)`, URI = app URL) *before* creating it, removes the item
  if creation fails, refuses to overwrite without `--rotate`, never prints the
  password. No credentials files on the host.
- Long operations over ssh: `setsid nohup`, the link can drop.
- Never: bind 0.0.0.0, `docker run`, systemd units, change existing ports,
  run the homelab `make install` casually (it re-enables paused jobs — read
  the CLAUDE.md first).

## 4. Test it live

- `curl -I` the public URL → 200; manifest, service worker and icons return
  the right content types; health check green; container healthy.
- Live smoke, read-only for real users: health, landing loads, the real
  users' row counts unchanged. Rules/e2e against the deployed URL only with a
  throwaway user that is deleted after, and only when the plan asks for it.
- Screenshot the live app at phone size, light + dark.
- Offline: load, go offline, reload → app shell still opens.
- Backup: trigger one, restore it into a throwaway instance on another port,
  check the data, remove the instance. Only then trust backups.
- Homelab `make check` (note pre-existing failures, don't fix what isn't yours).

## 5. Hand over

Plan status → `deployed <date> — <url>`. Final report, lead with access:

1. **URL** and how to reach it (on the tailnet)
2. **Login:** the Vaultwarden item (`HomeLab / <app> (user)`), never the password
3. **Install:** iPhone Safari → Share → Add to Home Screen; Android Chrome → Install app
4. What's live, per screen
5. Verified live (tests + counts), and what is **not** verified
6. Bugs found and fixed during deploy
7. Homelab changes (ports, backup wiring) and their commit status
8. Redeploy: `scripts/deploy.sh`; rollback: `pwa-deploy <app> --tag <previous>`
9. Pre-existing problems noticed on the host, not touched
10. Add or refresh `CLAUDE.md` + `docs/adr/` (plans are kept, see SKILL.md)
