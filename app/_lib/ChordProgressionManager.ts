import { ChordProgressionData, NextChordOption } from "../_types/ChordProgression";

export class ChordProgressionManager {
  private data: ChordProgressionData;
  private currentChord: string;

  constructor(data: ChordProgressionData) {
    this.data = data;
    this.currentChord = this.getRandomTonicChord();
  }

  // Tonic(I系)のコードからランダムに選択
  private getRandomTonicChord(): string {
    const tonicChords = this.data.nodes
      .filter(node => node.id.startsWith("I"))
      .map(node => node.id);

    const randomIndex = Math.floor(Math.random() * tonicChords.length);
    return tonicChords[randomIndex];
  }

  // 現在のコードを取得
  getCurrentChord(): string {
    return this.currentChord;
  }

  // 次に遷移可能なコードとその重みを取得
  getNextChordOptions(): NextChordOption[] {
    const links = this.data.links.filter(link => link.source === this.currentChord);

    return links.map(link => ({
      chord: link.target,
      weight: link.weight
    }));
  }

  // 全てのトニックコード（I, iii, vi）を取得
  getAllTonicChords(): NextChordOption[] {
    const tonicChords = this.data.nodes
      .filter(node =>
        node.id.startsWith("I") ||
        node.id.startsWith("iii") ||
        node.id.startsWith("vi")
      )
      .map(node => ({
        chord: node.id,
        weight: 0.5 // デフォルトの重み
      }));

    return tonicChords;
  }

  // 指定されたコードに遷移
  transitionTo(chord: string): void {
    this.currentChord = chord;
  }
}
