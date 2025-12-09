"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChordProgression } from "../_contexts/ChordProgressionContext";
import paper from "paper";
import { Blob } from "../_lib/Blob";
import { ChordPlayer } from "../_lib/ChordPlayer";
import { setupPaperCanvas, cleanupPaperCanvas } from "../_lib/paperUtils";
import Button from "../_components/Button";
import { COLORS, PLAYBACK_CONFIG } from "../_constants/theme";

export default function PlaybackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { chordSequence, resetChords, addChord } = useChordProgression();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(true);
  const hasLoadedFromUrl = useRef(false);
  const chordPlayerRef = useRef<ChordPlayer | null>(null);

  // URLパラメータからコード進行を読み込む（一度だけ）
  useEffect(() => {
    if (hasLoadedFromUrl.current) return;

    const chordsParam = searchParams.get("chords");

    if (chordsParam) {
      const chords = chordsParam.split(",").filter(c => c.trim() !== "");

      if (chords.length > 0) {
        hasLoadedFromUrl.current = true;
        resetChords();
        chords.forEach(chord => addChord(chord));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // URLパラメータがある場合は読み込み完了を待つ
    const chordsParam = searchParams.get("chords");
    if (chordsParam) {
      // URLパラメータがある場合、chordSequenceが更新されるまで待つ
      if (chordSequence.length === 0) {
        return;
      }
    } else {
      // URLパラメータがない場合、コード進行が空ならstart画面に遷移
      if (chordSequence.length === 0) {
        router.push("/start");
        return;
      }
    }

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Paper.jsのセットアップ（visualViewport使用）
    const { width, height } = setupPaperCanvas(canvas, true);

    // ChordPlayerを作成（初回のみ）
    if (!chordPlayerRef.current) {
      chordPlayerRef.current = new ChordPlayer();
    }
    const chordPlayer = chordPlayerRef.current;

    // 各コードのBlobを作成
    const blobs: Blob[] = [];
    let completionTimer: NodeJS.Timeout | null = null;

    chordSequence.forEach((chord, index) => {
      const x = width / 2; // 画面中央
      const y = PLAYBACK_CONFIG.startY; // 全て同じ位置からスタート

      // 最後のBlobかどうか
      const isLastBlob = index === chordSequence.length - 1;

      const blob = new Blob({
        x,
        y,
        radius: PLAYBACK_CONFIG.blobRadius,
        color: COLORS[index % COLORS.length],
        canvasWidth: width,
        canvasHeight: height,
        label: chord,
        onTap: () => {}, // タップイベントなし
        gravity: 0, // 初期は重力なし（後で設定）
        onBottomCollision: () => {
          chordPlayer.playChord(chord).catch(err => {
            console.error("Error playing chord:", err);
          });
          // 最後のBlobの場合は500ms後にisCompleteをtrueにする
          if (isLastBlob) {
            completionTimer = setTimeout(() => {
              setIsComplete(true);
            }, PLAYBACK_CONFIG.completionDelay);
          }
        },
      });

      // 初期状態では重力を0に設定（落下開始まで待機）
      blob.gravity = 0;

      blobs.push(blob);
    });

    blobsRef.current = blobs;

    // スタートプロンプトが表示されている場合は落下を開始しない
    const timers: NodeJS.Timeout[] = [];
    if (!showStartPrompt) {
      // 500ms間隔でBlobを順番に落下させる
      chordSequence.forEach((_, index) => {
        const timer = setTimeout(() => {
          if (blobs[index]) {
            blobs[index].gravity = PLAYBACK_CONFIG.gravity; // 重力を設定して落下開始
          }
        }, index * PLAYBACK_CONFIG.dropInterval);
        timers.push(timer);
      });
    }

    // アニメーションループ
    paper.view.onFrame = () => {
      blobs.forEach((blob) => {
        blob.update();
      });
    };

    // iPhoneでのリサイズ対応（アドレスバー表示/非表示など）
    const handleResize = () => {
      const vw = window.visualViewport?.width || window.innerWidth;
      const vh = window.visualViewport?.height || window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
        if (paper.view) {
          paper.view.viewSize.width = vw;
          paper.view.viewSize.height = vh;
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      // リサイズイベントのクリーンアップ
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      // タイマーをクリア
      timers.forEach((timer) => clearTimeout(timer));
      if (completionTimer) {
        clearTimeout(completionTimer);
      }
      // Blobを削除
      blobs.forEach((blob) => blob.remove());
      cleanupPaperCanvas();
      // ChordPlayerは破棄しない（再利用する）
    };
  }, [chordSequence, router, searchParams, showStartPrompt]);

  // コンポーネントのアンマウント時のみChordPlayerを破棄
  useEffect(() => {
    return () => {
      if (chordPlayerRef.current) {
        chordPlayerRef.current.dispose();
        chordPlayerRef.current = null;
      }
    };
  }, []);

  const handleStart = async () => {
    // Tone.jsのAudioContextを開始
    const Tone = await import("tone");
    await Tone.start();
    setShowStartPrompt(false);
  };

  const handleRestart = () => {
    router.push("/start");
  };

  const getShareUrl = () => {
    const chordsParam = chordSequence.join(",");
    // 現在のページのURL（クエリパラメータを除く）を使用
    const url = new URL(window.location.href);
    url.search = `?chords=${encodeURIComponent(chordsParam)}`;
    return url.toString();
  };

  const handleReplay = () => {
    // シェア用URLを開く（現在のコード進行を再生）
    const shareUrl = getShareUrl();
    window.location.href = shareUrl;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();

    try {
      // Web Share APIが使える場合
      if (navigator.share) {
        await navigator.share({
          title: "コード進行",
          text: `コード進行: ${chordSequence.join(" - ")}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // フォールバック: クリップボードにコピー
        await navigator.clipboard.writeText(shareUrl);
        alert("URLをクリップボードにコピーしました！");
      } else {
        // クリップボードAPIが使えない場合はURLを表示
        alert(`このURLをコピーしてシェアしてください:\n${shareUrl}`);
      }
    } catch (err) {
      console.error("Share error:", err);
      // エラー時もURLを表示
      alert(`このURLをコピーしてシェアしてください:\n${shareUrl}`);
    }
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-black relative">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />

      {showStartPrompt && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-4 z-50">
          <div className="text-white text-2xl font-bold mb-4">タップして開始</div>
          <Button onClick={handleStart}>再生する</Button>
        </div>
      )}

      {isComplete && (
        <div className="absolute inset-0 flex items-end justify-center pb-28 px-4">
          <div className="bg-gray-100 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            {/* 上部の2つのボタン */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* サウンドをもう一度聞くボタン */}
              <button
                onClick={handleReplay}
                className="bg-white flex flex-col items-center justify-center gap-2 rounded-2xl p-6 transition-colors"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="24" fill="#6842FF"/>
                  <g clipPath="url(#clip0_30_670)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.0152 17.9668C20.0992 17.1505 20.819 16.6629 21.4611 16.986C22.2125 17.3641 23.8986 18.263 26.0379 19.7161C28.1777 21.1695 29.6826 22.4381 30.3363 23.0145C30.8948 23.5068 30.8964 24.4836 30.3374 24.9774C29.6896 25.5496 28.2029 26.8031 26.0371 28.2741C23.8706 29.7457 22.2041 30.6339 21.4594 31.0076C20.8171 31.3297 20.0993 30.8412 20.0154 30.0266C19.9174 29.0751 19.7352 26.9144 19.7352 23.9959C19.7352 21.0791 19.9172 18.9192 20.0152 17.9668Z" fill="white"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_30_670">
                      <rect width="17" height="20" fill="white" transform="translate(16 14)"/>
                    </clipPath>
                  </defs>
                </svg>
                <span className="text-sm font-semibold text-gray-900 text-center leading-tight">
                  サウンドを<br />もう一度聞く
                </span>
              </button>

              {/* もう一度プレイするボタン */}
              <button
                onClick={handleRestart}
                className="bg-white flex flex-col items-center justify-center gap-2 rounded-2xl p-6 transition-colors"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="24" fill="#FF2C62"/>
                  <path d="M24 17V14.2071C24 13.7617 23.4614 13.5386 23.1464 13.8536L19.3536 17.6464C19.1583 17.8417 19.1583 18.1583 19.3536 18.3536L23.1464 22.1464C23.4614 22.4614 24 22.2383 24 21.7929V19C27.31 19 30 21.69 30 25C30 28.31 27.31 31 24 31C21.0292 31 18.5578 28.833 18.0825 25.9958C17.9913 25.4511 17.5523 25 17 25C16.4477 25 15.9934 25.45 16.0616 25.998C16.5524 29.9466 19.918 33 24 33C28.42 33 32 29.42 32 25C32 20.58 28.42 17 24 17Z" fill="white"/>
                </svg>
                <span className="text-sm font-semibold text-gray-900 text-center leading-tight">
                  もう一度<br />プレイする
                </span>
              </button>
            </div>

            {/* シェアボタン */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4  transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill="#FD6F00"/>
                <path d="M19 15.5V18H9.00004V15.5H7.33337V18C7.33337 18.9166 8.08337 19.6666 9.00004 19.6666H19C19.9167 19.6666 20.6667 18.9166 20.6667 18V15.5H19ZM9.83337 10.5L11.0084 11.675L13.1667 9.52498V16.3333H14.8334V9.52498L16.9917 11.675L18.1667 10.5L14 6.33331L9.83337 10.5Z" fill="white"/>
              </svg>
              <span className="text-black font-extrabold text-lg">
                サウンドをシェアする
              </span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
