# She Tech API

The backend for the She Tech website: contact and booking forms, Gmail notifications and the bookings admin panel. Node 22.9+ (Express 5), MySQL 8 or MariaDB 10.4+.

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
| `npm run setup` | Migrations plus the first admin, without starting the server (the Vercel build runs this) |
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

**Local MySQL (XAMPP):** create a database and a dedicated user rather than using `root`:

```sql
CREATE DATABASE shetech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shetech'@'localhost' IDENTIFIED BY 'a-long-random-password';
GRANT ALL PRIVILEGES ON shetech.* TO 'shetech'@'localhost';
```

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
  location / { try_files $uri /index.html; }
}
```

On the API VM set `TRUST_PROXY=1`, `PUBLIC_URL=https://shetech.com`, and firewall port 4000 so only the web VM can reach it.

**2. API on its own subdomain** (e.g. `api.shetech.com`). Build the website with `VITE_API_URL=https://api.shetech.com`, and set `CORS_ORIGINS=https://shetech.com` on the API. Keep both on the same site (`*.shetech.com`) so the admin cookie keeps `SameSite=Strict`.

The database can live on a third machine: point `DB_HOST` at it and allow the API VM through its firewall.

## Deploying to Vercel (website and API in one project)

`vercel.json` at the repository root uses [Vercel Services](https://vercel.com/docs/services) (beta): the website (`web/`, Vite) and this API (`api/`, Express as one function) deploy together on one domain. `/api/*` goes to the API with the path unchanged, everything else to the website, so it is same-origin like the nginx setup: no CORS, and the admin cookie stays `SameSite=Strict`. `server.js` isn't used there; Vercel serves the app exported by `src/app.js`.

Vercel has no MySQL of its own, so the database lives elsewhere. Free options:

- **[TiDB Cloud Starter](https://tidbcloud.com)** (MySQL-compatible, free quota). Create a cluster, then *Connect* gives host, port `4000`, a user like `xxxx.root` and a password. Set `DB_SSL=true`.
- **[Aiven for MySQL](https://aiven.io/mysql)** free plan (real MySQL 8). Set `DB_SSL_CA` to the CA certificate from the service page.

Put the database in the same region as your Vercel functions (Project → Settings → Functions → Region, e.g. Frankfurt `fra1`), as every request makes several queries.

1. Push the repository to GitHub, then on Vercel: **Add New → Project**, import it, and leave the root directory as the repository root (the framework preset shows *Services*).
2. Before the first deploy, add the environment variables (Settings → Environment Variables):
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` / `DB_SSL_CA`, and `DB_POOL_SIZE=3` (free databases allow few connections)
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, optionally `MAIL_TO`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (first admin)
   - `PUBLIC_URL=https://<your-project>.vercel.app` (or your domain), for the admin link in emails
   - the website's `VITE_*` settings (see `web/.env.example`; leave `VITE_API_URL` empty)
3. Deploy. The API's build step runs `npm run setup`, so migrations are applied and the first admin is created; if the database can't be reached the deploy fails rather than going live broken. Preview deployments do the same against whichever database their environment variables point to.

Check `https://<your-project>.vercel.app/api/health` afterwards, then sign in at `/admin`.

Good to know: `TRUST_PROXY` defaults to `1` on Vercel (its edge sets the real client IP), and the rate limits count per function instance. To add more admins later, run `npm run admin:create` locally with `api/.env` pointing at the hosted database.
