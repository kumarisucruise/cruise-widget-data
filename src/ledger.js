// 台帳は手で消さない。消えた日程も missing_since を入れて残す（NG-22 の比較元）
function mergeRun(prev, run, today, ship, display) {
  const led = prev ? JSON.parse(JSON.stringify(prev)) : { ship, initialized: today, updated: today, cruises: {} };
  led.updated = today;
  led.lastFailed = run.failed || []; // 公開フィードの「全社 null」判定から除くため
  const failed = new Set(run.failed || []);
  const agents = ['official'].concat(display);
  const seen = new Set();

  for (const c of run.cruises) {
    seen.add(c.depart);
    const old = led.cruises[c.depart];
    const entry = old || { depart: c.depart, first_seen: today, soldout_at: null, missing_since: null, marks: {} };
    entry.days = c.days;
    entry.port = c.port;
    entry.course = c.course;
    entry.missing_since = null;
    const marks = {};
    for (const a of agents) {
      const byDate = (run.marks || {})[a] || {};
      const m = byDate[c.depart];
      marks[a] = failed.has(a) ? null : (m === undefined ? null : m);
    }
    entry.marks = marks;
    const urls = {};
    for (const a of Object.keys(run.urls || {})) {
      if (run.urls[a][c.depart]) urls[a] = run.urls[a][c.depart];
    }
    entry.urls = urls;
    if (!entry.soldout_at) {
      const judged = display.map((a) => marks[a]).filter((m) => m !== null && m !== 'ans');
      if (judged.length > 0 && judged.every((m) => m === 'ng')) entry.soldout_at = today;
    }
    led.cruises[c.depart] = entry;
  }
  for (const d of Object.keys(led.cruises)) {
    if (!seen.has(d) && !led.cruises[d].missing_since) led.cruises[d].missing_since = today;
  }
  return led;
}

// 先週あった未来の日程が、売り切れでもないのに消えていたら返す
// 公式は締切（出発の約20日前）で一覧から外すため、today+cutoffDays より先の日程だけを点検対象にする
function addDays(iso, n) {
  return new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
}

function checkVanished(prev, run, today, allowRemove, cutoffDays) {
  if (!prev) return [];
  const limit = addDays(today, cutoffDays || 0);
  const now = new Set(run.cruises.map((c) => c.depart));
  return Object.values(prev.cruises)
    .filter((c) => c.depart > limit)
    .filter((c) => !c.soldout_at)
    .filter((c) => !c.missing_since)
    .filter((c) => !now.has(c.depart))
    .filter((c) => !allowRemove.includes(c.depart))
    .map((c) => c.depart)
    .sort();
}

function checkDrop(prevCount, nowCount) {
  return prevCount > 0 ? nowCount < prevCount / 2 : false;
}

module.exports = { mergeRun, checkVanished, checkDrop, addDays };
