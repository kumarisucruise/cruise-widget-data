// 記号の内部表現: ok=○ few=△ ng=✕ ans=◇ null=－（取扱なし・不明）
// 文言ルールは上から順に判定する（「キャンセル待ちリクエスト」を✕にするため ng が先）
const RULES = [
  { mark: 'ng', words: ['キャンセル待ち', '満室', '満席', '受付終了', '✕', '×'] },
  { mark: 'ans', words: ['リクエスト', '希望受付', '問い合わせ'] },
  { mark: 'few', words: ['残りわずか', '残席わずか', '残室わずか', '△'] },
  { mark: 'ok', words: ['予約', '空室あり', '空席あり', '○'] },
];

function textToMark(text, overrides) {
  const t = String(text || '').replace(/\s+/g, '');
  const ov = overrides || {};
  if (Object.prototype.hasOwnProperty.call(ov, t)) return { mark: ov[t], unknown: false };
  for (const rule of RULES) {
    if (rule.words.some((w) => t.includes(w))) return { mark: rule.mark, unknown: false };
  }
  return { mark: null, unknown: true };
}

const HIS_ICON = {
  'icon_circle': 'ok',
  'icon_rhombus-gray': 'ans',
  'icon_cross-gray': 'ng',
  'icon_dashed-circle': null, // 発売開始前＝取扱なし扱い
};

function hisIconToMark(src) {
  const m = /\/(icon_[a-z-]+)\.svg/.exec(src || '');
  if (!m || !Object.prototype.hasOwnProperty.call(HIS_ICON, m[1])) return { mark: null, unknown: true };
  return { mark: HIS_ICON[m[1]], unknown: false };
}

const PRIORITY = ['ok', 'few', 'ans', 'ng'];

function aggregate(marks) {
  const present = (marks || []).filter((m) => m);
  for (const p of PRIORITY) {
    if (present.includes(p)) return p;
  }
  return null;
}

module.exports = { textToMark, hisIconToMark, aggregate };
