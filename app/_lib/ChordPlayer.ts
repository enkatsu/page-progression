import * as Tone from "tone";

export class ChordPlayer {
  private synth: Tone.PolySynth;

  constructor() {
    // PolySynthを作成（複数の音を同時に鳴らせる）
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();
  }

  // 度数記法をCメジャーキーでの実際のコード名に変換
  private convertRomanNumeralToChord(romanNumeral: string): string {
    // 度数とコードタイプを分離
    const romanMatch = romanNumeral.match(/^(I{1,3}|i{1,3}V|V|vi{1,2}|iv)(.*)$/i);
    if (!romanMatch) return romanNumeral; // 度数記法でない場合はそのまま返す

    const degree = romanMatch[1];
    const quality = romanMatch[2];

    // Cメジャースケールでの各度数の音
    const degreeToNote: { [key: string]: string } = {
      I: "C",
      i: "C",
      II: "D",
      ii: "D",
      III: "E",
      iii: "E",
      IV: "F",
      iv: "F",
      V: "G",
      v: "G",
      VI: "A",
      vi: "A",
      VII: "B",
      vii: "B",
    };

    const rootNote = degreeToNote[degree];
    if (!rootNote) return romanNumeral;

    // 小文字の度数記法はマイナーコード
    const isMinor = degree === degree.toLowerCase();

    // コードタイプを組み合わせる
    if (isMinor && quality === "") {
      return rootNote + "m";
    } else if (isMinor && quality.includes("7") && !quality.includes("maj")) {
      return rootNote + "m" + quality;
    } else if (quality === "°") {
      return rootNote + "dim";
    } else if (quality === "ø7") {
      return rootNote + "m7b5";
    } else {
      return rootNote + quality;
    }
  }

  // コード名から音符の配列を生成
  private parseChord(chordName: string): string[] {
    // 度数記法を実際のコード名に変換
    const actualChordName = this.convertRomanNumeralToChord(chordName);

    // コードのルート音を取得
    const rootMatch = actualChordName.match(/^([A-G][#b]?)/);
    if (!rootMatch) return [];

    const root = rootMatch[1];
    const chordType = actualChordName.slice(root.length);

    // ルート音のMIDIノート番号を取得（C4を基準）
    const noteMap: { [key: string]: number } = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
    };

    const rootNote = noteMap[root];
    if (rootNote === undefined) return [];

    // コードタイプに応じて音程を決定（半音単位）
    let intervals: number[] = [];

    if (chordType === "" || chordType === "maj" || chordType === "M") {
      // メジャー: ルート、長3度、完全5度
      intervals = [0, 4, 7];
    } else if (chordType === "m" || chordType === "min") {
      // マイナー: ルート、短3度、完全5度
      intervals = [0, 3, 7];
    } else if (chordType === "9") {
      // ドミナント9th: ルート、長3度、完全5度、短7度、長9度
      intervals = [0, 4, 7, 10, 14];
    } else if (chordType === "maj9" || chordType === "M9") {
      // メジャー9th: ルート、長3度、完全5度、長7度、長9度
      intervals = [0, 4, 7, 11, 14];
    } else if (chordType === "m9" || chordType === "min9") {
      // マイナー9th: ルート、短3度、完全5度、短7度、長9度
      intervals = [0, 3, 7, 10, 14];
    } else if (chordType === "6") {
      // 6th: ルート、長3度、完全5度、長6度
      intervals = [0, 4, 7, 9];
    } else if (chordType === "m6" || chordType === "min6") {
      // マイナー6th: ルート、短3度、完全5度、長6度
      intervals = [0, 3, 7, 9];
    } else if (chordType === "7") {
      // ドミナント7th: ルート、長3度、完全5度、短7度
      intervals = [0, 4, 7, 10];
    } else if (chordType === "maj7" || chordType === "M7") {
      // メジャー7th: ルート、長3度、完全5度、長7度
      intervals = [0, 4, 7, 11];
    } else if (chordType === "m7" || chordType === "min7") {
      // マイナー7th: ルート、短3度、完全5度、短7度
      intervals = [0, 3, 7, 10];
    } else if (chordType === "m7b5") {
      // ハーフディミニッシュ: ルート、短3度、減5度、短7度
      intervals = [0, 3, 6, 10];
    } else if (chordType === "dim" || chordType === "°" || chordType === "dim7") {
      // ディミニッシュ: ルート、短3度、減5度
      intervals = [0, 3, 6];
    } else if (chordType === "aug" || chordType === "+") {
      // オーギュメント: ルート、長3度、増5度
      intervals = [0, 4, 8];
    } else {
      // デフォルトはメジャー
      intervals = [0, 4, 7];
    }

    // オクターブ4でノートを生成
    const octave = 4;
    const notes = intervals.map((interval) => {
      const midiNote = rootNote + interval;
      const noteInOctave = midiNote % 12;
      const actualOctave = octave + Math.floor(midiNote / 12);

      const noteNames = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      return `${noteNames[noteInOctave]}${actualOctave}`;
    });

    return notes;
  }

  // コードを演奏
  async playChord(chordName: string, duration: string = "8n") {
    // Tone.jsのコンテキストを開始（ユーザーインタラクション後に一度だけ必要）
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    const notes = this.parseChord(chordName);

    if (notes.length > 0) {
      this.synth.triggerAttackRelease(notes, duration);
    } else {
      console.warn("No notes to play for chord:", chordName);
    }
  }

  // クリーンアップ
  dispose() {
    this.synth.dispose();
  }
}
