/**
 * コード機能（音楽理論）を判定するユーティリティ
 */

/**
 * コード機能の種類
 * - T (Tonic): トニック - 安定した響き、終止感
 * - SD (Subdominant): サブドミナント - やや不安定、前進感
 * - D (Dominant): ドミナント - 緊張感、解決を求める響き
 */
export type ChordFunction = "T" | "SD" | "D";

/**
 * ディグリーネームを抽出する（数字やテンションを除いた基本形）
 * 例: "Imaj7" -> "I", "ii9" -> "ii", "viiø7" -> "vii"
 */
function extractDegree(chord: string): string {
  // ローマ数字部分のみを抽出（大文字・小文字の組み合わせに対応）
  const match = chord.match(/^(I{1,3}|i{1,3}|IV|iv|V|v|VI{1,2}|vi{1,2})/);
  return match ? match[0] : "";
}

/**
 * コードがトニック機能（T）を持つか判定
 * トニック: I, iii, vi
 *
 * @param chord - コード名（例: "Imaj7", "iii7", "vi9"）
 * @returns トニック機能を持つ場合はtrue
 */
export function isTonicChord(chord: string): boolean {
  const degree = extractDegree(chord);
  return degree === "I" || degree === "iii" || degree === "vi";
}

/**
 * コードがサブドミナント機能（SD）を持つか判定
 * サブドミナント: ii, IV
 *
 * @param chord - コード名（例: "ii7", "IVmaj7"）
 * @returns サブドミナント機能を持つ場合はtrue
 */
export function isSubdominantChord(chord: string): boolean {
  const degree = extractDegree(chord);
  return degree === "ii" || degree === "IV";
}

/**
 * コードがドミナント機能（D）を持つか判定
 * ドミナント: V, vii
 *
 * @param chord - コード名（例: "V7", "viiø7", "vii°"）
 * @returns ドミナント機能を持つ場合はtrue
 */
export function isDominantChord(chord: string): boolean {
  const degree = extractDegree(chord);
  return degree === "V" || degree === "vii";
}

/**
 * コードの機能を取得
 *
 * @param chord - コード名
 * @returns コード機能（T/SD/D）、判定できない場合はnull
 */
export function getChordFunction(chord: string): ChordFunction | null {
  if (isTonicChord(chord)) return "T";
  if (isSubdominantChord(chord)) return "SD";
  if (isDominantChord(chord)) return "D";
  return null;
}
