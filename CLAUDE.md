# Chord Progression Next - プロジェクト構成

## 概要
インタラクティブなBlobをタップしてコード進行を生成する音楽Webアプリケーション。
Next.js 16 + Paper.js + TypeScriptで構築されたSSG（静的サイト生成）プロジェクト。

## 技術スタック
- **フレームワーク**: Next.js 16.0.7 (App Router)
- **言語**: TypeScript 5
- **UI**: React 19.2.0
- **スタイリング**: Tailwind CSS 4
- **グラフィックス**: Paper.js 0.12.18
- **フォント**: Google Fonts (Inter)
- **ビルド**: Webpack (paper.js互換のため)

## プロジェクト構造

```
app/
├── _components/        # Reactコンポーネント
│   ├── Button.tsx     # 共通ボタンコンポーネント
│   └── SocialShareButton.tsx
│
├── _lib/              # ロジック・クラス
│   └── Blob.ts        # Blobクラス（物理演算・アニメーション）
│
├── _data/             # コード進行データ（JSON）
│   ├── jazz.json      # ジャズスタイル
│   ├── blues.json     # ブルーススタイル
│   ├── bossanova.json # ボサノバスタイル
│   ├── classic.json   # クラシックスタイル
│   ├── gospel.json    # ゴスペルスタイル
│   └── modal.json     # モーダルスタイル
│
├── start/             # スタート画面
│   └── page.tsx
│
├── play/              # メイン演奏画面（Blob表示）
│   └── page.tsx
│
├── playback/          # 再生画面
│   └── page.tsx
│
├── complete/          # 完了画面
│   └── page.tsx
│
├── layout.tsx         # ルートレイアウト
├── page.tsx           # ホーム画面
└── globals.css        # グローバルスタイル
```

## 主要機能

### 1. Blobシステム (`app/_lib/Blob.ts`)
- **物理演算**: 衝突判定、壁との反発、慣性
- **アニメーション**: サイン波を使ったふよふよした動き
- **インタラクション**: タップイベント、マウスオーバー効果
- **プロパティ**:
  - 位置 (x, y)
  - 速度 (velocityX, velocityY)
  - 半径 (baseRadius)
  - 色 (color)
  - Paper.jsパス (path)

### 2. コード進行データ構造
各JSONファイルは以下の構造を持つ:
```json
{
  "name": "スタイル名",
  "description": "説明",
  "nodes": [
    { "id": "コード名" }
  ],
  "links": [
    {
      "source": "遷移元コード",
      "target": "遷移先コード",
      "weight": 0.0-1.0
    }
  ]
}
```

### 3. 画面遷移フロー
```
/ (ホーム)
  ↓
/start (スタート画面)
  ↓
/play (演奏画面 - Blob表示)
  ↓ (3回タップ後)
/playback (再生画面)
  ↓
/complete (完了画面)
  ↓ (もう一度)
/start
```

## 設定ファイル

### `next.config.ts`
```typescript
{
  output: 'export',  // SSG設定
  webpack: (config, { isServer }) => {
    // paper.jsをサーバーサイドで無効化
    if (isServer) {
      config.resolve.alias['paper'] = false;
    }
    return config;
  },
  turbopack: {}  // Turbopack互換性
}
```

### `package.json` - 重要なスクリプト
```json
{
  "dev": "next dev --webpack",
  "build": "next build --webpack",
  "start": "next start"
}
```
**注意**: paper.jsの互換性のため、`--webpack`フラグが必須

## スタイリング

### カラーパレット
- 背景: `hsla(0, 0%, 14%, 1)` (ダークグレー)
- テキスト: `hsla(0, 0%, 100%, 1)` (白)
- Blob配色:
  - `#FD6F00` (オレンジ)
  - `#FF2C62` (マゼンタ)
  - `#6842FF` (パープル)
  - `#00D9FF` (シアン)
  - `#FFD700` (ゴールド)

### タイポグラフィ
- フォント: Inter (Google Fonts)
- ウェイト:
  - Semibold (600): 一般テキスト
  - Extrabold (800): ボタン
- サイズ: 24px (text-2xl)

## 開発ガイドライン

### ディレクトリ命名規則
- `_components/`: UIコンポーネント
- `_lib/`: ビジネスロジック、クラス
- `_utils/`: ユーティリティ関数
- `_types/`: 型定義
- `_hooks/`: カスタムReactフック
- `_data/`: 静的データ

### コーディング規約
1. 全てのページコンポーネントは`"use client"`ディレクティブを使用
2. Blobのインタラクションはpaper.jsのイベントシステムを使用
3. 物理演算の係数は調整可能に保つ
4. カラーコードは`_data/*.json`から取得

## ビルド・デプロイ

### 開発環境
```bash
npm run dev
# → http://localhost:3000
```

### 本番ビルド
```bash
npm run build
# → outディレクトリに静的ファイルが生成される
```

### デプロイ
- 静的ホスティングサービス（Vercel, Netlify, GitHub Pages等）にデプロイ可能
- `out`ディレクトリの内容をアップロード

## 既知の制約

1. **Paper.js**: Next.js 16のTurbopackと完全互換ではないため、webpackモードで実行
2. **SSG限定**: `output: 'export'`設定のため、サーバーサイド機能は使用不可
3. **ブラウザ依存**: Canvas APIとpaper.jsはブラウザ環境でのみ動作

## 今後の実装予定
- [ ] コード進行データとBlobの連携
- [ ] タップ時のコード選択ロジック
- [ ] 音声再生機能
- [ ] SNSシェア機能の実装
- [ ] アニメーション設定のカスタマイズ
