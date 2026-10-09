# She Tech API

The backend for the She Tech website: contact and booking forms, Gmail notifications and the bookings admin panel. Node 22.9+ (Express 5), PostgreSQL 14+ (Neon on Vercel).

```bash
cp .env.example .env    # fill in DB, Gmail and admin settings
npm install
npm run dev             # http://localhost:4000, restarts on file changes
npm start               # production
```

On start-up the API applies any pending database migrations and, while there are no admins yet, creates one from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

| Command | Does |
|---|---|
| `npm run migrate` | Apply pending migrations without starting the server |
| `npm run setup` | Migrations, the first admin and (once) the colours, without starting the server (the Vercel build runs this) |
| `npm run admin:create -- you@example.com` | Add an admin, or reset an admin's password (asks for it without echoing; signs them out everywhere) |

## Database

Migrations live in `migrations/` and run once each, in name order (tracked in `schema_migrations`). To change the schema, add a new file like `002_add_something.sql`. Never edit one that has already run.

| Table | Holds |
|---|---|
| `clients` | One row per email address; name, company and time zone keep the latest values |
| `bookings` | Call requests: status, scheduled time, meeting link, internal notes |
| `booking_preferred_dates` | Days the client said would suit them |
| `booking_events` | Each booking's history ("Confirmed for…", "Confirmation emailed…") |
| `enquiries` | "Send a message" submissions |
| `admin_users` | Admin logins (scrypt password hashes) |
| `admin_sessions` | Signed-in sessions (SHA-256 of the token only) |

All times are stored in UTC.

**Local PostgreSQL:** install it (e.g. from postgresql.org), create a user and database, and set `DATABASE_URL` in `.env`:

```sql
CREATE USER shetech WITH PASSWORD 'a-long-random-password';
CREATE DATABASE shetech OWNER shetech;
```

Or skip the local install: create a free second database (a Neon branch) and point your local `DATABASE_URL` at that.

## Endpoints

| Method | Path | |
|---|---|---|
| GET | `/api/health` | `{ ok, db }`: for load balancers and uptime checks |
| POST | `/api/contact` | Website forms. Saves the enquiry or booking and emails it |
| GET | `/api/admin/session` | Is this browser signed in? |
| POST | `/api/admin/login` · `/logout` | `{ email, password }` |
| GET | `/api/admin/bookings` | All bookings with client, preferred days and history |
| PATCH | `/api/admin/bookings/:id` | `{ action: confirm \| complete \| cancel \| reopen \| notes, … }` |
| DELETE | `/api/admin/bookings/:id` | |

Admin requests must send the `X-Admin: 1` header (cross-site protection) and the session cookie.

## Running the website and API on separate machines

The website (`web/`) is static files; the API is this service. Two ways to connect them:

**1. Reverse proxy (recommended).** The website's server forwards `/api/` to the API, so the browser sees a single origin: no CORS, and cookies just work.

```nginx
# On the web VM
server {
  server_name shetech.com;
  root /var/www/shetech/dist;

  location /api/ {
    proxy_pass http://10.0.0.20:4000;          # the API VM
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location = /admin { try_files /admin.html =404; }
  location = /admin/home { try_files /admin-home.html =404; }
  location / { try_files $uri /index.html; }
}
```

On the API VM set `TRUST_PROXY=1`, `PUBLIC_URL=https://shetech.com`, and firewall port 4000 so only the web VM can reach it.

**2. API on its own subdomain** (e.g. `api.shetech.com`). Build the website with `VITE_API_URL=https://api.shetech.com`, and set `CORS_ORIGINS=https://shetech.com` on the API. Keep both on the same site (`*.shetech.com`) so the admin cookie keeps `SameSite=Strict`.

The database can live on a third machine: point `DATABASE_URL` at it and allow the API VM through its firewall.

## Deploying to Vercel (website and API in one project)

`vercel.json` at the repository root uses [Vercel Services](https://vercel.com/docs/services) (beta): the website (`web/`, Vite) and this API (`api/`, Express as one function) deploy together on one domain. `/api/*` goes to the API with the path unchanged, everything else to the website, so it is same-origin like the nginx setup: no CORS, and the admin cookie stays `SameSite=Strict`. `server.js` isn't used there; Vercel serves the app exported by `src/app.js`.

The database is **[Neon](https://neon.com) Postgres**, added from Vercel's Storage tab (free plan). Vercel then sets `DATABASE_URL` (and `DATABASE_URL_UNPOOLED`, used for migrations) on the project by itself.

1. Push the repository to GitHub, then on Vercel: **Add New → Project**, import it, and leave the root directory as the repository root (the framework preset shows *Services*). Add these environment variables before deploying:
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, optionally `MAIL_TO`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (first admin)
   - `PUBLIC_URL=https://<your-project>.vercel.app` (or your domain), for the admin link in emails
   - the website's `VITE_*` settings (see `web/.env.example`; leave `VITE_API_URL` empty)
2. Deploy. This first build fails with "can't reach the database": expected, there isn't one yet.
3. In the project: **Storage → Create Database → Neon**, free plan, region next to your functions (Frankfurt if the functions run in `fra1`: Settings → Functions → Region), and connect it to all environments.
4. **Deployments → Redeploy.** The API's build step runs `npm run setup`, which creates the tables and the first admin. From now on every deploy applies new migrations, and a deploy fails rather than going live if the database can't be reached. (Preview deployments migrate whichever database their environment points to; Neon can give previews their own branch.)

Check `https://<your-project>.vercel.app/api/health`, then sign in at `/admin`.

Good to know: `TRUST_PROXY` defaults to `1` on Vercel (its edge sets the real client IP), and the rate limits count per function instance. To add more admins later, run `npm run admin:create` locally with `DATABASE_URL` in `api/.env` set to the Neon connection string (Storage → your database → `.env.local` tab).

### Colour editor on the live site (`/admin/home`)

`/admin/home` shows the home page exactly as visitors see it, plus the **Colours** editor (see *Colours* in `web/README.md`). Only signed-in admins get it: anyone else is sent to the sign-in at `/admin` and brought back afterwards. The dashboard links to it (**Colours**). The public home page never loads the editor.

Saving there stores the colours (palette, templates, randomizer) in the database: no commit, no rebuild. Every built page loads `/api/palette.js` in its `<head>`, a small render-blocking script that applies the saved colours before the first paint, so visitors see a change on their next page load. Vercel's CDN keeps that script until a save purges it (cache tag `palette`), so the database is read once per change or deploy, not on every visit. The colours baked into the build stay as the fallback if the API can't be reached.

The first `npm run setup` (the first deploy) copies `web/src/config/` into the database; after that the hosted site's colours are only changed at `/admin/home`, and deploys don't overwrite them. The files are still what `npm run dev` uses, and what a fresh database starts from. The code is in `src/routes/palette.js` and `src/db/palette.js`.
