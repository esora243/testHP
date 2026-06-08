import React, { useState, useRef, useEffect, useCallback } from 'react';

/* =========================================================================
 *  イケメン度診断アプリ - App.jsx
 *  - 写真はサーバーに送信せず、ブラウザのメモリ内（dataURL）で処理します。
 *  - 画像生成APIはプレースホルダー関数を用意してあります。
 * ========================================================================= */

// ---------------------------------------------------------------------------
// 1) 画像生成APIのプレースホルダー
//    実装時にはここを書き換えるだけで本物のAI画像生成APIを呼び出せます。
//    例：OpenAI DALL·E 3 / Stable Diffusion / Gemini Imagen など
// ---------------------------------------------------------------------------
async function generateIdealFaceImage(originalDataUrl) {
  // -------------------------------------------------------------------------
  //  ▼ 本番用サンプル（OpenAI DALL·E 3 のイメージ）
  //
  //  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  //  const res = await fetch('https://api.openai.com/v1/images/generations', {
  //    method: 'POST',
  //    headers: {
  //      'Content-Type': 'application/json',
  //      Authorization: `Bearer ${apiKey}`
  //    },
  //    body: JSON.stringify({
  //      model: 'dall-e-3',
  //      prompt: 'Photorealistic portrait of a handsome Japanese man, sharp jawline, symmetrical face, golden ratio, cinematic light, ultra-detailed',
  //      n: 1,
  //      size: '1024x1024'
  //    })
  //  });
  //  const json = await res.json();
  //  return json.data[0].url;
  // -------------------------------------------------------------------------

  // モック: 3秒待ってからダミーAfter画像を返す
  await new Promise((r) => setTimeout(r, 3000));

  // 完全にランダムなプレースホルダー画像 (picsum + 顔風)
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/ideal-face-${seed}/600/600`;
}

// ---------------------------------------------------------------------------
// 2) 診断ロジック（モック）
// ---------------------------------------------------------------------------
const FACE_TRAINING_POOL = [
  {
    point: 'フェイスラインのたるみ',
    menu: [
      '舌回し体操：口を閉じて舌で歯茎の外側を時計回りに20回、反時計回りに20回',
      'あご下プッシュ：拳をあご下に当て、舌を上あごに押し付け10秒×3セット',
      '「い」「う」発声：大袈裟な口の形で「いー」「うー」を交互に20回'
    ]
  },
  {
    point: '目元の力強さ不足',
    menu: [
      '眼輪筋トレ：人差し指を眉に置き、眉を動かさず目を大きく開ける×10回',
      'まばたきストレッチ：強く5秒目を閉じる→大きく開く×10回',
      '上まぶたリフト：眉骨を軽く押さえながら見開く動作×10回'
    ]
  },
  {
    point: '頬のもたつき',
    menu: [
      'ペットボトル頬筋トレ：空のペットボトルを口でくわえ持ち上げる×10秒',
      '頬骨スマイル：口角を耳に近づけるイメージで全力スマイル×10秒×3回',
      '「お」発声キープ：大袈裟に「おー」の形を10秒×5セット'
    ]
  },
  {
    point: '口角の下がり',
    menu: [
      '口角アップトレ：人差し指を口角に当て、上に押し上げながら笑顔キープ',
      '割り箸トレ：割り箸を横にくわえ、口角を割り箸より上にキープ×30秒',
      '「ウィスキー」発音：英語の "Whisky" を大袈裟に発音×20回'
    ]
  },
  {
    point: '左右非対称',
    menu: [
      '弱い側だけウィンク×20回',
      '左右交互に頬を膨らませる×各20回',
      '鏡を見ながら片側口角だけを引き上げる×各10回'
    ]
  }
];

const COSMETIC_POOL = [
  {
    area: '目元',
    treatment: '二重埋没法',
    detail: '幅広平行型を入れることで知的でクールな印象に。ダウンタイム短め。',
    risk: '腫れ：1〜2週間 / 費用目安：8〜15万円'
  },
  {
    area: '額・眉間',
    treatment: 'ボトックス注入',
    detail: '表情ジワを抑え、若々しくシャープな印象に。3〜6ヶ月持続。',
    risk: '効果持続：3〜6ヶ月 / 費用目安：3〜6万円'
  },
  {
    area: '頬・あご',
    treatment: 'ヒアルロン酸注入（あご形成）',
    detail: 'Eラインを整え横顔の印象を大幅に向上。即効性あり。',
    risk: '持続：6〜12ヶ月 / 費用目安：5〜12万円'
  },
  {
    area: '鼻',
    treatment: '鼻プロテーゼ / ヒアルロン酸隆鼻',
    detail: '鼻筋を通すことで彫りの深い顔立ちに。整形級の印象変化。',
    risk: 'ダウンタイム：1〜2週間 / 費用目安：5〜40万円'
  },
  {
    area: 'フェイスライン',
    treatment: 'HIFU / 脂肪溶解注射',
    detail: 'たるみ・もたつきを引き締め、シャープなVラインに。',
    risk: '効果実感：2〜4週間後 / 費用目安：3〜10万円'
  },
  {
    area: '肌全体',
    treatment: 'ハイドラフェイシャル / ポテンツァ',
    detail: '毛穴・くすみを改善し、肌のトーンが2段階アップ。清潔感UP。',
    risk: 'ダウンタイム：ほぼなし / 費用目安：2〜8万円'
  }
];

const RANK_TABLE = [
  { min: 90, label: 'S', title: '国宝級イケメン', color: 'from-yellow-300 via-amber-400 to-orange-500' },
  { min: 80, label: 'A', title: '正統派モテ顔',   color: 'from-pink-400 via-fuchsia-500 to-purple-600' },
  { min: 70, label: 'B', title: '雰囲気イケメン',   color: 'from-sky-400 via-blue-500 to-indigo-600' },
  { min: 60, label: 'C', title: '伸びしろMAX',     color: 'from-emerald-400 via-teal-500 to-cyan-600' },
  { min: 0,  label: 'D', title: '磨けば光る原石',   color: 'from-slate-400 via-slate-500 to-slate-700' }
];

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateDiagnosis() {
  // 60〜98のスコアをランダム生成（極端に低い点は出さない設計）
  const score = Math.floor(Math.random() * 39) + 60;
  const rank = RANK_TABLE.find((r) => score >= r.min);

  const goldenRatio = (Math.random() * 0.15 + 0.85).toFixed(3); // 0.85〜1.00
  const symmetry   = (Math.random() * 0.20 + 0.80).toFixed(3);  // 0.80〜1.00
  const skinScore  = Math.floor(Math.random() * 30) + 70;       // 70〜99

  const training = pickRandom(FACE_TRAINING_POOL, 2);
  const cosmetic = pickRandom(COSMETIC_POOL, 3);

  return { score, rank, goldenRatio, symmetry, skinScore, training, cosmetic };
}

// ---------------------------------------------------------------------------
// 3) 共通UIパーツ
// ---------------------------------------------------------------------------
function GradientButton({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full overflow-hidden rounded-2xl px-6 py-4 font-bold text-white shadow-lg shadow-purple-900/40 transition-all
        bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
        hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="relative z-10 tracking-wide">{children}</span>
      <span className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity bg-white" />
    </button>
  );
}

function GhostButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-6 py-3 font-medium border border-white/20 text-white/80
        hover:bg-white/5 active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 4) 画面 - トップ
// ---------------------------------------------------------------------------
function TopScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 text-center">
      <div className="w-full flex-1 flex flex-col items-center justify-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-indigo-500 blur-3xl opacity-40 rounded-full" />
          <div className="relative text-7xl">✨</div>
        </div>

        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-pink-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
          イケメン度診断<br />AI
        </h1>
        <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
          AIがあなたの顔の<span className="text-pink-300 font-semibold">黄金比</span>と
          <span className="text-indigo-300 font-semibold">パーツ配置</span>を解析し、<br />
          イケメン度を100点満点で診断します。
        </p>

        <ul className="mt-8 space-y-3 text-left text-sm text-white/80 bg-white/5 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
          <li className="flex items-start gap-2"><span>📷</span>カメラで顔を撮影するだけ</li>
          <li className="flex items-start gap-2"><span>💪</span>顔トレメニューを提案</li>
          <li className="flex items-start gap-2"><span>💉</span>美容医療シミュレーションも</li>
          <li className="flex items-start gap-2"><span>🔒</span>写真はサーバー送信しません</li>
        </ul>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <GradientButton onClick={onStart}>イケメン度診断を開始する</GradientButton>
        <p className="text-[10px] text-white/40">
          ※本アプリはエンタメ目的です。診断結果は医療・美容を保証するものではありません。
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5) 画面 - カメラ撮影
// ---------------------------------------------------------------------------
function CameraScreen({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState('user'); // 'user' | 'environment'

  const startCamera = useCallback(async (mode) => {
    setError(null);
    setReady(false);
    try {
      // 既存ストリーム停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (e) {
      console.error(e);
      setError(
        'カメラへのアクセスが許可されていません。ブラウザのカメラ権限を許可してください。'
      );
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // 正方形にトリミング
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // インカメ(user)時は鏡像表示しているので保存時に左右反転
    if (facing === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      size,
      size
    );
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // カメラ停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCapture(dataUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button onClick={onCancel} className="text-sm text-white/70 hover:text-white">← 戻る</button>
        <span className="text-sm font-semibold">顔を中央のフレームに合わせてください</span>
        <button
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          className="text-xl"
          aria-label="カメラ切替"
        >🔄</button>
      </div>

      {/* プレビュー */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center px-6">
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <GhostButton onClick={() => startCamera(facing)}>再試行</GhostButton>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* ガイド枠 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-80 sm:w-72 sm:h-96 rounded-[40%] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
                カメラを起動中...
              </div>
            )}
          </>
        )}
      </div>

      {/* シャッター */}
      <div className="px-6 py-6 bg-black flex items-center justify-center">
        <button
          onClick={handleCapture}
          disabled={!ready}
          className="relative w-20 h-20 rounded-full bg-white border-4 border-white/40 disabled:opacity-40 active:scale-95 transition-transform"
          aria-label="撮影"
        >
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-600" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6) 画面 - ローディング
// ---------------------------------------------------------------------------
function LoadingScreen({ photo }) {
  const messages = [
    '顔の黄金比を計測中...',
    'パーツの配置バランスを解析中...',
    '左右対称性をスコアリング中...',
    '肌のトーンと質感を評価中...',
    '理想の顔をAIが生成中...'
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 900);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <div className="relative w-48 h-48 mb-8">
        {/* 撮影写真 */}
        <img
          src={photo}
          alt="解析中"
          className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl shadow-purple-900/50"
        />
        {/* スキャンライン */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_20px_5px_rgba(244,114,182,0.7)] animate-[fade-in_2s_ease-in-out_infinite_alternate]"
            style={{ top: '50%', animation: 'scan 2.4s linear infinite' }}
          />
        </div>
        {/* パルス枠 */}
        <span className="absolute inset-0 rounded-3xl border-2 border-fuchsia-400/60 animate-pulse-ring" />
        <style>{`
          @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
        `}</style>
      </div>

      <h2 className="text-2xl font-black bg-gradient-to-r from-pink-300 to-indigo-300 bg-clip-text text-transparent">
        AIが解析中...
      </h2>
      <p className="mt-3 text-white/70 text-sm h-5">{messages[idx]}</p>

      <div className="mt-8 w-full max-w-xs h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full shimmer-bg animate-shimmer rounded-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7) 画面 - 診断結果
// ---------------------------------------------------------------------------
function ResultScreen({ photo, idealImage, diagnosis, onRetry }) {
  const { score, rank, goldenRatio, symmetry, skinScore, training, cosmetic } = diagnosis;

  const handleShare = async () => {
    const shareText = `【イケメン度診断】\n私のイケメン度は ${score}点 / ランク ${rank.label}「${rank.title}」でした！\nあなたも診断してみよう👇`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'イケメン度診断AI', text: shareText, url: shareUrl });
        return;
      } catch (_) { /* キャンセルなど */ }
    }
    // フォールバック: Xへ
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen px-5 py-6 pb-24 space-y-6 animate-fade-in">
      {/* ヘッダー */}
      <div className="text-center">
        <p className="text-xs text-white/60 tracking-widest">DIAGNOSIS RESULT</p>
        <h2 className="text-3xl font-black mt-1 bg-gradient-to-r from-pink-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
          あなたの診断結果
        </h2>
      </div>

      {/* スコアカード */}
      <div className={`relative rounded-3xl p-6 text-white overflow-hidden bg-gradient-to-br ${rank.color} shadow-xl`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs opacity-80 tracking-widest">IKEMEN SCORE</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-6xl font-black drop-shadow">{score}</span>
              <span className="text-lg font-bold opacity-90">/ 100</span>
            </div>
            <p className="mt-2 text-sm opacity-90">{rank.title}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur flex items-center justify-center border-2 border-white/50">
              <span className="text-4xl font-black">{rank.label}</span>
            </div>
            <p className="mt-1 text-[10px] tracking-widest opacity-80">RANK</p>
          </div>
        </div>

        {/* 細項目 */}
        <div className="grid grid-cols-3 gap-3 mt-5 text-center relative">
          <Metric label="黄金比" value={goldenRatio} />
          <Metric label="対称性" value={symmetry} />
          <Metric label="肌スコア" value={`${skinScore}`} />
        </div>
      </div>

      {/* ビフォーアフター */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>🔮</span>Before / After
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <BAFrame label="Before" badgeColor="bg-slate-500" img={photo} />
          <BAFrame label="After"  badgeColor="bg-fuchsia-500" img={idealImage} highlight />
        </div>
        <p className="mt-3 text-[11px] text-white/50 leading-relaxed">
          ※「After」画像はAIが生成したイメージサンプルです。実在の医療効果を保証するものではありません。
        </p>
      </section>

      {/* 顔トレ */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-5">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>💪</span>おすすめの顔トレ
        </h3>
        <div className="space-y-4">
          {training.map((t, i) => (
            <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <p className="text-pink-300 font-semibold text-sm">改善ポイント：{t.point}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-white/85">
                {t.menu.map((m, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-fuchsia-400">▸</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 美容医療シミュレーション */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-5">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>💉</span>美容・整形シミュレーション
        </h3>
        <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
          理想に近づくためのエンタメ提案です。実施は専門医にご相談ください。
        </p>
        <div className="space-y-3">
          {cosmetic.map((c, i) => (
            <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {c.area}
                </span>
                <span className="text-xs text-white/50">{c.risk}</span>
              </div>
              <p className="mt-2 text-white font-semibold">{c.treatment}</p>
              <p className="mt-1 text-sm text-white/75 leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* シェア & 再診断 */}
      <div className="space-y-3 pt-2">
        <GradientButton onClick={handleShare}>
          🐦 結果をシェアする
        </GradientButton>
        <GhostButton onClick={onRetry}>もう一度診断する</GhostButton>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-black/25 rounded-xl py-2 backdrop-blur-sm">
      <p className="text-[10px] opacity-80 tracking-widest">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function BAFrame({ label, badgeColor, img, highlight }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden border ${highlight ? 'border-fuchsia-400/60 shadow-lg shadow-fuchsia-900/30' : 'border-white/10'}`}>
      <div className="aspect-square bg-black">
        {img ? (
          <img src={img} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
            生成中...
          </div>
        )}
      </div>
      <span className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${badgeColor}`}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8) ルートApp - 画面遷移ステート管理
// ---------------------------------------------------------------------------
export default function App() {
  // 'top' | 'camera' | 'loading' | 'result'
  const [stage, setStage] = useState('top');
  const [photo, setPhoto] = useState(null);          // 撮影写真 (dataURL)
  const [idealImage, setIdealImage] = useState(null); // AI生成 After画像
  const [diagnosis, setDiagnosis] = useState(null);

  const handleStart = () => setStage('camera');

  const handleCapture = async (dataUrl) => {
    setPhoto(dataUrl);
    setStage('loading');

    try {
      // 並行：診断ロジック計算（即時）と画像生成（モック3秒）
      const diag = generateDiagnosis();
      // ローディング演出のため最低限の遅延
      const minWait = new Promise((r) => setTimeout(r, 3500));
      const [ideal] = await Promise.all([generateIdealFaceImage(dataUrl), minWait]);

      setDiagnosis(diag);
      setIdealImage(ideal);
      setStage('result');
    } catch (e) {
      console.error('診断エラー:', e);
      // 失敗時もモックで結果表示
      setDiagnosis(generateDiagnosis());
      setIdealImage(`https://picsum.photos/seed/fallback-${Date.now()}/600/600`);
      setStage('result');
    }
  };

  const handleRetry = () => {
    setPhoto(null);
    setIdealImage(null);
    setDiagnosis(null);
    setStage('top');
  };

  return (
    <div
      className="min-h-screen text-white font-sans relative overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(168,85,247,0.25), transparent 60%),\
           radial-gradient(ellipse at bottom, rgba(236,72,153,0.20), transparent 60%),\
           #0b1020'
      }}
    >
      <div className="max-w-md mx-auto">
        {stage === 'top'     && <TopScreen onStart={handleStart} />}
        {stage === 'camera'  && <CameraScreen onCapture={handleCapture} onCancel={handleRetry} />}
        {stage === 'loading' && <LoadingScreen photo={photo} />}
        {stage === 'result'  && (
          <ResultScreen
            photo={photo}
            idealImage={idealImage}
            diagnosis={diagnosis}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
}
