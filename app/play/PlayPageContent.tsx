"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import paper from "paper";
import { Blob } from "../_lib/Blob";
import { ChordProgressionManager } from "../_lib/ChordProgressionManager";
import { BlobPositioner } from "../_lib/BlobPositioner";
import { setupPaperCanvas, cleanupPaperCanvas } from "../_lib/paperUtils";
import { useChordProgression } from "../_contexts/ChordProgressionContext";
import jazzData from "../_data/jazz.json";
import { COLORS, BLOB_CONFIG, BLOB_MARGIN } from "../_constants/theme";
import { NextChordOption } from "../_types/ChordProgression";

// コード進行マネージャーをコンポーネント外で初期化
const initialChordManager = new ChordProgressionManager(jazzData);
const initialChord = initialChordManager.getCurrentChord();

export default function PlayPageContent() {
  const router = useRouter();
  const { addChord, resetChords } = useChordProgression();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tapCount, setTapCount] = useState(0);
  const [currentChord, setCurrentChord] = useState<string>(initialChord);
  const blobsRef = useRef<Blob[]>([]);
  const chordManagerRef = useRef<ChordProgressionManager>(initialChordManager);
  const createBlobsRef = useRef<((options: NextChordOption[], expandingBlob?: Blob) => void) | null>(null);

  // Blobタップ時の処理
  const handleBlobTap = useCallback((option: NextChordOption, blob: Blob) => {
    blob.startExpanding(() => {
      // 拡大完了時の処理
      const chordManager = chordManagerRef.current;

      // コード進行を更新
      chordManager.transitionTo(option.chord);
      setCurrentChord(option.chord);
      addChord(option.chord);
      setTapCount((prev) => prev + 1);

      // 新しい次の候補を取得してBlobを更新
      const newNextChordOptions = chordManager.getNextChordOptions();
      if (createBlobsRef.current) {
        createBlobsRef.current(newNextChordOptions, blob);
      }
    });
  }, [setCurrentChord, setTapCount, addChord]);

  // Blobを作成する関数
  const createBlobs = useCallback((nextChordOptions: NextChordOption[], expandingBlob?: Blob) => {
    // 既存のBlobを削除（拡大中のBlobは除く）
    blobsRef.current.forEach((blob) => {
      if (blob !== expandingBlob) {
        blob.remove();
      }
    });

    const width = paper.view.viewSize.width;
    const height = paper.view.viewSize.height;

    // BlobPositionerを使用して位置管理
    const positioner = new BlobPositioner(width, height, BLOB_MARGIN);

    // Blobの半径は遷移確率（重み）に基づいて決定
    const minRadius = BLOB_CONFIG.minRadius;
    const maxRadius = BLOB_CONFIG.maxRadius;

    const blobs: Blob[] = [];

    // 各次コード候補をBlobとして配置
    nextChordOptions.forEach((option, i) => {
      // 重みに基づいて半径を決定（重みが大きいほど大きいBlob）
      const radius = minRadius + (option.weight * (maxRadius - minRadius));
      const { x, y } = positioner.findNonOverlappingPosition(radius);

      // 位置を記録
      positioner.addPosition(x, y, radius);

      const blob = new Blob({
        x,
        y,
        radius,
        color: COLORS[i % COLORS.length],
        canvasWidth: width,
        canvasHeight: height,
        label: option.chord,
        onTap: () => handleBlobTap(option, blob),
        gravity: 0,
      });
      blobs.push(blob);
    });

    // 拡大中のBlobがある場合は配列に含める（フェードアウト完了まで更新を続けるため）
    if (expandingBlob) {
      blobs.push(expandingBlob);
    }

    blobsRef.current = blobs;
  }, [handleBlobTap]);

  // createBlobsをrefに保存
  useEffect(() => {
    createBlobsRef.current = createBlobs;
  }, [createBlobs]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Paper.jsのセットアップ
    setupPaperCanvas(canvas);

    // コード進行マネージャーを取得
    const chordManager = chordManagerRef.current;

    // 初期コードをコード列に追加
    resetChords();
    addChord(initialChord);

    // 初期の次に遷移可能なコードを取得してBlobを作成
    const nextChordOptions = chordManager.getNextChordOptions();
    createBlobs(nextChordOptions);

    // アニメーションループ
    paper.view.onFrame = () => {
      // 全てのBlobを更新
      blobsRef.current.forEach((blob) => blob.update());

      // 衝突判定
      for (let i = 0; i < blobsRef.current.length; i++) {
        for (let j = i + 1; j < blobsRef.current.length; j++) {
          blobsRef.current[i].checkCollision(blobsRef.current[j]);
        }
      }
    };

    return () => {
      // クリーンアップ
      blobsRef.current.forEach((blob) => blob.remove());
      cleanupPaperCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タップ回数が3回になったらplayback画面に遷移
  useEffect(() => {
    if (tapCount === 8) {
      router.push("/playback");
    }
  }, [tapCount, router]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <div className="absolute top-4 left-4 text-2xl font-bold text-white z-10">
        {currentChord}
      </div>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </main>
  );
}
