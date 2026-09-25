# Waypoint

A daily routine and health-metric tracker built with React, Vite, and Firebase. Log sleep, mood, medications, and any custom metrics you define, then review trends and day-by-day history over time.

**Live app:** [routine-tracker-82e5c.web.app](https://routine-tracker-82e5c.web.app/login)

## Features

- **Daily log** — set bedtime/wake time on a time-dial, log any metrics you've set up (scale ratings, yes/no toggles, or numeric counts), track medications taken, and add notes for the day.
- **Custom metrics** — pick from presets grouped into Mind, Body, and Habits (mood, energy, pain, workout, water, caffeine, etc.) during onboarding, or add your own with a custom label and type at any time.
- **History** — a calendar-style day view plus a trends view with charts, moving averages, and streak/week-over-week insights per metric.
- **Data export** — download your full history as JSON (raw, portable copy) or CSV (spreadsheet-friendly, with medication/metric IDs resolved to labels).
- **Accounts** — email/password and Google sign-in via Firebase Auth, with onboarding gated separately from the rest of the app.
- **PWA** — installable as a standalone app on mobile, with its own icon set and manifest.
- **Timezone-aware day boundaries** — a day's key is computed in the user's detected/selected IANA timezone rather than UTC, so entries don't silently roll over early in the evening.

## Tech stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Firebase](https://firebase.google.com/) — Auth, Firestore, and Hosting

## Project structure

```
src/
├── components/      # Shared UI (Layout, Navbar, TimeWheel, MetricInput, charts, etc.)
├── context/         # Loading-bar context
├── firebase/        # Firebase app config + Firestore read/write helpers
├── pages/           # Route-level views (Home, History, Settings, Onboarding, Login/Register)
├── utils/           # Metric definitions, sleep-time math, trend math, CSV/JSON export
└── App.jsx          # Route definitions
tests/
└── metrics.test.js  # Plain-Node tests for the metrics utilities
```

## Getting started

### Prerequisites

- Node.js and npm
- A Firebase project with Authentication (Email/Password + Google) and Firestore enabled

### Setup

```bash
git clone https://github.com/Zappy28/routine-tracker.git
cd routine-tracker
npm install
```

Firebase config currently lives directly in `src/firebase/config.js`. Replace it with your own Firebase project's config (these are the public client keys Firebase expects in a web app — access is controlled by `firestore.rules`, not by keeping this file secret).

### Run locally

```bash
npm run dev
```

### Other scripts

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # ESLint
npm run test      # runs tests/metrics.test.js
```

### Deploying

Hosting, Firestore rules, and indexes are already configured in `firebase.json`, `firestore.rules`, and `firestore.indexes.json`. After `npm run build`:

```bash
firebase deploy
```

## Data model

Each user's data lives under `users/{uid}` in Firestore:

- `days/{YYYY-MM-DD}` — one document per day: metric values, sleep bed/wake times, medications taken, and notes.
- Metric and medication definitions are stored on the user's profile, so a custom metric like "IBS" just becomes another column in your data — nothing is hardcoded per metric.
