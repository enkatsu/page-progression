// カラーパレット
export const COLORS = ["#FD6F00", "#FF2C62", "#6842FF", "#00D9FF", "#FFD700"] as const;

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
