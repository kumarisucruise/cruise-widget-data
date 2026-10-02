const test = require('node:test');
const assert = require('node:assert');
const { textToMark, hisIconToMark, aggregate } = require('../src/marks');

test('文言ルール：✕を◇より先に判定する', () => {
  assert.deepStrictEqual(textToMark('キャンセル待ちリクエスト'), { mark: 'ng', unknown: false });
  assert.deepStrictEqual(textToMark('リクエスト'), { mark: 'ans', unknown: false });
  assert.deepStrictEqual(textToMark('希望受付'), { mark: 'ans', unknown: false });
  assert.deepStrictEqual(textToMark('残りわずか'), { mark: 'few', unknown: false });
  assert.deepStrictEqual(textToMark('予約する'), { mark: 'ok', unknown: false });
});

test('公式の記号', () => {
  assert.strictEqual(textToMark('○').mark, 'ok');
  assert.strictEqual(textToMark('△').mark, 'few');
  assert.strictEqual(textToMark('✕').mark, 'ng');
});

test('知らない文言は null・unknown', () => {
  assert.deepStrictEqual(textToMark('要相談'), { mark: null, unknown: true });
});

test('船×会社の例外（statusOverride）が文言ルールより優先', () => {
  const ov = { 'キャンセル待ちリクエスト': 'ans' };
  assert.strictEqual(textToMark('キャンセル待ち リクエスト', ov).mark, 'ans');
});

test('HISのアイコン', () => {
  assert.strictEqual(hisIconToMark('/assets/images/tour-detail/icon_circle.svg').mark, 'ok');
  assert.strictEqual(hisIconToMark('/assets/images/tour-detail/icon_rhombus-gray.svg').mark, 'ans');
  assert.strictEqual(hisIconToMark('/assets/images/tour-detail/icon_cross-gray.svg').mark, 'ng');
  assert.deepStrictEqual(hisIconToMark('/assets/images/tour-detail/icon_dashed-circle.svg'), { mark: null, unknown: false });
  assert.deepStrictEqual(hisIconToMark('/x/icon_star.svg'), { mark: null, unknown: true });
});

test('クルーズ単位のまとめ（A1）：○→△→◇→✕', () => {
  assert.strictEqual(aggregate(['ng', 'few', 'ok']), 'ok');
  assert.strictEqual(aggregate(['ng', 'few', 'ans']), 'few');
  assert.strictEqual(aggregate(['ng', 'ans']), 'ans');
  assert.strictEqual(aggregate(['ng', 'ng']), 'ng');
  assert.strictEqual(aggregate([null, null]), null);
  assert.strictEqual(aggregate([]), null);
});
