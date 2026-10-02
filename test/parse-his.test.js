const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { parseHisSearch, parseHisDetail } = require('../src/parse-his');

const fx = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

test('HIS検索：総数と商品コード（2ページで総数と一致）', () => {
  const p1 = parseHisSearch(fx('his-search-p1.html'));
  const p2 = parseHisSearch(fx('his-search-p2.html'));
  assert.ok(p1.total > 0);
  assert.strictEqual(p1.codes.length + p2.codes.length, p1.total);
  p1.codes.forEach((c) => assert.match(c, /^ASUKA3-/));
});

test('HIS詳細：出発日とリクエスト受付（◇）', () => {
  const rows = parseHisDetail(fx('his-detail-req.html'));
  assert.strictEqual(rows.length, 1);
  assert.deepStrictEqual({ ...rows[0], icon: undefined }, { depart: '2026-11-04', mark: 'ans', unknown: false, icon: undefined });
  assert.match(rows[0].icon, /icon_rhombus-gray\.svg$/);
});

test('HIS詳細：アイコンなしで選択可能なセルは催行決定（○）', () => {
  const html = '<a class="c-calendar__week-col is-disabled" data-date="20261101"><p class="c-calendar__day">1</p><img src="" class="c-calendar__availability"></a>'
    + '<a class="c-calendar__week-col" data-date="20261102"><p class="c-calendar__day">2</p><img src="" class="c-calendar__availability"></a>';
  assert.deepStrictEqual(parseHisDetail(html), [{ depart: '2026-11-02', mark: 'ok', unknown: false, fallback: true }]);
});

test('HIS詳細：出発日のセルが無ければ空配列', () => {
  assert.deepStrictEqual(parseHisDetail('<html></html>'), []);
});

test('HIS詳細：data-date が8桁数字でないセルは無視する', () => {
  const html = '<a class="c-calendar__week-col" data-date=""><img src="" class="c-calendar__availability"></a>'
    + '<a class="c-calendar__week-col" data-date="abc"><img src="" class="c-calendar__availability"></a>'
    + '<a class="c-calendar__week-col" data-date="20261102"><img src="" class="c-calendar__availability"></a>';
  assert.deepStrictEqual(parseHisDetail(html).map((r) => r.depart), ['2026-11-02']);
});

test('HIS詳細：未知のアイコンは unknown とファイル名を返す', () => {
  const html = '<a class="c-calendar__week-col" data-date="20261102"><img src="/img/icon_star.svg" class="c-calendar__availability"></a>';
  const rows = parseHisDetail(html);
  assert.strictEqual(rows[0].unknown, true);
  assert.strictEqual(rows[0].icon, 'icon_star.svg');
});
