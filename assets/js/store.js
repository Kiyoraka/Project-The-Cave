/* ============================================================================
   store.js — Gua Tempurung
   Single source of truth: reactive state + all hardcoded data + tiny pub/sub.
   Ported verbatim from the source design's DCLogic state model.
   ============================================================================ */
(function (global) {
  'use strict';

  /* --- Constants --- */
  var TICKET_PRICE = 48;
  var MONTHS = ['January','February','March','April','May','June','July',
                'August','September','October','November','December'];
  var WEEKDAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* --- Hardcoded content data (exact from design, rebranded) --- */
  var HERO_SLIDES = [
    { kicker: 'Featured route · Hiking', title: 'Above the clouds, on foot',
      sub: 'Two days along an exposed alpine ridge, nights under a sky with no city in it.',
      meta: 'Alpine Ridge Trek · 2 days · Challenging' },
    { kicker: 'Featured route · Water', title: 'Paddle the wild water',
      sub: 'Run a glassy canyon river between thousand-foot walls with a certified river guide.',
      meta: 'Canyon River Kayak · 1 day · Moderate' },
    { kicker: 'Featured route · Forest', title: 'Walk among giants',
      sub: 'A gentle half-day through old-growth forest where the light comes down in columns.',
      meta: 'Old-Growth Forest Walk · Half day · Easy' }
  ];
  var HERO_BGS = [
    'repeating-radial-gradient(circle at 72% 38%, transparent 0 26px, rgba(168,192,138,.10) 26px 27px), radial-gradient(120% 130% at 75% 15%, #3c5a3e 0%, #243d29 45%, #16261b 100%)',
    'repeating-radial-gradient(circle at 70% 40%, transparent 0 24px, rgba(170,205,200,.10) 24px 25px), radial-gradient(120% 130% at 70% 20%, #2f5a52 0%, #1e3f3a 48%, #14292a 100%)',
    'repeating-radial-gradient(circle at 70% 42%, transparent 0 28px, rgba(214,179,120,.10) 28px 29px), radial-gradient(120% 130% at 72% 18%, #5a4a32 0%, #3a3020 46%, #211a12 100%)'
  ];

  var GAL_VIDEOS = [
    { t: 'Summit at dawn',     d: '1:24', g: 'radial-gradient(120% 120% at 70% 20%, #3c5a3e, #16261b)' },
    { t: 'River run',          d: '0:58', g: 'radial-gradient(120% 120% at 70% 20%, #2f5a52, #14292a)' },
    { t: 'Into the canyon',    d: '2:10', g: 'radial-gradient(120% 120% at 70% 20%, #5a4a32, #211a12)' },
    { t: 'Forest light',       d: '1:46', g: 'radial-gradient(120% 120% at 70% 20%, #46603a, #1b2913)' },
    { t: 'Camp under stars',   d: '3:02', g: 'radial-gradient(120% 120% at 70% 20%, #2c3b4f, #121821)' },
    { t: 'Ridge traverse',     d: '1:12', g: 'radial-gradient(120% 120% at 70% 20%, #3c5a3e, #16261b)' }
  ];
  var GAL_PHOTOS = ['Trailhead','Switchbacks','Glacier melt','Old growth','Cliff edge','Base camp','Wildflowers','Summit view']
    .map(function (c, i) { return { id: 'gal' + i, cap: c }; });

  /* KPI sparkline series + colors */
  var KPIS = [
    { label: 'Revenue · 30d',  value: '$48.2k', delta: '+12.4%', up: true, series: [30,34,31,38,36,42,40,45,43,48], color: '#2f4a32' },
    { label: 'Tickets sold',   value: '312',    delta: '+8.1%',  up: true, series: [18,22,20,26,24,28,30,29,33,35], color: '#8a6d4f' },
    { label: 'Visitors',       value: '1,184',  delta: '+5.6%',  up: true, series: [60,70,66,80,78,90,96,92,104,112], color: '#bf6b3a' },
    { label: 'Capacity used',  value: '82%',     delta: '+4.0%',  up: true, series: [62,65,63,70,68,74,72,78,80,82], color: '#3a5a40' }
  ];

  var RAW_BOOKINGS = [
    { ref: 'GT-2048', guest: 'Maya Lin',    tour: 'Day pass',         date: 'Jul 12', guests: 2, amount: 96,  status: 'Confirmed' },
    { ref: 'GT-2047', guest: 'Theo Park',   tour: 'Day pass',         date: 'Jul 12', guests: 4, amount: 192, status: 'Paid' },
    { ref: 'GT-2046', guest: 'Aria Sol',    tour: 'Morning entry',    date: 'Jul 13', guests: 1, amount: 48,  status: 'Requested' },
    { ref: 'GT-2045', guest: 'Liam Voss',   tour: 'Day pass',         date: 'Jul 13', guests: 2, amount: 96,  status: 'Confirmed' },
    { ref: 'GT-2044', guest: 'Nadia Imre',  tour: 'Sunset entry',     date: 'Jul 14', guests: 3, amount: 144, status: 'Completed' },
    { ref: 'GT-2043', guest: 'Owen Cole',   tour: 'Day pass',         date: 'Jul 14', guests: 2, amount: 96,  status: 'Cancelled' },
    { ref: 'GT-2042', guest: 'Priya Raman', tour: 'Afternoon entry',  date: 'Jul 15', guests: 2, amount: 96,  status: 'Completed' },
    { ref: 'GT-2041', guest: 'Jonas Berg',  tour: 'Day pass',         date: 'Jul 15', guests: 5, amount: 240, status: 'Completed' },
    { ref: 'GT-2040', guest: 'Sena Okafor', tour: 'Morning entry',    date: 'Jul 16', guests: 1, amount: 48,  status: 'Requested' }
  ];
  var BOOKING_FILTERS = ['all', 'Requested', 'Confirmed', 'Completed'];

  /* Status chip palette: [fg, bg, border] */
  var STATUS_COLORS = {
    Requested: ['#8a5a1f', '#f6e8d2', '#e7cfa6'],
    Confirmed: ['#2f4a32', '#dfe9da', '#bcd3b1'],
    Paid:      ['#1f3a2e', '#d6e8df', '#aed0c0'],
    Completed: ['#544f3c', '#e9e4d6', '#d3ccb7'],
    Cancelled: ['#8a3322', '#f1ddd6', '#e1bcb1']
  };

  var CHANNELS = [
    { label: 'Website',  v: 46, color: '#2f4a32' },
    { label: 'Direct',   v: 24, color: '#8a6d4f' },
    { label: 'Partners', v: 18, color: '#bf6b3a' },
    { label: 'Walk-in',  v: 12, color: '#a9b395' }
  ];
  var REVENUE_SERIES = [22,26,24,31,28,35,38,33,42,39,45,48];
  var WEEKDAY_BARS = [
    { name: 'Mon', v: 42 }, { name: 'Tue', v: 38 }, { name: 'Wed', v: 45 }, { name: 'Thu', v: 52 },
    { name: 'Fri', v: 74 }, { name: 'Sat', v: 96 }, { name: 'Sun', v: 88 }
  ];

  var TRACK_STEP_LABELS = ['Booked', 'Confirmed', 'Ready to check in', 'Checked in', 'Completed'];
  var TRACK_CURRENT = 1; /* index of the active step */
  var DEFAULT_TRACK = { ref: 'GT-2048', date: 'Saturday, July 11', tickets: 2,
                        venue: 'Gua Tempurung Basecamp', gates: 'Gates open 8:00 AM' };

  var SETTINGS_TEAM = [
    { name: 'Rowan Mercer',   role: 'Lead guide · Owner', init: 'RM' },
    { name: 'Sage Whitlock',  role: 'Operations',         init: 'SW' },
    { name: 'Bo Castellan',   role: 'River guide',        init: 'BC' }
  ];
  var BUSINESS = { name: 'Gua Tempurung Guided Adventures', email: 'hello@guatempurung.co' };

  var ADMIN_TITLES = {
    main:     ['Overview',       "Today's pulse across the basecamp"],
    analysis: ['Analytics',      'Revenue, demand and channel performance'],
    booking:  ['Bookings',       'Every reservation in one place'],
    pos:      ['Point of sale',  'Sell dated tickets'],
    setting:  ['Settings',       'Configure your operation']
  };

  /* --- Reactive state (mode/device dropped: routes + responsive replace them) --- */
  var state = {
    landingTab: 'home',
    adminTab:   'main',
    galleryTab: 'videos',
    heroIndex:  0,
    calYear: 2026, calMonth: 6,            /* July 2026 */
    selYear: 2026, selMonth: 6, selDay: 12,
    quotaWeekday: 40,                      /* Mon-Fri tickets/day */
    quotaWeekend: 60,                      /* Sat-Sun tickets/day */
    bookedByDate: {},
    ticketQty: 2,
    lastBooking: null,
    bookingFilter: 'all'
  };

  /* --- Tiny pub/sub --- */
  var subscribers = [];
  function subscribe(fn) { subscribers.push(fn); }
  function emit() { for (var i = 0; i < subscribers.length; i++) subscribers[i](state); }
  function setState(patch) {
    for (var k in patch) { if (patch.hasOwnProperty(k)) state[k] = patch[k]; }
    emit();
  }

  /* --- Money helper (currency symbol fixed to $, as the design default) --- */
  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  /* --- Gallery: editable content persisted in the browser (no backend) ---
     Owner edits in admin Settings -> saved to localStorage 'gt_gallery' ->
     the public Gallery renders from here. `src` is an uploaded data-URL or a
     pasted URL ('' = fall back to the design placeholder). */
  var GAL_KEY = 'gt_gallery';
  function gallery() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(GAL_KEY) || 'null'); } catch (e) { saved = null; }
    var sv = saved && saved.videos || [];
    var sp = saved && saved.photos || [];
    return {
      videos: GAL_VIDEOS.map(function (v, i) {
        var s = sv[i] || {};
        return { t: s.t != null ? s.t : v.t, d: s.d != null ? s.d : v.d, g: v.g, src: s.src || '' };
      }),
      photos: GAL_PHOTOS.map(function (p, i) {
        var s = sp[i] || {};
        return { cap: s.cap != null ? s.cap : p.cap, src: s.src || '' };
      })
    };
  }
  function saveGallery(draft) {
    try { localStorage.setItem(GAL_KEY, JSON.stringify(draft)); return true; } catch (e) { return false; }
  }

  global.Store = {
    state: state, setState: setState, subscribe: subscribe, money: money,
    TICKET_PRICE: TICKET_PRICE, MONTHS: MONTHS, WEEKDAYS_FULL: WEEKDAYS_FULL,
    HERO_SLIDES: HERO_SLIDES, HERO_BGS: HERO_BGS,
    GAL_VIDEOS: GAL_VIDEOS, GAL_PHOTOS: GAL_PHOTOS, gallery: gallery, saveGallery: saveGallery,
    KPIS: KPIS, RAW_BOOKINGS: RAW_BOOKINGS, BOOKING_FILTERS: BOOKING_FILTERS,
    STATUS_COLORS: STATUS_COLORS, CHANNELS: CHANNELS,
    REVENUE_SERIES: REVENUE_SERIES, WEEKDAY_BARS: WEEKDAY_BARS,
    TRACK_STEP_LABELS: TRACK_STEP_LABELS, TRACK_CURRENT: TRACK_CURRENT, DEFAULT_TRACK: DEFAULT_TRACK,
    SETTINGS_TEAM: SETTINGS_TEAM, BUSINESS: BUSINESS, ADMIN_TITLES: ADMIN_TITLES
  };
})(window);
