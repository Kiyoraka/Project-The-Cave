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
    var i = S.state.heroIndex, slide = S.HERO_SLIDES[i];
    return {
      heroNum: '0' + (i + 1),
      heroKicker: slide.kicker, heroTitle: slide.title, heroSub: slide.sub, heroMeta: slide.meta,
      heroBg: 'position:absolute;inset:0;background:' + S.HERO_BGS[i] + ';'
    };
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
    render();
    /* hero autoplay — only while Home is the active tab (matches the design) */
    setInterval(function () {
      if (S.state.landingTab === 'home') S.setState({ heroIndex: (S.state.heroIndex + 1) % 3 });
    }, 5200);
  });
})(window);
