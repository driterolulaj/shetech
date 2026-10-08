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
