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
  assert.deepStrictEqual(rows, [{ depart: '2026-11-04', mark: 'ans', unknown: false }]);
});

test('HIS詳細：アイコンなしで選択可能なセルは催行決定（○）', () => {
  const html = '<a class="c-calendar__week-col is-disabled" data-date="20261101"><p class="c-calendar__day">1</p><img src="" class="c-calendar__availability"></a>'
    + '<a class="c-calendar__week-col" data-date="20261102"><p class="c-calendar__day">2</p><img src="" class="c-calendar__availability"></a>';
  assert.deepStrictEqual(parseHisDetail(html), [{ depart: '2026-11-02', mark: 'ok', unknown: false }]);
});

test('HIS詳細：出発日のセルが無ければ空配列', () => {
  assert.deepStrictEqual(parseHisDetail('<html></html>'), []);
});
