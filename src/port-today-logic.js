// 港ウィジェットの計算部分。widget/port-today-widget.html に埋め込まれる（scripts/build-port-widget.js）。
// 時刻はすべて日本時間。データの日時は 'YYYY-MM-DDTHH:MM'（JST・タイムゾーンなし）。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PortTodayLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var DAY = 86400000;
  var JST = 9 * 3600000;
  function toMs(s) { return Date.parse(s + ':00+09:00'); }
  function jstDayKey(ms) { return new Date(ms + JST).toISOString().slice(0, 10); }
  function addDays(key, n) {
    var d = new Date(key + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function endMs(c) { return c.dep ? toMs(c.dep) : toMs(c.arr.slice(0, 10) + 'T23:59'); }
  function callsOn(calls, key) {
    var s = toMs(key + 'T00:00'), e = s + DAY;
    return calls.filter(function (c) { return toMs(c.arr) < e && endMs(c) >= s; });
  }
  function status(c, now) {
    var a = toMs(c.arr);
    if (now < a - 2 * 3600000) return 'before';
    if (now < a) return 'soon';
    if (now <= endMs(c)) return 'in_port';
    return 'departed';
  }
  function nextCall(calls, now) {
    var from = toMs(addDays(jstDayKey(now), 2) + 'T00:00');
    for (var i = 0; i < calls.length; i++) if (toMs(calls[i].arr) >= from) return calls[i];
    return null;
  }
  function isStale(fetchedAt, now) { return now - toMs(fetchedAt + 'T00:00') >= 8 * DAY; }
  function eventsWithin(events, now, days) {
    var k = jstDayKey(now), last = addDays(k, days);
    return events.filter(function (e) { return e.date >= k && e.date < last; });
  }
  function callsWithin(calls, now, days) {
    var s = toMs(jstDayKey(now) + 'T00:00'), e = s + days * DAY;
    return calls.filter(function (c) { return toMs(c.arr) < e && endMs(c) >= s; });
  }
  return { toMs: toMs, jstDayKey: jstDayKey, addDays: addDays, callsOn: callsOn, status: status,
    nextCall: nextCall, isStale: isStale, eventsWithin: eventsWithin, callsWithin: callsWithin };
});
