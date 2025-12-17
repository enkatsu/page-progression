// 和音機能に関する設定の集約
export const CHORD_FUNCTION_CONFIG = {
  T: {
    color: '#FD6F00', // オレンジ - 安定した響き
    animationSpeed: 0.4, // 最遅 - 落ち着いた動き
  },
  SD: {
    color: '#FF2C62', // マゼンタ - やや不安定、前進感
    animationSpeed: 0.7, // 中間 - やや活発な動き
  },
  D: {
    color: '#6842FF', // パープル - 緊張感、解決を求める響き
    animationSpeed: 1.0, // 最速 - 活発な動き
  },
} as const;

// Blob設定
export const BLOB_CONFIG = {
  minRadius: 40,
  maxRadius: 100,
  spacing: 30, // Blob間の余白
  expandSpeed: 0.01,
  fadeSpeed: 0.01,
  maxPlacementAttempts: 50,
} as const;

// 再生画面の設定
export const PLAYBACK_CONFIG = {
  blobRadius: 60,
  dropInterval: 500, // ms
  completionDelay: 500, // ms
  gravity: 0.2,
  startY: -100, // 画面上の初期位置
} as const;

// マージンの計算（Blobが画面端に配置されないように）
export const BLOB_MARGIN = BLOB_CONFIG.maxRadius + 20;

// コード進行の設定
export const PROGRESSION_CONFIG = {
  maxChordCount: 7, // 最大コード数（この数に達するとTコードで終了）
} as const;
