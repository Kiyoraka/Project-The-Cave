/* ============================================================================
   landing.js — Gua Tempurung landing page controller
   Wires tab routing (desktop nav + mobile bottom nav), the hero carousel,
   gallery toggle, calendar and booking flow. Drives both view blocks at once.
   ============================================================================ */
(function (global) {
  'use strict';
  var S = global.Store, App = global.App, Cal = global.Calendar, Booking = global.Booking;

  /* --- Tab routing --- */
  App.onAction('goHome', function () { S.setState({ landingTab: 'home' }); });
  App.onAction('goBook', function () { S.setState({ landingTab: 'book' }); });
  App.onAction('goGallery', function () { S.setState({ landingTab: 'gallery' }); });
  App.onAction('goTrack', function () { S.setState({ landingTab: 'track' }); });

  /* --- Hero carousel --- */
  App.onAction('heroPrev', function () { S.setState({ heroIndex: (S.state.heroIndex + 2) % 3 }); });
  App.onAction('heroNext', function () { S.setState({ heroIndex: (S.state.heroIndex + 1) % 3 }); });
  App.onAction('heroDot', function (arg) { S.setState({ heroIndex: +arg }); });

  /* --- Gallery toggle --- */
  App.onAction('setGalVideos', function () { S.setState({ galleryTab: 'videos' }); });
  App.onAction('setGalPhotos', function () { S.setState({ galleryTab: 'photos' }); });

  /* --- Calendar --- */
  App.onAction('prevMonth', function () {
    var m = S.state.calMonth - 1, y = S.state.calYear;
    if (m < 0) { m = 11; y -= 1; }
    S.setState({ calMonth: m, calYear: y });
  });
  App.onAction('nextMonth', function () {
    var m = S.state.calMonth + 1, y = S.state.calYear;
    if (m > 11) { m = 0; y += 1; }
    S.setState({ calMonth: m, calYear: y });
  });
  App.onAction('pickDate', function (arg) {
    var d = +arg, st = S.state;
    if (Cal.avail(st.calYear, st.calMonth, d) <= 0) return;   /* sold out: not selectable */
    S.setState({ selYear: st.calYear, selMonth: st.calMonth, selDay: d, ticketQty: 1, lastBooking: null });
  });

  /* --- Booking --- */
  App.onAction('incTicket', Booking.incTicket);
  App.onAction('decTicket', Booking.decTicket);
  App.onAction('bookTickets', Booking.bookTickets);
  App.onAction('clearBooking', Booking.clearBooking);

  /* --- Render --- */
  function heroValues() {
    var i = S.state.heroIndex, slide = S.HERO_SLIDES[i], num = '0' + (i + 1);
    return {
      heroNum: num,
      heroBadge: S.HERO_VIDEO ? ('Hero film · ' + num) : ('Hero video ' + num + ' · drops in later'),
      heroKicker: slide.kicker, heroTitle: slide.title, heroSub: slide.sub, heroMeta: slide.meta,
      heroBg: 'position:absolute;inset:0;background:' + S.HERO_BGS[i] + ';'
    };
  }

  /* Hero background video: cover-fill + slow zoom (CSS). Shown only when a source is set. */
  function setHeroVideo() {
    var src = S.HERO_VIDEO;
    App.each(document, '.hero-video', function (el) {
      if (src) {
        if (el.getAttribute('src') !== src) el.src = src;
        el.style.display = 'block';
        var p = el.play(); if (p && p.catch) { p.catch(function () {}); }
      } else {
        el.removeAttribute('src');
        el.style.display = 'none';
      }
    });
  }

  /* --- Gallery rendering (from Store.gallery, which reads localStorage) --- */
  function galVideoCard(v, sm) {
    var h = sm ? 150 : 230, rad = sm ? 14 : 16, play = sm ? 42 : 56, picon = sm ? 15 : 20, tsize = sm ? 14 : 18;
    var hasSrc = !!v.src;
    var bg = hasSrc ? "#16261b url(&quot;" + App.escapeHtml(v.src) + "&quot;) center/cover" : v.g;
    var overlay = sm ? 'linear-gradient(180deg, transparent 45%, rgba(11,20,14,.72) 100%)'
                     : 'linear-gradient(180deg, transparent 40%, rgba(11,20,14,.7) 100%)';
    var badge = (!sm && !hasSrc)
      ? '<span style="position:absolute;top:13px;left:13px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);color:#e9efe2;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;"><span style="width:6px;height:6px;border-radius:50%;background:#bf6b3a;"></span>Video · later</span>'
      : '';
    var duration = (!sm && v.d)
      ? '<span style="position:absolute;bottom:14px;right:14px;background:rgba(0,0,0,.5);color:#f4f1ea;font-size:12px;padding:3px 9px;border-radius:6px;font-variant-numeric:tabular-nums;">' + App.escapeHtml(v.d) + '</span>'
      : '';
    var bottom = sm ? '9px' : '13px', bleft = sm ? '11px' : '14px';
    return '<div class="hov-lift" style="position:relative;height:' + h + 'px;border-radius:' + rad + 'px;overflow:hidden;background:' + bg + ';cursor:pointer;">'
      + '<div style="position:absolute;inset:0;background:' + overlay + ';"></div>' + badge
      + '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:' + play + 'px;height:' + play + 'px;border-radius:50%;background:rgba(244,241,234,.92);display:flex;align-items:center;justify-content:center;"><svg width="' + picon + '" height="' + picon + '" viewBox="0 0 24 24" fill="#1f3326"><path d="M8 5v14l11-7z"/></svg></span>'
      + '<span style="position:absolute;bottom:' + bottom + ';left:' + bleft + ';color:#f4f1ea;font-family:\'Newsreader\',serif;font-size:' + tsize + 'px;">' + App.escapeHtml(v.t) + '</span>'
      + duration + '</div>';
  }
  function galPhotoCard(p, sm) {
    var h = sm ? 150 : 210, rad = sm ? 14 : 16;
    var media = p.src
      ? '<img src="' + App.escapeHtml(p.src) + '" alt="' + App.escapeHtml(p.cap) + '" style="width:100%;height:' + h + 'px;object-fit:cover;border-radius:' + rad + 'px;display:block;">'
      : '<div class="img-slot" style="height:' + h + 'px;">Drop image</div>';
    if (sm) return media;   /* mobile: image only, no caption (matches design) */
    return '<div>' + media + '<div style="font-size:13px;color:#6b6553;margin-top:9px;padding-left:2px;">' + App.escapeHtml(p.cap) + '</div></div>';
  }
  function renderGallery() {
    var g = S.gallery();
    App.each(document, '[data-gallery="videos"]', function (el) {
      var sm = el.getAttribute('data-gsize') === 'sm';
      el.innerHTML = g.videos.map(function (v) { return galVideoCard(v, sm); }).join('');
    });
    App.each(document, '[data-gallery="photos"]', function (el) {
      var sm = el.getAttribute('data-gsize') === 'sm';
      el.innerHTML = g.photos.map(function (p) { return galPhotoCard(p, sm); }).join('');
    });
  }

  function render() {
    var st = S.state;
    var values = heroValues();
    var bk = Booking.values();
    for (var k in bk) values[k] = bk[k];
    App.apply(values);

    Cal.render();
    App.showPanel('landing', st.landingTab);
    App.setActiveTab('landing', st.landingTab);

    /* gallery blocks + toggle */
    App.each(document, '[data-gallery]', function (el) {
      el.hidden = el.getAttribute('data-gallery') !== st.galleryTab;
    });
    App.each(document, '.gal-toggle', function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-gtab') === st.galleryTab);
    });

    /* hero dots */
    App.each(document, '.hero-dot', function (b) {
      var on = +b.getAttribute('data-arg') === st.heroIndex;
      b.style.width = on ? '24px' : '7px';
      b.style.background = on ? '#f4f1ea' : 'rgba(244,241,234,.42)';
    });
  }

  S.subscribe(render);
  App.ready(function () {
    renderGallery();   /* fill gallery once from saved/default content */
    setHeroVideo();    /* attach hero video if a source is configured */
    render();
    /* hero autoplay — only while Home is the active tab (matches the design) */
    setInterval(function () {
      if (S.state.landingTab === 'home') S.setState({ heroIndex: (S.state.heroIndex + 1) % 3 });
    }, 5200);
  });
})(window);
