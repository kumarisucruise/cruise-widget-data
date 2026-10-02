const test = require('node:test');
const assert = require('node:assert');
const { assertOverlap } = require('../src/checks');

test('assertOverlap：公式の日程と1件でも重なれば通る', () => {
  assert.doesNotThrow(() => assertOverlap('his', { '2026-11-04': 'ok', '2027-01-01': 'ng' }, ['2026-11-04', '2026-12-01']));
});

test('assertOverlap：重なりが0件なら例外', () => {
  assert.throws(() => assertOverlap('his', { '2025-01-01': 'ok' }, ['2026-11-04']), /his: 公式の日程と重なる日付が0件/);
  assert.throws(() => assertOverlap('best1', {}, ['2026-11-04']), /best1: 公式の日程と重なる日付が0件/);
});

test('assertOverlap：公式側が空（公式の失敗）なら判定しない', () => {
  assert.doesNotThrow(() => assertOverlap('his', {}, []));
});
