# 卓球スコアボード (Table Tennis Scoreboard)

AndroidスマホのChromeブラウザ等でインストールし、PWA（Progressive Web App）として動作する卓球スコア表示・管理ウェブアプリケーションです。

## 主な機能

- **スコア管理**: タップで加点、個別減点（-1点）ボタン
- **サーブ権の自動移動**: 11点マッチルール対応（通常2点交代、10-10デュース時は1点交代）
- **初期サーブ選択**: 試合開始時の先攻プレイヤー切り替え
- **1点戻す（Undo）機能**: 押し間違い時の履歴リバート対応
- **セット取得判定モーダル**: 11点以上かつ2点差で自動モーダル表示
- **コートチェンジ**: セット終了時および手動でのコート・プレイヤー配置入れ替え
- **PWA対応**: スマホの「ホーム画面に追加」で全画面アプリとして起動可能

## 技術スタック

- **Framework**: Next.js (App Router, Static Export)
- **UI Framework**: React, Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Cloudflare Pages

## ローカル開発手順

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスして動作を確認します。
​
## ビルド手順
```bash
npm run build
```

out ディレクトリに静的ファイルが出力されます。
​
## Cloudflare Pages へのデプロイ設定
​Cloudflare Dashboard から GitHub リポジトリと連携する際の設定値：
​Framework preset: Next.js (Static HTML Export)
​Build command: npx @cloudflare/next-on-pages@1 または npm run build
​Build output directory: out
​Node.js Version (環境変数): NODE_VERSION = 20 (推奨)

---

## Cloudflare Pages 側の設定ポイント

GitHubにプッシュした後、Cloudflare Dashboardでの連携設定は以下のように指定します。

| 項目 | 設定値 |
| :--- | :--- |
| **Framework preset** | `Next.js (Static HTML Export)` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |

