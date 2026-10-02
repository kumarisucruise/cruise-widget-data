const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { parseBest1List, parseBest1Detail } = require('../src/parse-best1');

const fx = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

test('ベストワン一覧：出発日と詳細パスの組', () => {
  const list = parseBest1List(fx('best1-list.html'), '/B/ASUKATH/');
  assert.ok(list.length >= 20, `件数 ${list.length}`);
  const row = list.find((r) => r.depart === '2026-11-04');
  assert.ok(row, '11/4 の行がある');
  assert.match(row.path, /^\/B\/ASUKATH\/.+\.html$/);
});

test('ベストワン詳細：客室ごとの状態の文言', () => {
  const { texts, fallback } = parseBest1Detail(fx('best1-detail.html'), '2026-11-04');
  assert.strictEqual(fallback, false);
  assert.ok(texts.length >= 5, `客室数 ${texts.length}`);
  texts.forEach((t) => assert.ok(t.length > 0));
});

test('ベストワン詳細：日付の表が見つからなければ先頭の表で代用し fallback:true', () => {
  const r = parseBest1Detail(fx('best1-detail.html'), '2030-01-01');
  assert.strictEqual(r.fallback, true);
  assert.ok(r.texts.length >= 5);
});
