"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import paper from "paper";
import { Blob } from "../_lib/Blob";
import { ChordProgressionManager } from "../_lib/ChordProgressionManager";
import { useChordProgression } from "../_contexts/ChordProgressionContext";
import jazzData from "../_data/jazz.json";
import { COLORS, BLOB_CONFIG, BLOB_MARGIN } from "../_constants/theme";
import { NextChordOption } from "../_types/ChordProgression";

// コード進行マネージャーをコンポーネント外で初期化
const initialChordManager = new ChordProgressionManager(jazzData);
const initialChord = initialChordManager.getCurrentChord();

export default function PlayPage() {
  const router = useRouter();
  const { addChord, resetChords } = useChordProgression();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tapCount, setTapCount] = useState(0);
  const [currentChord, setCurrentChord] = useState<string>(initialChord);
  const blobsRef = useRef<Blob[]>([]);
  const chordManagerRef = useRef<ChordProgressionManager>(initialChordManager);
  const createBlobsRef = useRef<((options: NextChordOption[], expandingBlob?: Blob) => void) | null>(null);

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

    // Blobの半径は遷移確率（重み）に基づいて決定
    const minRadius = BLOB_CONFIG.minRadius;
    const maxRadius = BLOB_CONFIG.maxRadius;
    const margin = BLOB_MARGIN;

    const blobs: Blob[] = [];
    const positions: { x: number; y: number; radius: number }[] = [];

    // 他のBlobと重ならない位置を見つける関数
    const findNonOverlappingPosition = (radius: number, maxAttempts = 50): { x: number; y: number } => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.random() * (width - margin * 2) + margin;
        const y = Math.random() * (height - margin * 2) + margin;

        // 他のBlobとの距離をチェック
        let isOverlapping = false;
        for (const pos of positions) {
          const dx = x - pos.x;
          const dy = y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = radius + pos.radius + 30; // 30pxの余白

          if (distance < minDistance) {
            isOverlapping = true;
            break;
          }
        }

        if (!isOverlapping) {
          return { x, y };
        }
      }

      // 最大試行回数を超えた場合は、最後の位置を返す
      return {
        x: Math.random() * (width - margin * 2) + margin,
        y: Math.random() * (height - margin * 2) + margin,
      };
    };

    // 各次コード候補をBlobとして配置
    nextChordOptions.forEach((option, i) => {
      // 重みに基づいて半径を決定（重みが大きいほど大きいBlob）
      const radius = minRadius + (option.weight * (maxRadius - minRadius));
      const { x, y } = findNonOverlappingPosition(radius);

      // 位置を記録
      positions.push({ x, y, radius });

      const blob = new Blob({
        x,
        y,
        radius,
        color: COLORS[i % COLORS.length],
        canvasWidth: width,
        canvasHeight: height,
        label: option.chord,
        onTap: () => {
          // タップされたBlobを拡大アニメーション開始（拡大完了後のコールバックを設定）
          blob.startExpanding(() => {
            // 拡大完了時の処理
            // 1. コード進行を更新
            const chordManager = chordManagerRef.current;
            chordManager.transitionTo(option.chord);
            setCurrentChord(option.chord);
            addChord(option.chord); // コード列に追加
            setTapCount((prev) => prev + 1);

            // 2. 新しい次の候補を取得してBlobを更新（選択Blob以外を削除、新規Blobを追加）
            const newNextChordOptions = chordManager.getNextChordOptions();
            if (createBlobsRef.current) {
              createBlobsRef.current(newNextChordOptions, blob);
            }

            // 3. フェードアウトは自動的に開始される（Blob.tsで制御）
            // 4. フェードアウト完了後、Blobは自動削除される（Blob.tsで制御）
          });
        },
        gravity: 0,
      });
      blobs.push(blob);
    });

    // 拡大中のBlobがある場合は配列に含める（フェードアウト完了まで更新を続けるため）
    if (expandingBlob) {
      blobs.push(expandingBlob);
    }

    blobsRef.current = blobs;
  }, [setCurrentChord, setTapCount, addChord]);

  // createBlobsをrefに保存
  useEffect(() => {
    createBlobsRef.current = createBlobs;
  }, [createBlobs]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // canvasのサイズをウィンドウサイズに合わせる
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Paper.jsのセットアップ
    paper.setup(canvas);

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
      if (paper.project) {
        paper.project.clear();
      }
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
