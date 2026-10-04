# /pwa build

Precondition: `docs/PLAN.md` status is `approved` (or the user just approved
it in chat — write the line). Otherwise stop and point to `/pwa plan`.

**Don't stop until every phase's acceptance criteria pass.** No "next steps
for you", no half-built screens. If blocked by something only the user can do
(a credential, a paid account), finish everything else first, then ask.
If the user asks something mid-run, answer in a line and continue.

Read `references/stack.md` first — it has the layout, the proven
service worker and the gotchas that already cost time once.

## Order

0. **Dev server first, and keep it up** — pick a free `PB_PORT` for this app
   (apps clash on 8090), start `PB_PORT=<port> scripts/dev-server.sh` and
   `PB_PORT=<port> pnpm dev` in the background, seed demo data, and give the
   user `http://localhost:5173` + the demo login right away. Both stay running
   until the build ends, so the user can look at every change live.
1. **Skeleton** — scaffold with the official tools (stack.md), pin versions,
   dev scripts, tokens in `app.css` from day one, landing (signed-out `/`), sign-in, empty state,
   manifest + icons + service worker. Production build served by PocketBase
   locally must work before any feature.
2. **Contracts first** — shared types and the data API (`data.svelte.ts`),
   written by you.
3. **Fan out** — fork background agents for self-contained pieces, each with
   an exact file list, function signatures, and "touch ONLY these files":
   - pure core logic + table-driven tests (every edge-case row from the plan)
   - PocketBase migrations + hooks + `server/test/rules.test.mjs`
   - PWA assets (icons, manifest), service worker, image pipeline
   Keep UI and integration yourself.
4. **UI** — load the `frontend-design` skill before the first screen, and
   `dataviz` before any chart. Follow the plan's visual appendix; keep it calm.
   Build the primary flow first; secondary screens don't get polish while the
   core loop is awkward.
5. **Phase by phase** — tick the phase checkbox in the plan only when its
   acceptance passes. Post a one-line progress note between phases.

## Verify (every phase, and all of it at the end)

1. `pnpm check` (0 errors, 0 warnings) + `pnpm test`.
2. Rules test against a running PocketBase.
3. Seed realistic data (`scripts/seed-demo.mjs`, ~a year, deterministic).
4. Drive the real UI and **look at the screenshots** at 390×844 (**light and
   dark**), 900 and 1440 wide — overflow, clipped labels, bad dates, wrong
   signs and a thin desktop strip only show up here.
5. Failure paths for real: server stopped (not just devtools offline — an open
   connection can fake a pass), reload offline, error → visible message with
   retry (never a blank page), 401 → sign-in.
6. Playwright e2e (Pixel 7 profile): one test per feature + the failure path,
   against the production build served by PocketBase.
7. If the app does money or time math: one hand-checked **scenario test**
   (a scripted year of real use) asserting the expected totals per month.
8. Lighthouse PWA/accessibility pass on the landing and the main screen —
   run it, don't skip it.

Every bug: fix the cause, rerun, and keep a list for the report.

## Finish

- `README.md`: one-paragraph what, stack, develop, test, deploy commands.
- `scripts/deploy.sh` (a call to the homelab `pwa-deploy <app>`) +
  `deploy/compose.yaml` ready (see deploy.md), not run.
- Stop the dev servers you started (by PID).
- Plan status → `built <date>`.
- Report: what exists per screen, test counts, bugs found and fixed, what is
  **not** verified (real iPhone, camera, HEIC…), git status (uncommitted
  unless asked). End with "Ready for `/pwa deploy`."
- If the user's go was "build and deploy / served", continue straight into deploy.
