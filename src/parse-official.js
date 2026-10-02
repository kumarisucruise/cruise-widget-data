const cheerio = require('cheerio');

// 一覧：飛鳥II も混ざる。船の判定は詳細ページの転送先（/asuka3/）で行う
function parseOfficialList(html) {
  const $ = cheerio.load(html);
  const out = [];
  const seen = new Set();
  $('div.cruiseBox').each((_, el) => {
    const box = $(el);
    const href = box.find('a.cruiseBox_link').attr('href') || '';
    const m = /\/cruise\/(\d+)\//.exec(href);
    if (!m || seen.has(m[1])) return;
    seen.add(m[1]);
    const days = /(\d+)日間/.exec(box.find('.period_c').text());
    out.push({
      id: m[1],
      depart: box.find('.d-date_c time').attr('datetime') || null,
      days: days ? Number(days[1]) : null,
      port: box.find('.place_c a.click-show-port').first().text().trim(),
      name: box.find('.c-name_c h3').text().replace(/\s+/g, ' ').trim(),
    });
  });
  return out;
}

// 詳細：price-table の「空室状況」行。'-'（販売なし）は除く
function parseOfficialDetail(html) {
  const $ = cheerio.load(html);
  const row = $('table.price-table tr.tr-bold').first();
  return row.find('td').map((_, td) => $(td).text().trim()).get()
    .filter((t) => t !== '' && t !== '-');
}

module.exports = { parseOfficialList, parseOfficialDetail };
