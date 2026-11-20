const test = require('node:test');
const assert = require('node:assert');
const { get } = require('../src/http');

const fast = { sleep: () => Promise.resolve() };
const ok = (text) => ({ ok: true, status: 200, url: 'http://x/', text: async () => text });
const status = (s) => ({ ok: false, status: s, url: 'http://x/', text: async () => '' });

async function withFetch(impl, fn) {
  const orig = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (...a) => impl(calls++, ...a);
  try {
    await fn(() => calls);
  } finally {
    globalThis.fetch = orig;
  }
}

test('通信エラーが1回出ても、やり直して成功する', async () => {
  await withFetch((n) => {
    if (n === 0) throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
    return ok('hello');
  }, async (calls) => {
    const r = await get('http://x/', fast);
    assert.strictEqual(r.text, 'hello');
    assert.strictEqual(calls(), 2);
  });
});

test('503は3回までやり直し、ずっと失敗なら回数つきで失敗する', async () => {
  await withFetch(() => status(503), async (calls) => {
    await assert.rejects(get('http://x/', fast), /HTTP 503.*3回試して失敗/);
    assert.strictEqual(calls(), 3);
  });
});

test('404はやり直さずすぐ失敗する', async () => {
  await withFetch(() => status(404), async (calls) => {
    await assert.rejects(get('http://x/', fast), /HTTP 404/);
    assert.strictEqual(calls(), 1);
  });
});

test('応答が来ないときは打ち切って、やり直す', async () => {
  await withFetch((n, url, init) => {
    if (n === 0) return new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(init.signal.reason)));
    return ok('late');
  }, async (calls) => {
    const r = await get('http://x/', { ...fast, timeoutMs: 20 });
    assert.strictEqual(r.text, 'late');
    assert.strictEqual(calls(), 2);
  });
});
