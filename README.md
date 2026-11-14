# Pilotlight

Self-hosted uptime monitoring and status page that runs entirely on Cloudflare's free plan. Add services from a dashboard, with no config files and no servers to run.

## Features

- **Scheduled checks** every 5 minutes (configurable) via Cron Triggers, with incidents and 90-day retention
- **Public status page** with live overall status, 24h uptime and the last 50 checks per service, served from Workers Cache
- **Per-service visibility**: hide a service from the status page, or show it without revealing its address
- **Alerts** after N consecutive failures plus recovery notices, via Telegram, Discord, Slack, Email ([Resend](https://resend.com)), ntfy, Gotify and Apprise. Credentials are encrypted (AES-256-GCM) at rest
- **HTTP, HTTPS and TCP** checks (TCP, and HTTP on non-standard ports, through a small external [checker](https://github.com/mortezaom/relay-tcp))
- **Secure by default**: one admin account claimed with a setup secret, rate-limited login, logout that revokes every session, CSRF checks

## Stack

- [Astro](https://astro.build) on Cloudflare Workers: server-rendered pages, React only where the page is interactive
- Cloudflare **D1** with [Drizzle ORM](https://orm.drizzle.team) for all data
- Tailwind CSS 4 + shadcn/ui
- [Bun](https://bun.sh) for installs, scripts and tests; Biome via [Ultracite](https://www.ultracite.ai) for lint/format

## Deploy (GitHub Actions)

1. Fork this repository.
2. Add three repository secrets (**Settings → Secrets and variables → Actions**):

   | Secret | Value |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | API token with *Workers Scripts* and *D1* edit permissions |
   | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
   | `SETUP_SECRET` | Any long random string; you type it once to create the admin account |

3. Push to `master` or run the **Deploy Pilotlight** workflow. It creates the D1 database, applies migrations and deploys.
4. Open `https://pilotlight.<your-subdomain>.workers.dev/login`, enter the setup secret and choose your admin email and password.

### Keys

`SESSION_SECRET` (signs logins) and `ENCRYPTION_KEY` (encrypts channel credentials) are generated on the first deploy and stored as Worker secrets. Later deploys keep them. To set your own, add repository secrets with those names.

- To log everyone out, delete `SESSION_SECRET` in the Cloudflare dashboard (Workers → pilotlight → Settings) and redeploy.
- **Don't delete `ENCRYPTION_KEY`** unless you're prepared to re-enter every notification channel's credentials. The dashboard marks channels it can no longer decrypt.

## Free plan limits

Cloudflare's free plan allows 10 ms CPU per request or cron run, 50 subrequests and 50 D1 queries per run, and 100,000 requests per day.

- One monitoring run handles roughly **40 services**: about 6 database calls plus one check per due service, plus alert deliveries.
- The status page is cached for a minute, so most visits don't run the Worker at all. With Workers Cache enabled, static files count toward the daily request limit.
- Passwords use PBKDF2 at 25k iterations to stay under the CPU limit. On Workers Paid, raise `PASSWORD_ITERATIONS` in `src/lib/encryption.ts`; existing passwords keep working.

## Local development

```bash
bun install
cp .dev.vars.example .dev.vars   # local secrets
bun run db:migrate:local         # create the local D1 schema
bun run dev
```

`astro dev` runs in Cloudflare's `workerd` runtime with local D1. To run the production build and fire the cron locally, run `bun run preview` and open `/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*` on the URL it prints.

| Script | Description |
| --- | --- |
| `bun run dev` | Astro dev server with local Cloudflare bindings |
| `bun run preview` | Production build served by `wrangler dev --test-scheduled` |
| `bun run deploy` | Build and deploy to Cloudflare |
| `bun run lint` / `format` | Check / fix with Ultracite (Biome) |
| `bun run typecheck` | TypeScript check |
| `bun run test` | Unit tests (`bun test`) |
| `bun run db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `bun run cf-typegen` | Regenerate `worker-configuration.d.ts` after changing bindings |

## Project layout

```
src/pages          Status page, login, dashboard and API routes
src/layouts        Base and dashboard layouts
src/components     React islands and shadcn/ui (components/ui)
src/data           Zod schemas and service queries
src/db             Drizzle schema
src/lib            Auth, encryption, monitoring, notifications, settings
src/middleware.ts  Auth guard, CSRF check, cache defaults
src/worker.ts      Worker entry: Astro for requests, monitoring for crons
migrations         D1 migrations
scripts            CI setup and secret generation
```

## License

TBD
