const test = require('node:test');
const assert = require('node:assert');
const { buildFeed } = require('../src/build');
const cfg = require('../ships/asuka3.json');

const entry = (depart, extra) => Object.assign({
  depart, days: 4, port: '横浜', course: 'テスト', first_seen: '2026-10-08',
  soldout_at: null, missing_since: null,
  marks: { official: 'ok', his: 'ans', best1: 'ans', jtb: null },
  urls: { best1: '/B/ASUKATH/x.html' },
}, extra || {});

test('出発済み・売り切れ・消えた日程は出さない。日付順', () => {
  const led = { initialized: '2026-10-01', cruises: {
    '2026-12-01': entry('2026-12-01'),
    '2026-11-04': entry('2026-11-04'),
    '2026-10-10': entry('2026-10-10'),
    '2026-11-20': entry('2026-11-20', { soldout_at: '2026-10-08' }),
    '2026-11-25': entry('2026-11-25', { missing_since: '2026-10-08' }),
  } };
  const feed = buildFeed(led, cfg, '2026-10-15');
  assert.deepStrictEqual(feed.cruises.map((c) => c.depart), ['2026-11-04', '2026-12-01']);
  assert.strictEqual(feed.updated, '2026-10-15');
});

test('NEW：初回取得分には付けず、その後14日以内に見つかったものに付ける', () => {
  const led = { initialized: '2026-10-01', cruises: {
    '2026-11-04': entry('2026-11-04', { first_seen: '2026-10-01' }),
    '2026-12-01': entry('2026-12-01', { first_seen: '2026-10-08' }),
  } };
  const feed = buildFeed(led, cfg, '2026-10-15');
  assert.strictEqual(feed.cruises[0].new, false);
  assert.strictEqual(feed.cruises[1].new, true);
  assert.strictEqual(buildFeed(led, cfg, '2026-10-23').cruises[1].new, false, '15日後は外れる');
});

test('リンク：HISは一覧固定、ベストワンはA8経由の個別ページ、記号のない社はリンクなし', () => {
  const led = { initialized: '2026-10-01', cruises: { '2026-11-04': entry('2026-11-04') } };
  const c = buildFeed(led, cfg, '2026-10-15').cruises[0];
  assert.strictEqual(c.st.his, 'ans');
  assert.strictEqual(c.link.his, cfg.agents.his.linkUrl);
  assert.strictEqual(c.link.best1, cfg.agents.best1.affiliatePrefix + encodeURIComponent('https://www.best1cruise.com/B/ASUKATH/x.html'));
  assert.strictEqual(c.st.jtb, null);
  assert.strictEqual(c.link.jtb, null);
});

test('agents は表示順で label と asp を持つ', () => {
  const feed = buildFeed({ initialized: '2026-10-01', cruises: {} }, cfg, '2026-10-15');
  assert.deepStrictEqual(feed.agents.map((a) => a.id), ['his', 'best1', 'jtb']);
  assert.strictEqual(feed.agents[0].asp, 'afb');
  assert.strictEqual(feed.staleDays, 10);
});
