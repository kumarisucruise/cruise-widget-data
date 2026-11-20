const UA = 'Mozilla/5.0 (compatible; kumarisu-cruise-widget/1.0; +https://kumarisu-cruise.com/)';
const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TIMEOUT_MS = 30000; // 1回の取得の待ち時間の上限（応答が来ないまま何分も止まるのを防ぐ）
const ATTEMPTS = 3; // 最大3回（最初の1回＋やり直し2回）
const BACKOFF_MS = [2000, 5000]; // やり直す前の待ち時間

// 一時的な失敗だけやり直す対象にする（通信エラー・打ち切り・サーバー側の5xx・混雑の429）。
// 404などは「本当にページが無い」ので、やり直さずにそのまま失敗として扱う
const isRetryableStatus = (s) => s === 429 || s >= 500;

// 相手に負荷をかけないよう、1件ごとに 800ms 待つ。失敗は最後まで試してから投げる（社単位で拾う）
// opts は試験用（sleep: 待ちの差し替え, timeoutMs, attempts）
async function get(url, opts = {}) {
  const sleep = opts.sleep || defaultSleep;
  const timeoutMs = opts.timeoutMs || TIMEOUT_MS;
  const attempts = opts.attempts || ATTEMPTS;
  await sleep(800);
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(BACKOFF_MS[Math.min(i - 1, BACKOFF_MS.length - 1)]);
    let retryable = true;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return { url: res.url, text: await res.text() };
      retryable = isRetryableStatus(res.status);
      lastErr = new Error(`HTTP ${res.status} ${url}`);
    } catch (e) {
      const why = e.name === 'TimeoutError' ? `${timeoutMs}ms 応答なし` : (e.cause && (e.cause.code || e.cause.message)) || e.message;
      lastErr = new Error(`${e.message}（${why}） ${url}`);
    }
    if (!retryable) throw lastErr;
  }
  lastErr.message += `［${attempts}回試して失敗］`;
  throw lastErr;
}

module.exports = { get };
