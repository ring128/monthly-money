# 月ごとメモ Web

月ごとに「何のジャンルにいくら使った/得たか」を見るための、広告なしWeb/PWAです。

- TypeScript中心の静的Webアプリ
- Reactなし、バックエンドなし
- GitHub Pagesで公開しやすい構成
- データはブラウザの `localStorage` に保存
- JSONバックアップ/復元に対応
- PWAとしてホーム画面に追加可能

## 機能

- タイトル、金額、支出/収入、ジャンルで記録
- 日付と月は自動保存
- 初期ジャンルなし。支出/収入ごとに自分で追加
- 今月の支出、収入、差額
- 支出/収入ごとのジャンル別集計
- ジャンルを押すと入力内容を表示
- 過去の月別差額、年別合計
- 年間ジャンル割合の円グラフ
- JSONエクスポート/インポート

## 開発

```powershell
npm install
npm run dev
```

## ビルド

```powershell
npm run build
```

## GitHub Pages

このフォルダをGitHubリポジトリのルートに置いて、`main` にpushします。

その後、GitHubの `Settings > Pages` で `GitHub Actions` を選ぶと、`.github/workflows/deploy.yml` で公開できます。
