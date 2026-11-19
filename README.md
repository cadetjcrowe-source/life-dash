# Life — personal dashboard

Jacob's day at a glance: weather for Ramsey, today's events, top 3 tasks, habits, projects, journal and a weekly review. Built as an installable iPhone web app that syncs across devices.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Postgres (Neon, via the Vercel Marketplace) · Drizzle ORM · SWR · hosted on Vercel.

---

## What's inside

| Screen | What it does |
| --- | --- |
| **Today** | Greeting and date. Ramsey weather with an hourly and 4-day forecast, a "good to be outside" flag (dry, light wind, good visibility) and a "calm enough to fly" drone flag. **Golden hour**: sunrise, sunset, the morning and evening golden hours, and a live countdown to the next one. **Assignment countdowns**: big "X days left" cards, amber at 7 days and red at 2. Also today's events, your top 3 tasks, today's habits, and a quick-capture box that saves to an inbox. You choose and order the cards in Settings. |
| **Tasks** | Add/edit/complete tasks with a due date, priority and category, and mark any task as an **assignment**. Grouped into Overdue / Today / This week / Later, with category filters. Inbox items become tasks in one tap. |
| **Calendar** | Day timeline (with a "now" line) and week view. Events repeat daily, weekly, fortnightly or monthly, with an optional end date, and you can skip a single occurrence. |
| **Habits** | Water (tap +1 glass), sleep hours, creative practice (music / editing / photography, with minutes). Streaks and a 7-day chart for each. **Gym** is low-pressure: no streaks and no shaming, it celebrates every session, shows sessions this month, and has an optional gentle nudge you can switch off. |
| **Projects** | Cards with status, progress bar, next action and notes. You can add, archive and reorder them. Seeded with Northminster, Westbridge, your first house track, the college media club, drone permissions (IOM CAA) and the job search. |
| **Journal** | One entry per day, an optional mood, autosave, and search across past entries. |
| **Weekly review** | Summarises any week automatically (tasks done by category, habit hits, creative minutes, gym sessions, project progress), then asks what went well, what didn't, and your top 3 for next week. Saved reviews are kept, and Today shows a reminder every Sunday. |
| **Shot ideas** | A board of photo/video ideas: title, description, location, best time of day (golden hour, blue hour…), an inspiration link and image, and tags. Filter by tag or location, and tick ideas off as "shot". |
| **Kit lists** | Reusable cadet packing checklists (parade night, field day and camp to start with). Tick items off, and reset a whole list with one tap. Add, rename and delete lists and items. |
| **Gym plan** | An editable beginner routine: 3 full-body days, each with sets, reps and how-to notes. It suggests which day is next and celebrates every session. Shows sessions this month, with no streaks and no guilt. |
| **Year in pixels** | Every day of the year as a square, coloured by journal mood or by a productivity score (switchable). Tap a day to see its journal entry and stats. |
| **Morning summary** | An optional push notification each morning with the weather, golden hour and your top 3 tasks. Works on the installed iPhone app (iOS 16.4+). |
| **Settings** | **Categories**: add, rename, recolour, reorder and delete them (a rename updates everything using it). **Feature switches** for each extra. **Today card order and visibility.** Also shot tags, pixels colour mode, habit targets, morning notification time, **Export all data (JSON)**, and sign out. |

All "today", "this week" and streak calculations use **Europe/London**.

---

## Setup (about 15 minutes)

You'll need a GitHub account, a free Vercel account, and Node.js 20+ on your computer for the one-off password and seed steps.

### 1. Put the code on GitHub

If you're reading this on GitHub, the code is already there. Otherwise:

1. On GitHub, click **New repository** and name it `life-dash`. Make it **Private**, and don't add a README.
2. Push the code:
   ```bash
   git remote add origin https://github.com/<you>/life-dash.git
   ```
   ```bash
   git push -u origin main
   ```

### 2. Import it into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and choose **Import Git Repository**, then pick `life-dash`.
2. Vercel detects Next.js. Leave the build settings as they are, because the repo's `vercel-build` script runs database migrations and then builds.
3. **Don't deploy yet.** First add the database and environment variables (steps 3 and 4). If you've already deployed and it failed, that's fine: it'll work after step 4.

After this, every push to `main` deploys to production, and every pull request gets its own preview URL.

### 3. Add a Postgres database from the Vercel Marketplace

1. In your Vercel project, open the **Storage** tab, click **Create Database**, choose **Neon** (Serverless Postgres), and pick the free plan.
2. Pick the region closest to you (e.g. **London / eu-west-2**). Then connect it to the `life-dash` project for **Production** and **Preview**.
3. This adds `DATABASE_URL` (and some other `PG*` variables) to the project automatically.

> **Recommended:** in the Neon integration settings, turn on **"Create a database branch for each Preview deployment"**. Pull-request previews then get their own copy of the database, so testing a PR (and its migrations) can never touch your real data. If you leave it off, previews use your production database.

### 4. Choose your password (no command line needed)

1. Open your Vercel site URL. Because no password is set yet, it shows a **Set up Life** page.
2. Type the password you want and press **Continue**. It shows two keys with values (`AUTH_PASSWORD_HASH` and `SESSION_SECRET`), each with **Copy** buttons.
3. In Vercel, go to **Settings → Environment Variables** and add both, pasting each key and its value.
4. Go to **Deployments**, open the **⋯** menu on the top one, and choose **Redeploy**.

Your actual password is never stored anywhere, only a scrambled (scrypt) version of it. Once it's set, the setup page switches itself off.

(Prefer the terminal? `node scripts/hash-password.mjs "your-password"` gives the same hash, and `openssl rand -base64 48` makes a session secret.)

### 5. Starter projects

These are added automatically on the first deploy: Northminster, Westbridge, your house track, the media club, drone permissions and the job search. This only happens once, so anything you delete or rename stays that way.

### 6. Morning notifications (optional, about 5 minutes)

1. In the app, open **Settings → Morning summary** and tap **Generate the values**. You'll get three keys, each with a value: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET`.
2. Add all three in Vercel under **Settings → Environment Variables** (Production), then **Redeploy**.
3. On your iPhone, open Life **from the Home Screen icon** (iPhone only allows notifications from the installed app). Go to **Settings → Morning summary**, tap **Allow notifications on this device**, then choose your time.
4. Tap **Send a test** to check it arrives.

**How the timing works.** `vercel.json` sets up a **Vercel Cron job** that calls `/api/cron/morning` once a day at **06:30 UTC**. That's 06:30 in winter and 07:30 in British Summer Time. Vercel's free Hobby plan only allows once-a-day cron jobs, so on its own **the notification arrives at that fixed time**, whatever time you pick in Settings.

To get it at **exactly your chosen time** (06:00–10:30), turn on the free GitHub pinger that's already in the repo (`.github/workflows/morning-push.yml`):

1. On GitHub, open your repo and go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Add `LIFE_URL` with your site address, e.g. `https://life-dash-xyz.vercel.app`.
3. Add `CRON_SECRET` with the same value you put in Vercel.

From then on it checks in every 15 minutes each morning, and the app sends the notification once, at your time. While the pinger is active, the daily Vercel run stands aside so you never get two. (On Vercel Pro you could instead change the schedule in `vercel.json` to `*/15 5-10 * * *` and skip GitHub.)

The cron endpoint only runs with the right `CRON_SECRET`. Vercel sends it automatically; the GitHub workflow sends it from the secret.

### 7. Install it on your iPhone

1. Open your Vercel URL (e.g. `https://life-dash-xyz.vercel.app`) in **Safari** and sign in.
2. Tap **Share** (the square with an arrow), then **Add to Home Screen**, then **Add**.
3. Open **Life** from your home screen. It runs full-screen like an app and stays signed in for 30 days.

On desktop (Chrome/Edge), you can also click the install icon in the address bar.

---

## Running it locally

```bash
npm install
```
```bash
cp .env.example .env
```

Fill in `.env`: use your Neon URL (from `vercel env pull`) or any local Postgres, e.g. `postgresql://postgres@localhost:5432/life`. Then run:

```bash
npm run db:migrate
```
```bash
npm run db:seed
```
```bash
npm run dev
```

Open <http://localhost:3000>.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | Type-check |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (also runs on every Vercel build) |
| `npm run db:seed` | Seed projects and settings |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run hash-password -- "pw"` | Generate `AUTH_PASSWORD_HASH` |
| `node scripts/gen-springs.mjs` | Regenerate the spring easing curves in `src/app/motion.css` |

To change the schema, edit `src/db/schema.ts`, run `npm run db:generate`, and commit the new file in `drizzle/`. It's applied on the next deploy.

---

## Environment variables

| Variable | Required | What it's for |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string (added by the Neon integration) |
| `AUTH_PASSWORD_HASH` | ✅ | Your hashed password (from the setup page) |
| `SESSION_SECRET` | ✅ | Signs the login cookie (from the setup page) |
| `VAPID_PUBLIC_KEY` | for notifications | Web Push key pair (Settings → Morning summary → Generate) |
| `VAPID_PRIVATE_KEY` | for notifications | ″ |
| `CRON_SECRET` | for notifications | Protects `/api/cron/morning`; Vercel Cron sends it automatically |
| `VAPID_SUBJECT` | optional | Contact for push services (`mailto:` or `https:`). Defaults to your site's URL |

## Database changes in this version

`drizzle/0001_features.sql` only **adds** things: new tables (`categories`, `shot_ideas`, `kit_lists`, `kit_items`, `push_subscriptions`) and a new `tasks.is_assignment` column (default `false`). It also fills the categories table from the six defaults plus any category names already in use, and creates the starter kit lists. Nothing existing is changed or deleted. It runs automatically on the next deploy, like every migration. New settings (feature switches, card order, gym plan, etc.) are added with default values when they're first read.

## How it works

- **Sync across devices.** Every change is saved straight to Postgres. Each screen re-fetches when the app comes to the foreground, every 5 s while it's open, and after every change. Something added on your phone shows up on your desktop within a few seconds, no refresh needed.
- **Instant ticks.** Changes are optimistic: the UI updates immediately and rolls back with a message if the save fails.
- **Login.** One password, checked against a scrypt hash. A signed, `HttpOnly`, `Secure` session cookie lasts 30 days. Every page and API route except `/login` is protected by `src/proxy.ts`. Failed logins are slowed down.
- **Golden hour** uses [suncalc](https://github.com/mourner/suncalc) for Ramsey: the morning golden hour runs from sunrise until the sun is 6° up, and the evening one from 6° until sunset (`src/lib/sun.ts`).
- **Productivity score** (Year in pixels): up to 3 points for tasks done, plus a point each for hitting water, sleep, any creative practice and any gym session. That's 7 points, bucketed into 4 levels (`src/lib/pixels.ts`).
- **Weather** comes from [Open-Meteo](https://open-meteo.com) (no key) for lat 54.32, lon −4.38, cached for 15 minutes. The thresholds are in `src/lib/weather.ts`:
  - **Good to be outside:** no rain now, under a 30% chance in the next 3 hours, wind under 20 km/h, visibility of at least 10 km.
  - **Calm enough to fly:** dry, wind under 25 km/h, gusts under 35 km/h. Always check the IOM CAA rules too.
- **Design.** System font (SF Pro on Apple devices), automatic light/dark mode, one indigo accent, muted category colours, and respect for the iPhone notch and home bar.
- **Motion.** Modelled on [SwiftUI's animation system](https://developer.apple.com/documentation/swiftui/animations). `scripts/gen-springs.mjs` simulates SwiftUI's spring presets (`.smooth`, `.snappy`, `.bouncy`, `.interactiveSpring`) from Apple's duration/bounce parameters and turns them into CSS `linear()` easings (`src/app/motion.css`).
  - **Sheets:** slide in with `.smooth` and leave with a quicker exit, like `.move(edge: .bottom)`.
  - **Ticked items:** pop with `.bouncy`.
  - **Buttons:** press with an interactive spring.
  - **Numbers:** roll like `.contentTransition(.numericText())`.
  - **Tab icons:** bounce like SF Symbols when you switch tabs.
  - **Reduce Motion:** if it's on, movement becomes simple fades.

## Limitations

- **"Instant" sync means a few seconds.** Updates arrive via polling, not live push. That keeps everything on Vercel's free tier with no extra services.
- **Needs a connection.** The app installs and opens full-screen, but it doesn't work offline.
- **Image links only.** Shot-idea images are web links (paste an image address); there's no photo upload.
- **Notification timing.** On the free Vercel plan the notification comes at the fixed daily cron time unless you turn on the GitHub pinger (see above). GitHub can run scheduled jobs a few minutes late at busy times.
- **Manual calendar.** There's no Google or Apple Calendar import or sync (by design).
- **No AI in the weekly review.** It's calculated from your data, not written by AI.
