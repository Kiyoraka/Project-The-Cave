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

  /* ----------------------------- gallery editor ---------------------------- */
  var galTab = 'video';
  var galleryDraft = null;
  function gdraft() { if (!galleryDraft) galleryDraft = S.gallery(); return galleryDraft; }
  function isData(s) { return s && s.indexOf('data:') === 0; }

  function galThumb(type, item) {
    if (type === 'video') {
      var bg = item.src ? '#16261b url(&quot;' + App.escapeHtml(item.src) + '&quot;) center/cover' : item.g;
      return '<div style="width:84px;height:56px;border-radius:8px;flex-shrink:0;background:' + bg + ';position:relative;overflow:hidden;"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:rgba(244,241,234,.9);display:flex;align-items:center;justify-content:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="#1f3326"><path d="M8 5v14l11-7z"/></svg></span></div>';
    }
    return item.src
      ? '<div style="width:56px;height:56px;border-radius:8px;flex-shrink:0;background:#dfe4d4 url(&quot;' + App.escapeHtml(item.src) + '&quot;) center/cover;"></div>'
      : '<div style="width:56px;height:56px;border-radius:8px;flex-shrink:0;background:#dfe4d4;border:1px dashed #b9c1a8;"></div>';
  }

  function galRowsHtml() {
    var d = gdraft();
    var inp = 'border:1px solid #ddd6c5;border-radius:9px;padding:8px 11px;background:#fff;font-size:13.5px;color:#23291f;';
    if (galTab === 'video') {
      return d.videos.map(function (v, i) {
        var urlVal = isData(v.src) ? '' : (v.src || '');
        return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #ece6d7;flex-wrap:wrap;">'
          + '<div data-gthumb="video-' + i + '">' + galThumb('video', v) + '</div>'
          + '<div style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:7px;">'
          + '<input data-gfield="t" data-gtype="video" data-gidx="' + i + '" value="' + App.escapeHtml(v.t) + '" placeholder="Video title" style="' + inp + '">'
          + '<div style="display:flex;gap:7px;">'
          + '<input data-gfield="d" data-gtype="video" data-gidx="' + i + '" value="' + App.escapeHtml(v.d) + '" placeholder="0:00" style="width:80px;' + inp + '">'
          + '<input data-gfield="src" data-gtype="video" data-gidx="' + i + '" value="' + App.escapeHtml(urlVal) + '" placeholder="Poster image URL (or upload)" style="flex:1;min-width:120px;' + inp + '">'
          + '</div></div>'
          + '<button class="btn-soft" data-action="galUpload" data-gtype="video" data-gidx="' + i + '" style="border:1px solid #ddd6c5;background:#fff;color:#2f4a32;border-radius:9px;padding:8px 13px;font-size:13px;">Upload</button>'
          + '</div>';
      }).join('');
    }
    return d.photos.map(function (p, i) {
      var urlVal = isData(p.src) ? '' : (p.src || '');
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #ece6d7;flex-wrap:wrap;">'
        + '<div data-gthumb="image-' + i + '">' + galThumb('image', p) + '</div>'
        + '<div style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:7px;">'
        + '<input data-gfield="cap" data-gtype="image" data-gidx="' + i + '" value="' + App.escapeHtml(p.cap) + '" placeholder="Caption" style="' + inp + '">'
        + '<input data-gfield="src" data-gtype="image" data-gidx="' + i + '" value="' + App.escapeHtml(urlVal) + '" placeholder="Image URL (or upload)" style="' + inp + '">'
        + '</div>'
        + '<button class="btn-soft" data-action="galUpload" data-gtype="image" data-gidx="' + i + '" style="border:1px solid #ddd6c5;background:#fff;color:#2f4a32;border-radius:9px;padding:8px 13px;font-size:13px;">Upload</button>'
        + '</div>';
    }).join('');
  }

  function renderEditor() {
    App.each(document, '[data-gallery-editor]', function (el) { el.innerHTML = galRowsHtml(); });
    App.each(document, '.gtab', function (b) { b.classList.toggle('is-active', b.getAttribute('data-arg') === galTab); });
  }

  function setRowSrc(type, idx, src) {
    var d = gdraft();
    var item = type === 'video' ? d.videos[idx] : d.photos[idx];
    item.src = src;
    App.each(document, '[data-gthumb="' + type + '-' + idx + '"]', function (t) { t.innerHTML = galThumb(type, item); });
    /* uploaded data-URLs don't belong in the URL box — clear it so it isn't dumped there */
    App.each(document, 'input[data-gfield="src"][data-gtype="' + type + '"][data-gidx="' + idx + '"]', function (inp) {
      inp.value = isData(src) ? '' : src;
    });
  }

  function downscale(dataUrl, cb) {
    var img = new Image();
    img.onload = function () {
      var max = 1000, w = img.width, h = img.height;
      if (w > max || h > max) { var r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      try { cb(c.toDataURL('image/jpeg', 0.72)); } catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  var pendingUpload = null;
  var fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f || !pendingUpload) { return; }
    var pu = pendingUpload;
    var reader = new FileReader();
    reader.onload = function () { downscale(reader.result, function (url) { setRowSrc(pu.type, pu.idx, url); }); };
    reader.readAsDataURL(f);
    fileInput.value = '';
  });

  App.onAction('galTab', function (arg) { galTab = arg; renderEditor(); });
  App.onAction('galUpload', function (arg, el) {
    pendingUpload = { type: el.getAttribute('data-gtype'), idx: +el.getAttribute('data-gidx') };
    fileInput.click();
  });
  App.onAction('galSave', function () {
    var ok = S.saveGallery(gdraft());
    App.each(document, '[data-gal-status]', function (s) {
      s.textContent = ok ? 'Saved — refresh the public Gallery to see it.' : 'Could not save (browser storage full).';
      s.style.color = ok ? '#2f4a32' : '#8a3322';
    });
  });

  /* ----------------------------- settings tabs (desktop) ------------------- */
  var settingsTab = 'capacity';
  function renderSettingsTabs() {
    App.each(document, '[data-spanel]', function (el) { el.hidden = el.getAttribute('data-spanel') !== settingsTab; });
    App.each(document, '.stab', function (b) { b.classList.toggle('is-active', b.getAttribute('data-arg') === settingsTab); });
  }
  App.onAction('settingsTab', function (arg) { settingsTab = arg; renderSettingsTabs(); });

  /* live text edits update the draft (no re-render -> keeps input focus) */
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-gfield]');
    if (!el) { return; }
    var type = el.getAttribute('data-gtype'), idx = +el.getAttribute('data-gidx'), field = el.getAttribute('data-gfield');
    var d = gdraft(), item = type === 'video' ? d.videos[idx] : d.photos[idx];
    item[field] = el.value;
    if (field === 'src') {
      App.each(document, '[data-gthumb="' + type + '-' + idx + '"]', function (t) { t.innerHTML = galThumb(type, item); });
    }
  });

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
  App.ready(function () { document.body.appendChild(fileInput); initStatics(); renderEditor(); renderSettingsTabs(); render(); });
})(window);
