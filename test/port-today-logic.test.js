const test = require('node:test');
const assert = require('node:assert');
const L = require('../src/port-today-logic');

const jst = (s) => Date.parse(s + ':00+09:00');
const calls = [
  { arr: '2026-11-02T08:00', dep: '2026-11-02T17:00', ship: 'A' },
  { arr: '2026-11-03T22:00', dep: '2026-11-04T06:00', ship: 'B' },
  { arr: '2026-11-10T08:00', dep: null, ship: 'C' },
];

test('日付はJSTで切り替わる', () => {
  assert.strictEqual(L.jstDayKey(jst('2026-11-02T00:30')), '2026-11-02');
  assert.strictEqual(L.jstDayKey(Date.parse('2026-11-01T15:30:00Z')), '2026-11-02');
  assert.strictEqual(L.addDays('2026-12-31', 1), '2027-01-01');
});

test('その日に港にいる船：夜着・翌朝発は両日に出る', () => {
  assert.deepStrictEqual(L.callsOn(calls, '2026-11-03').map((c) => c.ship), ['B']);
  assert.deepStrictEqual(L.callsOn(calls, '2026-11-04').map((c) => c.ship), ['B']);
  assert.deepStrictEqual(L.callsOn(calls, '2026-11-05'), []);
});

test('状態：2時間前からまもなく入港・停泊中・出港済み', () => {
  const a = calls[0];
  assert.strictEqual(L.status(a, jst('2026-11-02T05:00')), 'before');
  assert.strictEqual(L.status(a, jst('2026-11-02T06:30')), 'soon');
  assert.strictEqual(L.status(a, jst('2026-11-02T12:00')), 'in_port');
  assert.strictEqual(L.status(a, jst('2026-11-02T17:01')), 'departed');
  assert.strictEqual(L.status(calls[2], jst('2026-11-10T23:00')), 'in_port'); // 出港時刻なしはその日いっぱい
});

test('次の入港：明後日以降で最初の船', () => {
  assert.strictEqual(L.nextCall(calls, jst('2026-11-05T10:00')).ship, 'C');
  assert.strictEqual(L.nextCall(calls, jst('2026-11-09T10:00')), null); // 明日(11/10)の船は対象外
});

test('取得日が8日以上前なら古い', () => {
  assert.strictEqual(L.isStale('2026-11-01', jst('2026-11-08T23:00')), false);
  assert.strictEqual(L.isStale('2026-11-01', jst('2026-11-09T00:00')), true);
});

test('期間内のイベントと予定', () => {
  const ev = [{ date: '2026-11-01' }, { date: '2026-11-15' }, { date: '2026-11-16' }];
  assert.deepStrictEqual(L.eventsWithin(ev, jst('2026-11-02T09:00'), 14).map((e) => e.date), ['2026-11-15']);
  assert.deepStrictEqual(L.callsWithin(calls, jst('2026-11-02T09:00'), 14).map((c) => c.ship), ['A', 'B', 'C']);
});
