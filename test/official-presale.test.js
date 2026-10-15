const test = require('node:test');
const assert = require('node:assert');
const { parseOfficialDetail, countOfficialPriceRows } = require('../src/parse-official');

test('公式詳細：発売前（価格表はあるが行が0件）は、行数0で空室表示も0件', () => {
  const html = '<html><body><table class="price-table"></table></body></html>';
  assert.strictEqual(countOfficialPriceRows(html), 0);
  assert.deepStrictEqual(parseOfficialDetail(html), []);
});

test('公式詳細：価格表に行があるのに空室の行が無いときは、行数が1以上（エラー扱いにする）', () => {
  const html = '<table class="price-table"><tr><td>客室</td><td>料金</td></tr></table>';
  assert.ok(countOfficialPriceRows(html) >= 1);
  assert.deepStrictEqual(parseOfficialDetail(html), []);
});

test('公式詳細：空室状況の行（tr-bold）があれば、文字を返す', () => {
  const html = '<table class="price-table"><tr class="tr-bold"><td>○</td><td>△</td><td>-</td></tr></table>';
  assert.deepStrictEqual(parseOfficialDetail(html), ['○', '△']);
});
