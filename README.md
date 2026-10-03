# cruise-widget-data

飛鳥IIIの販売中クルーズと旅行会社別の空室記号を、週1回自動で更新して公開用JSONにするリポジトリ。

- 公開JSON: https://kumarisucruise.github.io/cruise-widget-data/asuka3.json
- 更新: GitHub Actions（毎週木曜 4:00 JST）
- ウィジェット本体: `widget/asuka-widget.html`（WordPressのカスタムHTMLブロックに全文を貼る。設置ページはURLから自動判定）

## 公開と判定日

| 項目 | 日付 |
|---|---|
| 公開日（WordPress 2記事に埋め込み） | 2026-10-03 |
| 判定日（公開日+28日） | 2026-10-31 |

- 埋め込み先: `/asuka-status/`（現在地セクション末尾）、`/asuka3-price/`（H2「裏ワザ3選」の直前）
- 判定の基準と結果の扱いは、非公開の作業ノート側（施策前カード）に記録している
- 10/03 のテストクリック（GA4: `cruise_widget_agent_click` 3件、既存CTA 1件）は判定から除外する
