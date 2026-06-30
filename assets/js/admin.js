/* ============================================================================
   admin.js — Gua Tempurung Basecamp OS controller
   Section routing, chart SVG generators, KPI/table rendering, POS sell flow
   (reuses calendar + booking modules), Setting quota + per-date override.
   ============================================================================ */
(function (global) {
  'use strict';
  var S = global.Store, App = global.App, Cal = global.Calendar, Booking = global.Booking;
  var uid = 0;

  /* ----------------------------- charts (SVG strings) ----------------------- */
  function areaChart(rev, stroke, fill) {
    var W = 760, H = 240, P = 12, top = 18, bottom = H - 26;
    var max = Math.max.apply(null, rev) * 1.14;
    var xx = function (i) { return P + i * ((W - 2 * P) / (rev.length - 1)); };
    var yy = function (v) { return top + (1 - v / max) * (bottom - top); };
    var line = rev.map(function (v, i) { return (i ? 'L' : 'M') + xx(i).toFixed(1) + ' ' + yy(v).toFixed(1); }).join(' ');
    var area = 'M' + xx(0).toFixed(1) + ' ' + bottom + ' '
      + rev.map(function (v, i) { return 'L' + xx(i).toFixed(1) + ' ' + yy(v).toFixed(1); }).join(' ')
      + ' L' + xx(rev.length - 1).toFixed(1) + ' ' + bottom + ' Z';
    var gid = 'ar' + (uid++);
    var grid = [0, .25, .5, .75, 1].map(function (g) {
      var y = top + g * (bottom - top);
      return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y + '" y2="' + y + '" stroke="#23291f" stroke-opacity=".06" stroke-width="1"/>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;overflow:visible;">'
      + '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="' + fill + '" stop-opacity="0.46"/><stop offset="100%" stop-color="' + fill + '" stop-opacity="0"/></linearGradient></defs>'
      + grid
      + '<path d="' + area + '" fill="url(#' + gid + ')"/>'
      + '<path d="' + line + '" fill="none" stroke="' + stroke + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>'
      + '<circle cx="' + xx(rev.length - 1) + '" cy="' + yy(rev[rev.length - 1]) + '" r="4.5" fill="' + stroke + '" stroke="#fff" stroke-width="2"/></svg>';
  }

  function barChart(items, color) {
    var W = 760, H = 240, top = 14, bottom = H - 30;
    var max = Math.max.apply(null, items.map(function (d) { return d.v; }));
    var bw = (W - (items.length + 1) * 16) / items.length, s = '';
    items.forEach(function (d, i) {
      var x = 16 + i * (bw + 16), hgt = (d.v / max) * (bottom - top), y = bottom - hgt;
      s += '<g><rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + hgt + '" rx="9" fill="' + color + '" opacity="' + (0.4 + 0.6 * (d.v / max)) + '"/>'
        + '<text x="' + (x + bw / 2) + '" y="' + (bottom + 19) + '" text-anchor="middle" font-size="13" fill="#6b6553" font-family="Spectral, serif">' + d.name + '</text>'
        + '<text x="' + (x + bw / 2) + '" y="' + (y - 9) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#2f4a32" font-family="Spectral, serif">' + d.v + '</text></g>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;">' + s + '</svg>';
  }

  function donut(items, center, label) {
    var r = 46, C = 2 * Math.PI * r, acc = 0, s = '';
    items.forEach(function (d) {
      var f = d.v / 100, dash = f * C, gap = C - f * C, off = -acc * C; acc += f;
      s += '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + d.color + '" stroke-width="15" stroke-dasharray="' + dash + ' ' + gap + '" stroke-dashoffset="' + off + '" transform="rotate(-90 60 60)"/>';
    });
    return '<svg viewBox="0 0 120 120" style="width:150px;height:150px;display:block;">' + s
      + '<text x="60" y="57" text-anchor="middle" font-size="19" font-weight="600" fill="#23291f" font-family="Newsreader, serif">' + center + '</text>'
      + '<text x="60" y="73" text-anchor="middle" font-size="8.5" fill="#8a8472" letter-spacing="1" font-family="Spectral, serif">' + label + '</text></svg>';
  }

  function spark(arr, color) {
    var W = 130, H = 38, P = 3, mx = Math.max.apply(null, arr), mn = Math.min.apply(null, arr);
    var xx = function (i) { return P + i * ((W - 2 * P) / (arr.length - 1)); };
    var yy = function (v) { return P + (1 - (v - mn) / ((mx - mn) || 1)) * (H - 2 * P); };
    var d = arr.map(function (v, i) { return (i ? 'L' : 'M') + xx(i).toFixed(1) + ' ' + yy(v).toFixed(1); }).join(' ');
    var gid = 'sp' + (uid++);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:38px;display:block;">'
      + '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity=".3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>'
      + '<path d="' + d + ' L' + xx(arr.length - 1) + ' ' + H + ' L' + xx(0) + ' ' + H + ' Z" fill="url(#' + gid + ')"/>'
      + '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function chip(label, kind) {
    var c = S.STATUS_COLORS[kind] || S.STATUS_COLORS.Requested;
    return '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;background:' + c[1]
      + ';color:' + c[0] + ';border:1px solid ' + c[2] + ';font-size:12px;font-weight:600;white-space:nowrap;">'
      + '<span style="width:6px;height:6px;border-radius:50%;background:' + c[0] + ';"></span>' + label + '</span>';
  }

  /* ----------------------------- static content (render once) --------------- */
  function initStatics() {
    var upArrow = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    App.list('[data-kpis]', S.KPIS, function (k) {
      return '<div style="background:#fbfaf6;border:1px solid #e3ddcd;border-radius:16px;padding:20px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
        + '<span style="font-size:13px;color:#7a7460;">' + k.label + '</span>'
        + '<span style="display:inline-flex;align-items:center;gap:3px;background:#dfe9da;color:#2f4a32;font-size:11.5px;font-weight:600;padding:3px 8px;border-radius:999px;">' + upArrow + k.delta + '</span></div>'
        + '<div style="font-family:\'Newsreader\',serif;font-size:32px;color:#1f3326;line-height:1;margin-bottom:14px;">' + k.value + '</div>'
        + '<div>' + spark(k.series, k.color) + '</div></div>';
    });

    App.list('[data-kpis-m]', S.KPIS, function (k) {
      return '<div style="background:#fbfaf6;border:1px solid #e3ddcd;border-radius:14px;padding:15px;">'
        + '<div style="font-size:12px;color:#7a7460;margin-bottom:8px;">' + k.label + '</div>'
        + '<div style="font-family:\'Newsreader\',serif;font-size:25px;color:#1f3326;line-height:1;margin-bottom:5px;">' + k.value + '</div>'
        + '<div style="font-size:11.5px;color:#2f4a32;font-weight:600;">' + k.delta + '</div></div>';
    });

    var recent = S.RAW_BOOKINGS.slice(0, 6);
    App.list('[data-recent]', recent, function (r) {
      return '<div class="adm-row" style="display:grid;grid-template-columns:78px 1fr 1fr 64px 84px;gap:10px;padding:13px 22px;align-items:center;border-bottom:1px solid #f0ebdd;font-size:13.5px;">'
        + '<span style="color:#8a6d4f;font-variant-numeric:tabular-nums;">' + r.ref + '</span>'
        + '<span style="color:#23291f;">' + r.guest + '</span><span style="color:#6b6553;">' + r.tour + '</span>'
        + '<span style="color:#6b6553;">' + r.date + '</span><span>' + chip(r.status, r.status) + '</span></div>';
    });
    App.list('[data-recent-m]', recent, function (r) {
      return '<div style="display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid #f0ebdd;">'
        + '<div style="flex:1;min-width:0;"><div style="font-size:14px;color:#23291f;">' + r.guest + '</div>'
        + '<div style="font-size:12px;color:#8a6d4f;">' + r.tour + '</div></div><span>' + chip(r.status, r.status) + '</span></div>';
    });

    var area = areaChart(S.REVENUE_SERIES, '#2f4a32', '#2f4a32');
    var bar = barChart(S.WEEKDAY_BARS, '#3a5a40');
    var dnt = donut(S.CHANNELS, '312', 'BOOKINGS');
    App.each(document, '[data-chart]', function (el) {
      var k = el.getAttribute('data-chart');
      el.innerHTML = k === 'donut' ? dnt : (k === 'weekdayBar' ? bar : area);
    });
  }

  /* ----------------------------- bookings (filter-driven) ------------------- */
  function renderBookings() {
    var f = S.state.bookingFilter;
    var rows = (f === 'all' ? S.RAW_BOOKINGS : S.RAW_BOOKINGS.filter(function (r) { return r.status === f; }));
    App.list('[data-bookings]', rows, function (r) {
      return '<div class="adm-row" style="display:grid;grid-template-columns:84px 1.1fr 1.2fr 70px 58px 84px 104px;gap:12px;padding:15px 22px;align-items:center;border-bottom:1px solid #f0ebdd;font-size:13.5px;">'
        + '<span style="color:#8a6d4f;font-variant-numeric:tabular-nums;">' + r.ref + '</span>'
        + '<span style="color:#23291f;">' + r.guest + '</span><span style="color:#6b6553;">' + r.tour + '</span>'
        + '<span style="color:#6b6553;">' + r.date + '</span>'
        + '<span style="color:#6b6553;font-variant-numeric:tabular-nums;">' + r.guests + '</span>'
        + '<span style="color:#1f3326;font-weight:600;font-variant-numeric:tabular-nums;">' + S.money(r.amount) + '</span>'
        + '<span>' + chip(r.status, r.status) + '</span></div>';
    });
    App.list('[data-bookings-m]', rows, function (r) {
      return '<div style="background:#fbfaf6;border:1px solid #e3ddcd;border-radius:14px;padding:15px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;">'
        + '<span style="font-size:12.5px;color:#8a6d4f;font-variant-numeric:tabular-nums;">' + r.ref + '</span>' + chip(r.status, r.status) + '</div>'
        + '<div style="font-family:\'Newsreader\',serif;font-size:18px;color:#1f3326;margin-bottom:3px;">' + r.guest + '</div>'
        + '<div style="font-size:13px;color:#6b6553;margin-bottom:10px;">' + r.tour + '</div>'
        + '<div style="display:flex;align-items:center;gap:14px;font-size:12.5px;color:#8a6d4f;border-top:1px solid #ece6d7;padding-top:10px;">'
        + '<span>' + r.date + '</span><span>' + r.guests + ' pax</span>'
        + '<span style="margin-left:auto;font-family:\'Newsreader\',serif;font-size:16px;color:#2f4a32;">' + S.money(r.amount) + '</span></div></div>';
    });
    App.each(document, '.flt', function (b) { b.classList.toggle('is-active', b.getAttribute('data-arg') === f); });
  }

  /* ----------------------------- actions ------------------------------------ */
  App.onAction('goMain', function () { S.setState({ adminTab: 'main' }); });
  App.onAction('goAnalysis', function () { S.setState({ adminTab: 'analysis' }); });
  App.onAction('goABooking', function () { S.setState({ adminTab: 'booking' }); });
  App.onAction('goPos', function () { S.setState({ adminTab: 'pos' }); });
  App.onAction('goSetting', function () { S.setState({ adminTab: 'setting' }); });
  App.onAction('setFilter', function (arg) { S.setState({ bookingFilter: arg }); });

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
    if (Cal.avail(st.calYear, st.calMonth, d) <= 0) return;
    S.setState({ selYear: st.calYear, selMonth: st.calMonth, selDay: d, ticketQty: 1, lastBooking: null });
  });

  App.onAction('incTicket', Booking.incTicket);
  App.onAction('decTicket', Booking.decTicket);
  App.onAction('bookTickets', Booking.bookTickets);
  App.onAction('clearBooking', Booking.clearBooking);

  App.onAction('incWeekday', function () { S.setState({ quotaWeekday: Math.min(500, S.state.quotaWeekday + 5) }); });
  App.onAction('decWeekday', function () { S.setState({ quotaWeekday: Math.max(0, S.state.quotaWeekday - 5) }); });
  App.onAction('incWeekend', function () { S.setState({ quotaWeekend: Math.min(500, S.state.quotaWeekend + 5) }); });
  App.onAction('decWeekend', function () { S.setState({ quotaWeekend: Math.max(0, S.state.quotaWeekend - 5) }); });

  /* ----------------------------- render ------------------------------------- */
  function adminValues() {
    var st = S.state, t = S.ADMIN_TITLES[st.adminTab] || S.ADMIN_TITLES.main;
    return {
      adminTitle: t[0], adminSubtitle: t[1],
      quotaWeekday: st.quotaWeekday,
      quotaWeekend: st.quotaWeekend
    };
  }

  function render() {
    var st = S.state;
    var values = adminValues();
    var bk = Booking.values();
    for (var k in bk) values[k] = bk[k];
    App.apply(values);

    Cal.render();
    App.showPanel('admin', st.adminTab);
    App.setActiveTab('admin', st.adminTab);
    renderBookings();
  }

  S.subscribe(render);
  App.ready(function () { initStatics(); render(); });
})(window);
