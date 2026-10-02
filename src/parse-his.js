const cheerio = require('cheerio');
const { hisIconToMark } = require('./marks');

function toIso(d) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function parseHisSearch(html) {
  const $ = cheerio.load(html);
  const total = Number($('#result-number').first().text().trim()) || 0;
  const codes = [];
  $('a[href*="detail?code="]').each((_, a) => {
    const m = /code=([A-Z0-9-]+)/.exec($(a).attr('href') || '');
    if (m && !codes.includes(m[1])) codes.push(m[1]);
  });
  return { total, codes };
}

// 全セルに img.c-calendar__availability があるが、src が入っているのは出発日のセルだけ
// （2026-10-03 のフィクスチャで35個中1個）。セルの class（status-confirm 等）は当てにならない。
// 催行決定はアイコンなし・選択可能（is-disabled でない）
function parseHisDetail(html) {
  const $ = cheerio.load(html);
  const cells = $('a.c-calendar__week-col[data-date]');
  const withIcon = cells.filter((_, a) => ($(a).find('img.c-calendar__availability').attr('src') || '').trim() !== '');
  if (withIcon.length > 0) {
    return withIcon.map((_, a) => {
      const r = hisIconToMark($(a).find('img.c-calendar__availability').attr('src'));
      return { depart: toIso($(a).attr('data-date')), mark: r.mark, unknown: r.unknown };
    }).get();
  }
  return cells.not('.is-disabled').map((_, a) => (
    { depart: toIso($(a).attr('data-date')), mark: 'ok', unknown: false }
  )).get();
}

module.exports = { parseHisSearch, parseHisDetail };
