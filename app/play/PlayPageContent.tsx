"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import paper from "paper";
import { Blob } from "../_lib/Blob";
import { ChordProgressionManager } from "../_lib/ChordProgressionManager";
import { BlobPositioner } from "../_lib/BlobPositioner";
import { ChordPlayer } from "../_lib/ChordPlayer";
import { setupPaperCanvas, cleanupPaperCanvas } from "../_lib/paperUtils";
import { isTonicChord } from "../_lib/chordFunction";
import { useChordProgression } from "../_contexts/ChordProgressionContext";
import jazzData from "../_data/jazz.json";
import { COLORS, BLOB_CONFIG, BLOB_MARGIN, PROGRESSION_CONFIG } from "../_constants/theme";
import { NextChordOption } from "../_types/ChordProgression";

const initialChordManager = new ChordProgressionManager(jazzData);
const initialChord = initialChordManager.getCurrentChord();

export default function PlayPageContent() {
  const router = useRouter();
  const { addChord, resetChords, chordSequence } = useChordProgression();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const chordManagerRef = useRef<ChordProgressionManager>(initialChordManager);
  const chordPlayerRef = useRef<ChordPlayer | null>(null);
  const createBlobsRef = useRef<((options: NextChordOption[], expandingBlob?: Blob) => void) | null>(null);
  const tapCountRef = useRef<number>(0);

  const handleBlobTap = useCallback((option: NextChordOption, blob: Blob) => {
    if (chordPlayerRef.current) {
      chordPlayerRef.current.playChord(option.chord).catch(err => {
        console.error("Error playing chord on tap:", err);
      });
    }

    blob.startExpanding(() => {
      const chordManager = chordManagerRef.current;
      chordManager.transitionTo(option.chord);
      addChord(option.chord);

      const newTapCount = tapCountRef.current + 1;
      tapCountRef.current = newTapCount;

      if (newTapCount >= PROGRESSION_CONFIG.maxChordCount && isTonicChord(option.chord)) {
        router.push("/playback");
        return;
      }

      let newNextChordOptions = chordManager.getNextChordOptions();

      if (newTapCount === PROGRESSION_CONFIG.maxChordCount - 1) {
        const tonicOptions = newNextChordOptions.filter(opt => isTonicChord(opt.chord));

        if (tonicOptions.length > 0) {
          newNextChordOptions = tonicOptions;
        } else {
          newNextChordOptions = chordManager.getAllTonicChords();
        }
      }

      if (createBlobsRef.current) {
        createBlobsRef.current(newNextChordOptions, blob);
      }
    });
  }, [router, addChord]);

  const createBlobs = useCallback((nextChordOptions: NextChordOption[], expandingBlob?: Blob) => {
    blobsRef.current.forEach((blob) => {
      if (blob !== expandingBlob) {
        blob.remove();
      }
    });

    const width = paper.view.viewSize.width;
    const height = paper.view.viewSize.height;

    const positioner = new BlobPositioner(width, height, BLOB_MARGIN);

    const minRadius = BLOB_CONFIG.minRadius;
    const maxRadius = BLOB_CONFIG.maxRadius;

    const blobs: Blob[] = [];

    nextChordOptions.forEach((option, i) => {
      const radius = minRadius + (option.weight * (maxRadius - minRadius));
      const { x, y } = positioner.findNonOverlappingPosition(radius);

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

    if (expandingBlob) {
      blobs.push(expandingBlob);
    }

    blobsRef.current = blobs;
  }, [handleBlobTap]);

  useEffect(() => {
    createBlobsRef.current = createBlobs;
  }, [createBlobs]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    setupPaperCanvas(canvas);

    if (!chordPlayerRef.current) {
      chordPlayerRef.current = new ChordPlayer();
    }

    const chordManager = chordManagerRef.current;

    resetChords();
    addChord(initialChord);

    const nextChordOptions = chordManager.getNextChordOptions();
    createBlobs(nextChordOptions);

    paper.view.onFrame = () => {
      blobsRef.current.forEach((blob) => blob.update());

      for (let i = 0; i < blobsRef.current.length; i++) {
        for (let j = i + 1; j < blobsRef.current.length; j++) {
          blobsRef.current[i].checkCollision(blobsRef.current[j]);
        }
      }
    };

    return () => {
      blobsRef.current.forEach((blob) => blob.remove());
      cleanupPaperCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (chordPlayerRef.current) {
        chordPlayerRef.current.dispose();
        chordPlayerRef.current = null;
      }
    };
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <div className="absolute top-4 left-4 right-4 text-2xl font-bold text-white z-10">
        <div className="flex items-center gap-2 flex-wrap">
          {chordSequence.map((chord, index) => (
            <span key={index} className={index === chordSequence.length - 1 ? "text-white" : "text-white/50"}>
              {chord}
              {index < chordSequence.length - 1 && <span className="ml-2 text-white/30">-</span>}
            </span>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </main>
  );
}
