const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { parseOfficialList, parseOfficialDetail } = require('../src/parse-official');

const fx = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

test('公式一覧：八戸・仙台クルーズの行が取れる', () => {
  const list = parseOfficialList(fx('official-list.html'));
  const row = list.find((c) => c.id === '99953');
  assert.ok(row, '99953 が一覧にある');
  assert.strictEqual(row.depart, '2026-11-04');
  assert.strictEqual(row.days, 5);
  assert.strictEqual(row.port, '横浜');
  assert.match(row.name, /八戸・仙台クルーズ/);
  assert.ok(list.length >= 30, `一覧が30件以上（実際 ${list.length}）`);
  assert.strictEqual(new Set(list.map((c) => c.id)).size, list.length, 'id が重複しない');
});

test('公式詳細：空室状況の行（15客室）を文字で返す', () => {
  const cells = parseOfficialDetail(fx('official-detail-99953.html'));
  assert.ok(cells.length >= 10, `客室数 ${cells.length}`);
  cells.forEach((c) => assert.ok(['○', '△', '✕', '希望受付'].includes(c), `想定外の文字: ${c}`));
});
