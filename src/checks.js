// 社の取得結果が公式の未来日程と1件も重ならなければ、取得の沈黙失敗とみなして例外にする。
// officialDates が空（公式側の失敗）のときは判定しない（公式の失敗は別途ブロックされる）
function assertOverlap(id, marks, officialDates) {
  if (!officialDates || officialDates.length === 0) return;
  const set = new Set(officialDates);
  if (!Object.keys(marks || {}).some((d) => set.has(d))) {
    throw new Error(`${id}: 公式の日程と重なる日付が0件`);
  }
}

module.exports = { assertOverlap };
