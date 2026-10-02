const UA = 'Mozilla/5.0 (compatible; kumarisu-cruise-widget/1.0; +https://kumarisu-cruise.com/)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 相手に負荷をかけないよう、1件ごとに 800ms 待つ。失敗はそのまま投げる（社単位で拾う）
async function get(url) {
  await sleep(800);
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return { url: res.url, text: await res.text() };
}

module.exports = { get };
