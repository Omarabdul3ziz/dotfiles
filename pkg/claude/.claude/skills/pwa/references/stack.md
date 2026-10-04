# Default stack

Proven twice. Use it unless the plan found a concrete reason not to.
Check current versions at build time; **pin PocketBase exactly** (pre-1.0).

| Layer | Choice |
|---|---|
| Backend | **PocketBase** (single binary: SQLite, auth, files, rules, JS hooks, admin UI, backups) |
| Frontend | **SvelteKit static SPA** (Svelte 5 runes, TypeScript), served by PocketBase from `pb_public` — one origin, no CORS |
| Styling | plain CSS custom properties in `app.css` + scoped `<style>`. No Tailwind, no UI kit |
| Fonts | self-hosted `@fontsource` (latin subset), one characterful face |
| Tests | Vitest (pure logic), Node script vs running PocketBase (rules), Playwright (e2e) |
| Package mgr | pnpm |
| Hosting | homelab docker + `tailscale serve` HTTPS (see deploy.md) |

Deps stay minimal: pocketbase SDK, fontsource, maybe one small lib the plan
justifies. No chart library (hand SVG), no state library, no i18n library
(use CSS logical properties so RTL is cheap later).

Native apps were tried and dropped: second UI to keep in parity, GB-sized
toolchains, signing keys, store fees/review, no iOS build without a Mac. A PWA
loses only widgets and store presence. Don't propose native unless asked.

## Layout

```
docs/PLAN.md
server/
  bin/pocketbase                 # gitignored, pinned version
  pb_migrations/<unix>_init.js   # collections, rules, indexes, settings
  pb_hooks/*.pb.js + lib.js      # validation, cron, custom routes
  test/rules.test.mjs            # rules test vs running server
web/
  src/app.html  app.css  service-worker.ts
  src/lib/core/      # pure TS domain logic + colocated *.test.ts
  src/lib/ui/        # Sheet, Toast, …
  src/lib/data.svelte.ts   # class with $state + pb SDK, optimistic updates
  src/lib/ui.svelte.ts     # sheet state (discriminated union) + undo toast
  src/routes/        # few: / (landing when signed out, app when signed in), /login, maybe one more
  src/lib/ui/Landing.svelte  # signed-out /: headline, example, features, Sign in
  static/  manifest.json  icon.svg  icon-192/512.png  icon-maskable-512.png  apple-touch-icon.png
  e2e/     playwright.config.ts
scripts/ dev-server.sh  seed-demo.mjs  deploy.sh
deploy/compose.yaml
```

Keep `core/` inside `web/` until a second consumer really exists.

## Scaffold

```
pnpm dlx sv create web --template minimal --types ts --add vitest sveltekit-adapter=static
```
- If install fails with "packages field missing": delete the generated
  `pnpm-workspace.yaml`, put `"pnpm": {"onlyBuiltDependencies": ["esbuild"]}` in package.json.
- `adapter({ fallback: 'index.html' })`; `+layout.ts`: `ssr = false; prerender = false`.
- vite dev proxy: `'/api'` and `'/_'` → `` `http://127.0.0.1:${process.env.PB_PORT ?? 8090}` ``.
- Force runes in `vite.config.ts` compilerOptions.

`scripts/dev-server.sh`: `migrate up`, `superuser upsert admin@<app>.local <devpass>`,
`serve --http=127.0.0.1:${PB_PORT:-8090} --dir --hooksDir --migrationsDir --publicDir=../web/build`.
Every app gets its own `PB_PORT` (apps clash on 8090); build runs it + `pnpm dev`
in the background the whole time (build.md step 0).
Run `serve` once, then read `pb_data/types.d.ts` for exact hook APIs.

## PocketBase

- Every row has `owner` (relation → users, cascadeDelete). Rules:
  `owner = @request.auth.id`; on update also
  `(@request.body.owner:isset = false || @request.body.owner = @request.auth.id)`
  so ownership can't move; immutable fields `@request.body.<f>:changed = false`.
- Invite-only in every app: `users.createRule = null`. Live users and
  superusers are created only with the homelab `pb-account` script (deploy.md
  §3), logins kept in Vaultwarden. Dev logins (`admin@<app>.local`) stay local.
- Migrations never throw (a throw stops `serve`); checks go in the deploy script.
- Constraints as unique indexes (e.g. one entry per item per day).
- Settings in the migration: backups cron (`30 2 * * *`, keep 14),
  `trustedProxy` headers, rate limits on.
- Hooks are goja, not Node: no npm, sync `$http.send`, each handler has its
  own context → `require(\`${__hooks}/lib.js\`)` **inside** the handler.
  Validation throws `BadRequestError` with a short human message.
  `onRecordAfterDeleteSuccess` also fires on cascades.
- Files: `protected` field with mimeTypes + maxSize; clients fetch a file
  token (expires ~180 s) — refresh before rendering / long loops, keep it in a
  plain variable, not `$state`.
- Rate limiter: seed script disables it via `PATCH /api/settings` and
  restores it; Playwright `workers: 1`.

## Dates

Store calendar days as `YYYY-MM-DD` text in the user's local day. Do day math
on UTC-midnight of that string. Server accepts days up to UTC tomorrow
(UTC+14 exists). Keep "today" reactive (timer at midnight). Format months
yourself — `Intl` en-GB prints "Sept".

## PWA

- `app.html`: `viewport-fit=cover`, two `theme-color` metas (light/dark),
  `apple-mobile-web-app-capable`, `-title`, `apple-touch-icon`.
- Manifest as **`manifest.json`** (PocketBase serves `.webmanifest` as
  text/plain): `display: standalone`, `start_url`/`scope` `/`, background =
  theme = paper token, icons 192 + 512 + a real maskable 512.
- HTTPS is required (SW, install, camera) — tailscale serve gives it.
- Install hint: iOS only, when not standalone, dismissible (localStorage).
  Android/desktop: `beforeinstallprompt` button.
- Service worker — use this, it has both fixes baked in:

```ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `app-${version}`;
// '/' not '/index.html': PocketBase redirects the latter, and redirected responses can't answer navigations
const ASSETS = [...build, ...files, '/'];

sw.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => sw.skipWaiting()));
});
sw.addEventListener('activate', (e) => {
	e.waitUntil(caches.keys()
		.then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
		.then(() => sw.clients.claim()));
});
sw.addEventListener('fetch', (e) => {
	const req = e.request;
	const url = new URL(req.url);
	if (req.method !== 'GET' || url.origin !== sw.location.origin) return;
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_/')) return; // data: network only
	if (req.mode === 'navigate') {
		e.respondWith(fetch(req).catch(async () => (await caches.match('/', { ignoreVary: true })) ?? Response.error()));
		return;
	}
	if (ASSETS.includes(url.pathname)) {
		// ignoreVary: PocketBase sends 'Vary: Origin' and module scripts carry an Origin header
		e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? fetch(req)));
	}
});
```

- Offline writes — only if the plan says so: ~30-line raw IndexedDB outbox,
  deterministic key (e.g. `item:day`) so retries are idempotent; queue only on
  network error ("Saved on this device, will upload when online"); flush on
  load, `online`, `visibilitychange`; drop permanent 4xx. Offline reads: a
  localStorage snapshot of the last lists. No sync engine.
- iOS: no Background Sync (retries only while open), push only when installed
  (16.4+), installed apps are exempt from 7-day storage eviction.

## Images (if the app takes photos)

`<input type=file accept="image/*">` without `capture` (forces camera-only on
Android 14+). Decode `createImageBitmap(file, {imageOrientation:'from-image'})`,
fallback `<img>`; halve down on canvas; encode WebP ~0.72 at ~1280px + 320px
thumb; if `blob.type` isn't webp (Safari) use JPEG; retry lower quality over
budget. Re-encoding strips EXIF/GPS. Skip AVIF. Keep e2e fixtures within the
field's maxSize.

## Svelte 5 gotchas

- An `$effect` that reads and writes the same state freezes the page — wrap
  the loader in `untrack()`.
- Any load error must render a message + retry, never a blank page; 401 → sign-in.
- Grid children with chip rows need `min-width: 0` or sheets overflow at phone width.

## Design defaults

Tokens on `:root`: `--paper --ink --ink-2 --line --raised --scrim` + accents
that carry meaning only. Dark via `prefers-color-scheme` (warm/tinted, never
pure black), `color-scheme` set, no toggle. Phone: one column (~460px),
grouping by whitespace. Desktop from day one: ≥ 800px two columns, max
~1040px, 32px gutters. `100dvh`, `env(safe-area-inset-*)`, `:focus-visible`,
`tabular-nums`, logical properties. Undo toast instead of confirm dialogs.

- **Top bar:** wordmark (a link to `/`), nav, and the primary action as a
  button (e.g. Add). No fixed action strip at the screen edge, no floating
  action button.
- **Sheets:** `role=dialog aria-modal`, Esc closes, focus returns, scroll
  locked; bottom sheet on phone, centered ~520px dialog on desktop. One at a
  time, short, never nested, at most two main actions.

## Landing

Signed-out `/` renders `Landing.svelte` from the layout (not a route of its own); every
other signed-out path redirects to `/login?next=<path>`, and `/login` returns to `next`.
401 / sign-out → back to `/`. One screen, calm: a headline that says what the app is
(not a slogan) + one line, one small **static example** of the main screen made from
the real components or tokens (fake data, labelled "Example"), 3–4 features as a small
line icon + a few words (nothing unbuilt), and the access line. Sign in is a single
button in the top bar, right side — no second one at the bottom. Phone: stacked;
desktop: hero + example side by side, features in one row. No marketing tropes
(stat counters, testimonials, logo walls, gradients).

## Tests

- **Unit:** only `lib/core`, table-driven, one case per plan edge row.
- **Rules** (`server/test/rules.test.mjs`): plain Node `assert` + fetch;
  env `PB_URL PB_ADMIN PB_PASS`; creates timestamped users A and B;
  checks sign-up closed, B can't read/write A, can't create for others,
  immutable fields, unique index, invalid/future values, cascades, protected files.
- **Scenario:** money/time math gets one hand-checked year of real use with
  expected totals per month (`core/scenario.test.ts`).
- **E2E:** `devices['Pixel 7']`, `workers: 1`, `baseURL` from `<APP>_URL`
  (local production build; live only with a throwaway user), chromium from `CHROMIUM` env
  (`/usr/bin/chromium`); `beforeAll` creates a throwaway user via superuser,
  `afterAll` deletes it; role/label selectors; core loop + `page.route(...).abort()`
  failure path (+ `context.setOffline` flow if there's an outbox).
- E2E sign-in helper waits and retries on PocketBase's "Too Many Requests" (login rate limit) instead of disabling it; test servers get their own data dir (`PB_DIR=$(mktemp -d)`), never the dev server's.
- Browser automation fallback: if Chrome MCP is blocked, Playwright screenshots.
- Shell: don't `pkill -f <pattern>` (matches its own shell) — kill by PID.

## Deploy shape

The app ships as a tagged image built **on the homelab** from a small build
context that `pwa-deploy` rsyncs over (deploy.md §3). Data stays in the bind
mount; the image holds only code.

`deploy/Dockerfile` (app repo):

```dockerfile
FROM pocketbase:<pinned>          # shared base, built once on the homelab, cached
COPY pb_public /pb/pb_public
COPY pb_hooks /pb/pb_hooks
COPY pb_migrations /pb/pb_migrations
USER 1000:1000
ENTRYPOINT ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/srv/pb_data", "--publicDir=/pb/pb_public", "--hooksDir=/pb/pb_hooks", "--migrationsDir=/pb/pb_migrations"]
```

`compose/<app>/compose.yaml` (homelab repo, committed there, never overwritten by a deploy):

```yaml
services:
  <app>:
    image: <app>:${TAG}
    pull_policy: never
    container_name: <app>
    ports: ["127.0.0.1:<hostport>:8090"]
    volumes: ["/home/<user>/srv/<app>/pb_data:/srv/pb_data"]
    environment: [TZ=<tz>]
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:8090/api/health"]
      interval: 30s
    restart: unless-stopped
    labels:
      - "homepage.group=PWA"
      - "homepage.name=<Name>"
      - "homepage.icon=<icon>"
      - "homepage.href=https://<host>:<84xx>/"
      - "homepage.description=<one line>"
```

`TAG` comes from `compose/<app>/.env` written by `pwa-deploy`. `0.0.0.0` inside
the container is fine; the host side is `127.0.0.1` only.
