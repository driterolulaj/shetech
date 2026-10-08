# She Tech website

React + Tailwind v4 + Vite. The frontend only: forms, bookings and the admin panel talk to the **API service in [`../api`](../api/README.md)** (Node + MySQL), which must be running for them to work.

```bash
npm install
npm run dev      # http://localhost:5173 (draft projects visible); /api is forwarded to http://localhost:4000
npm run build    # production build in dist/ (drafts hidden)
npm start        # serves dist/ on :3000 and forwards /api to API_URL (default http://localhost:4000)
```

Local development, two terminals:

```bash
cd api && npm run dev    # API on :4000 (needs MySQL, see api/README.md)
cd web && npm run dev    # website on :5173
```

## Contact & booking setup

Copy `.env.example` to `.env.local` and fill in what you have. Everything here ends up in the public JavaScript, so **no secrets**: Gmail, database and admin credentials belong in `api/.env`.

| Variable | What it does | If empty |
|---|---|---|
| `VITE_CONTACT_EMAIL` | Address shown on the site and used for mailto links | Email rows are hidden |
| `VITE_BOOKING_URL` | Scheduling page embedded by **Book a call** (Calendly, Cal.com, TidyCal, SavvyCal…) | Visitors get the built-in call-request form, handled in the admin panel |
| `VITE_API_URL` | The API's address when it runs on its own host (e.g. `https://api.shetech.com`) | Same origin: `/api` on this site |
| `VITE_FORM_ENDPOINT` | Send forms to [Formspree](https://formspree.io) / [Web3Forms](https://web3forms.com) instead of the API | The She Tech API |
| `VITE_FORM_ACCESS_KEY` | Web3Forms access key | — |
| `VITE_LINKEDIN_URL` etc. | Footer social links | Hidden |

Other settings (response time, call length) live in `src/config/site.js`.

**Deploying:** on Vercel, the root `vercel.json` deploys the website and API together: see *Deploying to Vercel* in [`api/README.md`](../api/README.md). On your own servers, the website and API can share a machine or live on separate ones. See *Running the website and API on separate machines* in [`api/README.md`](../api/README.md) for the nginx setup.

## Bookings admin (`/admin`)

Every **Book a call** request is saved as a booking and emailed to you, with a link straight to it in the admin panel. "Send a message" submissions are emailed and saved too.

Open `/admin` (e.g. http://localhost:5173/admin) and sign in with your admin email and password (the first admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `api/.env`; add more with `npm run admin:create` in `api/`). There you can:

- See bookings on a **month calendar**: confirmed calls on their day and time, open requests (dashed) on each day the client said suits them.
- Filter the list by **Requested / Confirmed / Completed / Cancelled**, or click a day to see just that day.
- Open a booking for the **client's details**: email, company, interest, time zone, preferred days and time, and their message.
- **Confirm** a time (with an optional meeting link). The client gets an email with a calendar invite, shown in their own time zone. Reschedule the same way.
- **Cancel / decline** (optionally emailing the client), **mark completed**, keep **internal notes**, see the **history**, or delete.

Bookings, clients and enquiries are stored in MySQL by the API. See [`api/README.md`](../api/README.md) for the schema, and back that database up.

**Links that open the contact dialog from anywhere**, including content files:

- `#book` opens it on **Book a call**
- `#message` opens it on **Send a message**
- `https://your-site.com/#book` opens it straight away (handy for email signatures)

## Adding a project

1. Copy `src/content/projects/_template.js` to `src/content/projects/<slug>.js`.
2. Fill it in. Every field is documented in the template.
3. Save. That's it.

The project appears as a new row in the work list, gets a case-study modal and a shareable link (`/#work/<slug>`), and shows under **Work** in the navbar if `featured: true`.

- **`url`** adds a "Visit the live site" link; **`highlights`** lists the features worth calling out (see `bsr-group-residence.js`).
- **`nextPhase`** lists proposed AI extensions (not delivered work). They show as **Next phase: where AI fits** with a *Proposed* label in the case study, and the card says "AI next phase proposed".
- **`draft: true`** shows it in `npm run dev` only (use for work in progress).
- **`comingSoon: true`** lists it as "In progress" with just a title, headline and tags, before the case study is written.
- **Filters** (AI solutions / Automation / Custom software) appear by themselves once there are 5+ projects, based on each project's `services`.
- After 8 projects a **Show all** button appears (`WORK.initialVisible` in `src/config/site.js`).

## Page content

| Section | File |
|---|---|
| Services (#services, #services-<id>) | `src/content/services.js` |
| How we work (#how-we-work) | `src/content/process.js` |
| About (#about): mission, values, optional story and team | `src/content/about.js` |
| Navbar menus and footer links | `src/data/navigation.js` |

`story` and `team` in `about.js` start empty and render only once filled in.

## Colours

All colours, for both light and dark themes, live in **`src/config/palette.json`**:

| File | Purpose |
|---|---|
| `src/config/palette.json` | The live colour scheme. Edit it freely; the site is built from it. |
| `src/config/palette.defaults.json` | The original colours. **Don't edit.** Reset copies this back. |
| `src/config/palettes/<name>.json` | **Templates**: saved palettes you can switch between (e.g. `green`, `purple`). |

Ways to change them:

- **In the browser:** run `npm run dev` and click **Colours** (bottom-right). Pick colours for light and dark, watch the site update live, then **Save to file**. **Discard** drops unsaved changes; **Reset to defaults** (click twice) restores the originals. The editor only exists in development, so visitors never see it.
- **Templates:** in the same panel, click a template to preview it across the site, then **Save to file** to make it live. To keep the current colours as a template, type a name and **Save as template**; typing an existing name offers **Update** instead. The bin icon deletes a template (click twice). Each template holds both light and dark colours; the one that's live is marked *Live*.
- **Switch template from the terminal:** `npm run palette:use -- purple` (lists the templates if the name is missing or wrong).
- **By hand:** edit `palette.json` (hex colours, `#rrggbbaa` for transparency). With `npm run dev` running, the page reloads with your change.
- **Reset from the terminal:** `npm run palette:reset`.

Tip: with "Derive hover and wash from the accent" ticked, changing **Accent** also sets matching hover and wash shades. The **Hero gradient** list holds the four colours of the animated background (and the ribbon further down).

Whichever palette is in `palette.json` when you run `npm run build` is the one the live site uses, unless the randomizer is on.

### Randomizer

The site can show a random template instead of the saved palette. Set it in the **Colours** panel (section *Randomizer*, then **Save randomizer**) or by hand in `src/config/palette.randomizer.json`:

| Setting | Does |
|---|---|
| `onRefresh` | `true`: a random template on every page load (never the same one twice in a row) |
| `everySeconds` | Switch to another template every N seconds (3–3600). `0` = off |
| `fadeSeconds` | How long each timed switch takes: every colour, including the animated backgrounds, drifts gradually to the new palette (0–60, default 4). `0` = a quick cross-fade instead |
| `exclude` | Templates left out of the mix. The accessibility ones (`high-contrast`, `colorblind-*`, `dyslexia-friendly`, `calm`) are out by default |

Both can be on together. It works on the live site: the build embeds the templates in the mix and picks one before the first paint, so there's no flash of the saved colours. Timed changes pause in background tabs and stay off for visitors who prefer reduced motion. The admin panel always uses the saved palette, and the randomizer pauses while the Colours panel is open so you can edit. **Shuffle** in the panel previews a random template without changing any settings.

Rebuild after changing the settings or templates (`npm run build`) for the live site to pick them up.

## Logo

The logo is drawn inline from `src/assets/she-tech-logo.svg`, so it follows the palette:

| Palette token | Logo part | Default |
|---|---|---|
| `logoMark` | "She Tech" lettering and the bolt | navy in light theme, the original white in dark |
| `logoPrimary` / `logoLight` / `logoDeep` | the orbit purples (gradients mix these) | the original purples |

In the colour editor, **Follow the accent colour** (under Logo) recolours the logo whenever you change the accent.

**Replacing the logo:** overwrite `src/assets/she-tech-logo.svg` and run `npm run logo`. That regenerates `src/components/brand/logoArt.js` and `public/favicon.svg`. If the new file uses different colours, add them to `ROLES` in `scripts/build-logo.mjs`.

**Animation:** the rings in the artwork are woven (broken where they cross). So they can spin independently without showing breaks, `npm run logo` refits each purple ring as a solid ellipse and completes the white orbit where the artwork hid it. Those steps refer to specific pieces of this logo (`SOLID_PARTS` and `WHITE_BRIDGES` in `scripts/build-logo.mjs`); a different logo needs them updated.

## Themes

The site follows the visitor's system setting until they use the sun/moon toggle; their choice is remembered. Components only use semantic tokens (`bg-surface`, `text-ink`, `border-line`, `bg-accent-wash`…), so a palette change updates everything.
