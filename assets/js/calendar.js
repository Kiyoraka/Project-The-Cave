/* ============================================================================
   calendar.js — Gua Tempurung
   Shared month-grid + availability logic. Ported verbatim from the design.
   Renders into every [data-cal-grid] container (landing Book, admin POS/Setting);
   data-cal-size="lg|sm" picks the cell dimensions. All share one calendar state.
   ============================================================================ */
(function (global) {
  'use strict';
  var S = global.Store, App = global.App;

  function dkey(y, m, d) { return y + '-' + m + '-' + d; }
  function seedBooked(y, m, d) { if (d % 9 === 0) return 100; return (d * 13 + (m + 1) * 7 + 3) % 38; }
  function quota(y, m, d) { var o = S.state.quotaOverrides[dkey(y, m, d)]; return o != null ? o : S.state.quotaDefault; }
  function booked(y, m, d) { var b = S.state.bookedByDate[dkey(y, m, d)]; return b != null ? b : seedBooked(y, m, d); }
  function avail(y, m, d) { return Math.max(0, quota(y, m, d) - booked(y, m, d)); }

  function cellHtml(d, size) {
    var st = S.state, y = st.calYear, m = st.calMonth;
    var isSel = (st.selYear === y && st.selMonth === m && st.selDay === d);
    var q = quota(y, m, d), bk = booked(y, m, d), av = Math.max(0, q - bk);
    var soldout = av <= 0, limited = !soldout && av <= 8;
    var numC = isSel ? '#f4f1ea' : (soldout ? '#bcb4a4' : (limited ? '#c47a3f' : '#3a4636'));
    var base = 'display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;'
      + "font-family:'Spectral',serif;cursor:" + (soldout ? 'default' : 'pointer') + ';transition:all .15s;'
      + 'background:' + (isSel ? '#2f4a32' : 'transparent') + ';color:' + numC + ';'
      + 'font-weight:' + (isSel ? 600 : 400) + ';border:1px solid ' + (isSel ? '#2f4a32' : 'transparent') + ';'
      + 'text-decoration:' + (soldout ? 'line-through' : 'none') + ';';
    var sz = size === 'sm' ? 'gap:2px;height:40px;font-size:13.5px;' : 'gap:3px;height:46px;font-size:14.5px;';
    return '<button class="cal-cell" data-action="pickDate" data-arg="' + d + '" style="' + base + sz + '">' + d + '</button>';
  }

  /* Render the current month into every calendar grid on the page. */
  function render() {
    var st = S.state, y = st.calYear, m = st.calMonth;
    var dim = new Date(y, m + 1, 0).getDate();   /* days in month */
    var fw = new Date(y, m, 1).getDay();          /* first weekday */
    App.each(document, '[data-cal-grid]', function (grid) {
      var size = grid.getAttribute('data-cal-size') || 'lg';
      var html = '';
      for (var i = 0; i < fw; i++) html += '<span></span>';
      for (var d = 1; d <= dim; d++) html += cellHtml(d, size);
      grid.innerHTML = html;
    });
  }

  global.Calendar = {
    dkey: dkey, seedBooked: seedBooked, quota: quota, booked: booked, avail: avail, render: render
  };
})(window);
