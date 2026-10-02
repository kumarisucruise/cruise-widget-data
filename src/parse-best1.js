const cheerio = require('cheerio');

// 一覧：カードごとに dd span[id=YYYYMMDD]（出発日）と a.btn_course（詳細）が同じ親にある
function parseBest1List(html, linkPrefix) {
  const $ = cheerio.load(html);
  const out = [];
  const seen = new Set();
  $(`a.btn_course[href^="${linkPrefix}"]`).each((_, a) => {
    const href = $(a).attr('href');
    const span = $(a).parent().find('span[id]')
      .filter((__, s) => /^\d{8}$/.test($(s).attr('id') || '')).first();
    const id = span.attr('id');
    if (!id || seen.has(href)) return;
    seen.add(href);
    out.push({ depart: `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`, path: href });
  });
  return out;
}

// 詳細：td#online<YYYYMMDD> の次の tr.open 内の料金表。見つからず先頭の表で代用したら fallback:true。各行の最初の td.cell-strong が状態
function parseBest1Detail(html, depart) {
  const $ = cheerio.load(html);
  const key = depart.replace(/-/g, '');
  let table = $(`td#online${key}`).closest('tr').next('tr').find('table.other_price_list').first();
  let fallback = false;
  if (table.length === 0) { table = $('table.other_price_list').first(); fallback = true; }
  const texts = table.find('tr').slice(1).map((_, tr) => (
    $(tr).find('td.cell-strong').first().text().replace(/\s+/g, '')
  )).get().filter((t) => t !== '');
  return { texts, fallback };
}

module.exports = { parseBest1List, parseBest1Detail };
