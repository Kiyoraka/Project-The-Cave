/* ============================================================================
   booking.js — Gua Tempurung
   Ticket selection + booking flow, shared by landing Book and admin POS.
   Actions mutate the store; values() computes the booking view-model that
   render.js binds into both desktop and mobile blocks.
   ============================================================================ */
(function (global) {
  'use strict';
  var S = global.Store, Cal = global.Calendar;

  function sel() { return { y: S.state.selYear, m: S.state.selMonth, d: S.state.selDay }; }

  function incTicket() {
    var s = sel(), a = Cal.avail(s.y, s.m, s.d);
    S.setState({ ticketQty: Math.max(1, Math.min(a || 1, S.state.ticketQty + 1)) });
  }
  function decTicket() { S.setState({ ticketQty: Math.max(1, S.state.ticketQty - 1) }); }

  function bookTickets() {
    var s = sel();
    var cur = Cal.booked(s.y, s.m, s.d), q = Cal.quota(s.y, s.m, s.d), av = Math.max(0, q - cur);
    var take = Math.min(S.state.ticketQty, av);
    if (take <= 0) return;
    var ref = 'GT-' + (2050 + Math.floor(Math.random() * 900));
    var dateLabel = S.WEEKDAYS_FULL[new Date(s.y, s.m, s.d).getDay()] + ', ' + S.MONTHS[s.m] + ' ' + s.d;
    var k = Cal.dkey(s.y, s.m, s.d);
    var bbd = {}; for (var kk in S.state.bookedByDate) bbd[kk] = S.state.bookedByDate[kk];
    bbd[k] = cur + take;
    S.setState({ bookedByDate: bbd, lastBooking: { ref: ref, tickets: take, dateLabel: dateLabel, y: s.y, m: s.m, d: s.d } });
  }
  function clearBooking() { S.setState({ lastBooking: null }); }

  /* Compute every booking-related bound value. */
  function values() {
    var st = S.state, s = sel(), price = S.TICKET_PRICE;
    var q = Cal.quota(s.y, s.m, s.d), bk = Cal.booked(s.y, s.m, s.d), av = Math.max(0, q - bk);
    var soldout = av <= 0, limited = !soldout && av <= 8;
    var qty = Math.max(1, Math.min(st.ticketQty, soldout ? 1 : av));
    var total = qty * price;
    var posSub = qty * price, posTax = Math.round(posSub * 0.08), posTotal = posSub + posTax;
    var pct = q > 0 ? Math.round((bk / q) * 100) : 0;

    var fill = 'width:' + Math.min(100, pct) + '%;height:100%;border-radius:999px;background:'
      + (soldout ? '#a8552e' : (limited ? '#c47a3f' : '#2f4a32')) + ';transition:width .3s;';
    var chip = 'display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;background:'
      + (soldout ? '#f1ddd6' : (limited ? '#f6e8d2' : '#dfe9da')) + ';color:'
      + (soldout ? '#8a3322' : (limited ? '#8a5a1f' : '#2f4a32')) + ';font-size:13px;font-weight:600;';

    var lb = st.lastBooking;
    var track = lb
      ? { ref: lb.ref, date: lb.dateLabel, tickets: lb.tickets, venue: S.DEFAULT_TRACK.venue, gates: S.DEFAULT_TRACK.gates }
      : S.DEFAULT_TRACK;

    return {
      /* selected-date labels */
      calLabel: S.MONTHS[st.calMonth] + ' ' + st.calYear,
      selWeekdayLabel: S.WEEKDAYS_FULL[new Date(s.y, s.m, s.d).getDay()],
      selDateBig: S.MONTHS[s.m].slice(0, 3) + ' ' + s.d,
      selYearLabel: String(s.y),
      /* availability */
      spotsLeftLabel: av + ' of ' + q + ' left',
      availPctLabel: pct + '% booked',
      availChipStyle: chip,
      availFillStyle: fill,
      /* tickets / totals */
      ticketQty: qty,
      ticketPriceLabel: S.money(price),
      ticketTotalLabel: S.money(total),
      posSubLabel: S.money(posSub), posTaxLabel: S.money(posTax), posTotalLabel: S.money(posTotal),
      /* conditional states */
      hasBooked: !!lb, bookingOpen: !lb, selSoldout: soldout, selAvailable: !soldout,
      lastRef: lb ? lb.ref : '', lastTickets: lb ? lb.tickets : '',
      /* track reflection */
      trackRef: track.ref, trackDate: track.date, trackTickets: track.tickets,
      trackVenue: track.venue, trackGates: track.gates
    };
  }

  global.Booking = {
    incTicket: incTicket, decTicket: decTicket, bookTickets: bookTickets, clearBooking: clearBooking,
    values: values
  };
})(window);
