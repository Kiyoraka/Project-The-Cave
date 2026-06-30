# Gua Tempurung — Guided Adventures

A pixel-faithful implementation of the WILDTRAIL Claude Design, rebranded to **Gua Tempurung**
(the Perak limestone cave), built as a hand-written vanilla HTML/CSS/JS site.

Software Version: 1.0

## Description
A guided-adventures booking site with a public landing experience and a staff back-office:

- **Landing** (`/` → `index.html`) — Home (hero carousel), Book (calendar + ticket booking),
  Gallery (videos/photos), Track (booking status).
- **Admin** (`/admin` → `admin/index.html`) — "Basecamp OS": Main dashboard, Analysis,
  Booking, POS (point of sale), Settings.

All data is hardcoded; there is no backend.

## Responsive design
Each screen ships **two isolated layouts** — `.view-desktop` and `.view-mobile` — that swap
automatically at the **768px** breakpoint (no manual toggle). Logic is shared and
device-agnostic: state lives in `assets/js/store.js`, and one render loop drives both blocks.
This follows the "isolate layout, share logic" rule — editing one device's markup never
touches the other.

## Structure
```
index.html              Landing (desktop + mobile blocks)
admin/index.html        Basecamp OS admin (desktop + mobile blocks)
assets/
  css/base.css          reset, design tokens, fonts, responsive view toggle
  css/landing.css       landing layouts
  css/admin.css         admin layouts
  js/store.js           reactive state + hardcoded data + pub/sub
  js/render.js          binding + list render + event delegation
  js/calendar.js        shared month grid + availability
  js/booking.js         ticket flow + booking view-model
  js/landing.js         landing controller
  js/admin.js           admin controller (charts, tables, POS, settings)
```

## Running locally
Serve from the project root so `/` and `/admin` resolve and the shared `/assets` load:

```bash
npx serve .
# or: python -m http.server 8000
```

Then open `http://localhost:<port>/` (landing) and `http://localhost:<port>/admin/`.

Fonts (Newsreader + Spectral) load from Google Fonts.
