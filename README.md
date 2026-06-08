# イケメン度診断 AI

カメラで撮影した顔写真をもとに、AIが「イケメン度スコア」「顔トレメニュー」「美容医療シミュレーション」「ビフォーアフター画像」を表示するエンタメWebアプリです。

## 特徴
- 📷 **カメラ撮影**: `navigator.mediaDevices.getUserMedia` を使用しブラウザ内で完結
- 🔒 **セキュア**: 写真はサーバーへ送信せず、ブラウザのメモリ内（dataURL）のみで処理
- 📱 **モバイルファースト**: Tailwind CSSによるモダンで洗練されたUI
- 🤖 **AI画像生成プレースホルダー**: `generateIdealFaceImage()` を差し替えるだけでDALL·E 3等を統合可能
- 🐦 **SNSシェア対応**: Web Share API ＋ Xシェアフォールバック

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。  
**注意**: カメラ機能は HTTPS または localhost でのみ動作します。スマホ実機で確認する場合は `npm run dev -- --host` のうえ、 HTTPS トンネル（ngrok等）を利用してください。

## ビルド

```bash
npm run build
npm run preview
```

## AI画像生成APIへの差し替え

`src/App.jsx` の `generateIdealFaceImage()` 関数を編集してください。  
コメントアウト済みのDALL·E 3呼び出しサンプルがあります。`VITE_OPENAI_API_KEY` を `.env` に設定すれば動作します。

```
VITE_OPENAI_API_KEY=sk-xxxxx
```

## ファイル構成

```
ikemen-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx        ← メインロジック（全画面・診断・カメラ処理）
    └── index.css
```

## 注意事項
本アプリはエンタメ目的です。診断結果や美容医療シミュレーションは医学的根拠に基づくものではありません。実施を検討される場合は必ず専門医にご相談ください。
