// 使い方: node scripts/update.js asuka3   （ALLOW_REMOVE=2026-11-08,2026-11-20 で消失を許可）
const fs = require('node:fs');
const path = require('node:path');
const { get } = require('../src/http');
const { textToMark, aggregate } = require('../src/marks');
const { parseOfficialList, parseOfficialDetail } = require('../src/parse-official');
const { parseHisSearch, parseHisDetail } = require('../src/parse-his');
const { parseBest1List, parseBest1Detail } = require('../src/parse-best1');
const { mergeRun, checkVanished, checkDrop, addDays } = require('../src/ledger');
const { buildFeed } = require('../src/build');
const { assertOverlap } = require('../src/checks');

const ROOT = path.join(__dirname, '..');
const ship = process.argv[2];
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'ships', `${ship}.json`), 'utf8'));
const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); // JST
const ledgerPath = path.join(ROOT, 'ledger', `${ship}.json`);
const feedPath = path.join(ROOT, 'docs', `${ship}.json`);
const lastRunPath = path.join(ROOT, 'ledger', 'last-run.json');
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

async function fetchOfficial(unknown) {
  const o = cfg.official;
  const list = parseOfficialList((await get(o.listUrl)).text);
  const cruises = [];
  const marks = {};
  for (const c of list) {
    const page = await get(`${o.base}/cruise/${c.id}/`);
    if (!page.url.includes(o.shipPath)) continue; // 別の船
    const cells = parseOfficialDetail(page.text).map((t) => {
      const r = textToMark(t);
      if (r.unknown) unknown.push(`official:${t}`);
      return r.mark;
    });
    cruises.push({ depart: c.depart, days: c.days, port: c.port, course: c.name });
    marks[c.depart] = aggregate(cells);
  }
  return { cruises, marks };
}

async function fetchHis(unknown) {
  const a = cfg.agents.his;
  const first = parseHisSearch((await get(a.searchUrl + '1')).text);
  let codes = first.codes;
  const pages = Math.ceil(first.total / 30);
  for (let p = 2; p <= pages; p++) codes = codes.concat(parseHisSearch((await get(a.searchUrl + p)).text).codes);
  codes = [...new Set(codes)];
  if (codes.length !== first.total) throw new Error(`HIS 商品数の不一致 ${codes.length}/${first.total}`);
  const marks = {};
  for (const code of codes) {
    for (const r of parseHisDetail((await get(a.detailUrl + code)).text)) {
      if (r.unknown) unknown.push(`his:${code}`);
      marks[r.depart] = aggregate([marks[r.depart], r.mark]);
    }
  }
  return { marks };
}

async function fetchBest1(unknown) {
  const a = cfg.agents.best1;
  const list = parseBest1List((await get(a.listUrl)).text, a.linkPrefix);
  const marks = {};
  const urls = {};
  for (const row of list) {
    const texts = parseBest1Detail((await get(a.base + row.path)).text, row.depart);
    const cells = texts.map((t) => {
      const r = textToMark(t, a.statusOverride);
      if (r.unknown) unknown.push(`best1:${t}`);
      return r.mark;
    });
    marks[row.depart] = aggregate(cells);
    urls[row.depart] = row.path;
  }
  return { marks, urls };
}

async function main() {
  const errors = [];
  const unknown = [];
  const failed = [];
  const run = { cruises: [], marks: {}, urls: {}, failed };

  // 公式はクルーズの正本。失敗したら公開しない
  try {
    const off = await fetchOfficial(unknown);
    run.cruises = off.cruises;
    run.marks.official = off.marks;
  } catch (e) {
    errors.push(`official: ${e.message}`);
  }
  // 社ごとの失敗は、その社の列だけ「－」にして続ける
  const fetchers = { his: fetchHis, best1: fetchBest1 };
  for (const id of cfg.display) {
    if (cfg.agents[id].enabled === false) continue;
    try {
      const r = await fetchers[id](unknown);
      assertOverlap(id, r.marks, run.cruises.filter((c) => c.depart > today).map((c) => c.depart));
      run.marks[id] = r.marks;
      if (r.urls) run.urls[id] = r.urls;
    } catch (e) {
      failed.push(id);
      errors.push(`${id}: ${e.message}`);
    }
  }

  const prev = readJson(ledgerPath);
  const allow = (process.env.ALLOW_REMOVE || '').split(',').filter(Boolean);
  let blocking = errors.some((e) => e.startsWith('official:'));
  if (!blocking) {
    const cutoff = cfg.official.listCutoffDays || 0;
    const limit = addDays(today, cutoff); // 締切で公式一覧から消える範囲は比較しない
    const vanished = checkVanished(prev, run, today, allow, cutoff);
    if (vanished.length) { blocking = true; errors.push(`消失: ${vanished.join(', ')}（意図的なら ALLOW_REMOVE）`); }
    const prevCount = prev ? Object.values(prev.cruises).filter((c) => c.depart > limit).filter((c) => !c.missing_since).length : 0;
    const nowCount = run.cruises.filter((c) => c.depart > limit).length;
    if (checkDrop(prevCount, nowCount)) { blocking = true; errors.push(`急減: ${prevCount} → ${nowCount}`); }
  }
  if (unknown.length) errors.push(`知らない文言・アイコン: ${[...new Set(unknown)].join(' / ')}`);

  if (!blocking) {
    const led = mergeRun(prev, run, today, ship, cfg.display);
    writeJson(ledgerPath, led);
    writeJson(feedPath, buildFeed(led, cfg, today));
  }
  // 毎週必ず書く（変化がなくても commit が発生し、60日停止を防ぐ）
  writeJson(lastRunPath, { date: today, ship, published: !blocking, failed, errors });
  console.log(JSON.stringify({ published: !blocking, cruises: run.cruises.length, failed, errors }, null, 2));
  process.exitCode = errors.length ? 1 : 0;
}

main().catch((e) => {
  writeJson(lastRunPath, { date: today, ship, published: false, errors: [`crash: ${e.stack}`] });
  console.error(e);
  process.exitCode = 1;
});
