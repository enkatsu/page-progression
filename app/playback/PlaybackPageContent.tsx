"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChordProgression } from "../_contexts/ChordProgressionContext";
import paper from "paper/dist/paper-core";
import { Blob } from "../_lib/Blob";
import { ChordPlayer } from "../_lib/ChordPlayer";
import { setupPaperCanvas, cleanupPaperCanvas } from "../_lib/paperUtils";
import Button from "../_components/Button";
import SocialShareButton from "../_components/SocialShareButton";
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

  const handleShare = async () => {
    // コード進行をカンマ区切りでエンコード
    const chordsParam = chordSequence.join(",");
    const shareUrl = `${window.location.origin}/playback?chords=${encodeURIComponent(chordsParam)}`;

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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm gap-4">
          <div className="flex flex-col items-center gap-4">
            <div className="text-white text-xl">＼ メロディをシェアする ／</div>
            <SocialShareButton onClick={handleShare} />
          </div>
          <Button onClick={handleRestart}>もう一度遊ぶ！</Button>
        </div>
      )}
    </main>
  );
}
