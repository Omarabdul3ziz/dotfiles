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
  src/routes/        # few: /, /login, maybe one more
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
- vite dev proxy: `'/api'` and `'/_'` → `http://127.0.0.1:8090`.
- Force runes in `vite.config.ts` compilerOptions.

`scripts/dev-server.sh`: `migrate up`, `superuser upsert admin@<app>.local <devpass>`,
`serve --http=127.0.0.1:8090 --dir --hooksDir --migrationsDir --publicDir=../web/build`.
Run `serve` once, then read `pb_data/types.d.ts` for exact hook APIs.

## PocketBase

- Every row has `owner` (relation → users, cascadeDelete). Rules:
  `owner = @request.auth.id`; on update also
  `(@request.body.owner:isset = false || @request.body.owner = @request.auth.id)`
  so ownership can't move; immutable fields `@request.body.<f>:changed = false`.
- Public sign-up off: `users.createRule = null`; superuser creates users.
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
pure black), `color-scheme` set, no toggle. One column (max ~460–720px),
grouping by whitespace, `100dvh`, `env(safe-area-inset-*)`, `:focus-visible`,
`tabular-nums`, logical properties. Sheets: `role=dialog aria-modal`, Esc
closes, focus returns, scroll locked. Undo toast instead of confirm dialogs.

## Tests

- **Unit:** only `lib/core`, table-driven, one case per plan edge row.
- **Rules** (`server/test/rules.test.mjs`): plain Node `assert` + fetch;
  env `PB_URL PB_ADMIN PB_PASS`; creates timestamped users A and B;
  checks sign-up closed, B can't read/write A, can't create for others,
  immutable fields, unique index, invalid/future values, cascades, protected files.
- **E2E:** `devices['Pixel 7']`, `workers: 1`, `baseURL` from `<APP>_URL`
  (same suite runs against production), chromium from `CHROMIUM` env
  (`/usr/bin/chromium`); `beforeAll` creates a throwaway user via superuser,
  `afterAll` deletes it; role/label selectors; core loop + `page.route(...).abort()`
  failure path (+ `context.setOffline` flow if there's an outbox).
- Browser automation fallback: if Chrome MCP is blocked, Playwright screenshots.
- Shell: don't `pkill -f <pattern>` (matches its own shell) — kill by PID.

## Deploy shape

`deploy/compose.yaml` (goes into the homelab repo as `compose/<app>/compose.yaml`):

```yaml
services:
  <app>:
    build:
      dockerfile_inline: |
        FROM alpine:3.22
        ARG PB_VERSION=<pinned>
        RUN apk add --no-cache ca-certificates tzdata unzip wget \
          && wget -q https://github.com/pocketbase/pocketbase/releases/download/v$${PB_VERSION}/pocketbase_$${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip \
          && unzip /tmp/pb.zip pocketbase -d /pb && rm /tmp/pb.zip
        USER 1000:1000
        ENTRYPOINT ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/srv/pb_data", "--publicDir=/srv/pb_public", "--hooksDir=/srv/pb_hooks", "--migrationsDir=/srv/pb_migrations"]
    image: <app>-pocketbase:<pinned>
    pull_policy: never
    container_name: <app>
    ports: ["127.0.0.1:<hostport>:8090"]
    volumes: ["/home/<user>/srv/<app>:/srv"]
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

`0.0.0.0` inside the container is fine; the host side is `127.0.0.1` only.
