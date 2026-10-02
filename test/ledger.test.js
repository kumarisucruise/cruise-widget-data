const test = require('node:test');
const assert = require('node:assert');
const { mergeRun, checkVanished, checkDrop } = require('../src/ledger');

const DISPLAY = ['his', 'best1', 'jtb'];
const cruise = (depart) => ({ depart, days: 4, port: '横浜', course: `c${depart}` });

test('初回：first_seen と initialized が今日になる', () => {
  const run = { cruises: [cruise('2026-11-04')], marks: { official: { '2026-11-04': 'ok' }, his: { '2026-11-04': 'ok' } }, urls: {}, failed: [] };
  const led = mergeRun(null, run, '2026-10-08', 'asuka3', DISPLAY);
  assert.strictEqual(led.initialized, '2026-10-08');
  assert.strictEqual(led.cruises['2026-11-04'].first_seen, '2026-10-08');
  assert.strictEqual(led.cruises['2026-11-04'].marks.his, 'ok');
  assert.strictEqual(led.cruises['2026-11-04'].marks.best1, null);
});

test('2回目：first_seen は変えない・記号は更新', () => {
  const r1 = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ok' } }, urls: {}, failed: [] };
  const r2 = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ans' } }, urls: {}, failed: [] };
  const l1 = mergeRun(null, r1, '2026-10-08', 'asuka3', DISPLAY);
  const l2 = mergeRun(l1, r2, '2026-10-15', 'asuka3', DISPLAY);
  assert.strictEqual(l2.cruises['2026-11-04'].first_seen, '2026-10-08');
  assert.strictEqual(l2.cruises['2026-11-04'].marks.his, 'ans');
});

test('◇以外の社がすべて✕なら soldout_at（◇は数えない）', () => {
  const run = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ng' }, best1: { '2026-11-04': 'ans' } }, urls: {}, failed: [] };
  const led = mergeRun(null, run, '2026-10-08', 'asuka3', DISPLAY);
  assert.strictEqual(led.cruises['2026-11-04'].soldout_at, '2026-10-08');
});

test('◇だけなら売り切れにしない', () => {
  const run = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ans' }, best1: { '2026-11-04': 'ans' } }, urls: {}, failed: [] };
  const led = mergeRun(null, run, '2026-10-08', 'asuka3', DISPLAY);
  assert.strictEqual(led.cruises['2026-11-04'].soldout_at, null);
});

test('一度売り切れたら、空いても戻さない', () => {
  const r1 = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ng' } }, urls: {}, failed: [] };
  const r2 = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ok' } }, urls: {}, failed: [] };
  const l2 = mergeRun(mergeRun(null, r1, '2026-10-08', 'asuka3', DISPLAY), r2, '2026-10-15', 'asuka3', DISPLAY);
  assert.strictEqual(l2.cruises['2026-11-04'].soldout_at, '2026-10-08');
});

test('取得に失敗した社は null で、売り切れ判定に使わない', () => {
  const run = { cruises: [cruise('2026-11-04')], marks: { his: { '2026-11-04': 'ng' } }, urls: {}, failed: ['his'] };
  const led = mergeRun(null, run, '2026-10-08', 'asuka3', DISPLAY);
  assert.strictEqual(led.cruises['2026-11-04'].marks.his, null);
  assert.strictEqual(led.cruises['2026-11-04'].soldout_at, null);
});

test('消えた日程は台帳に残し missing_since を入れる', () => {
  const r1 = { cruises: [cruise('2026-11-04'), cruise('2026-11-08')], marks: {}, urls: {}, failed: [] };
  const r2 = { cruises: [cruise('2026-11-04')], marks: {}, urls: {}, failed: [] };
  const l2 = mergeRun(mergeRun(null, r1, '2026-10-08', 'asuka3', DISPLAY), r2, '2026-10-15', 'asuka3', DISPLAY);
  assert.strictEqual(l2.cruises['2026-11-08'].missing_since, '2026-10-15');
});

test('checkVanished：未来の・売り切れでない日程が消えたらエラー（ALLOW_REMOVE で許可）', () => {
  const r1 = { cruises: [cruise('2026-11-04'), cruise('2026-11-08')], marks: {}, urls: {}, failed: [] };
  const prev = mergeRun(null, r1, '2026-10-08', 'asuka3', DISPLAY);
  const run = { cruises: [cruise('2026-11-04')] };
  assert.deepStrictEqual(checkVanished(prev, run, '2026-10-15', []), ['2026-11-08']);
  assert.deepStrictEqual(checkVanished(prev, run, '2026-10-15', ['2026-11-08']), []);
  assert.deepStrictEqual(checkVanished(prev, run, '2026-11-10', []), [], '出発済みは対象外');
});

test('checkDrop：件数が前回の半分未満ならエラー', () => {
  assert.strictEqual(checkDrop(30, 14), true);
  assert.strictEqual(checkDrop(30, 15), false);
  assert.strictEqual(checkDrop(0, 0), false);
});
