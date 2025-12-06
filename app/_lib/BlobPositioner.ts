import { BLOB_CONFIG } from "../_constants/theme";

/**
 * Blobの配置位置を管理し、重ならない位置を見つけるクラス
 */
export class BlobPositioner {
  private positions: Array<{ x: number; y: number; radius: number }> = [];

  constructor(
    private width: number,
    private height: number,
    private margin: number
  ) {}

  /**
   * 他のBlobと重ならない位置を探す
   *
   * ランダムな位置を生成し、既存のBlobと重ならないかチェックする。
   * 最大試行回数に達した場合は、重なる可能性があるが位置を返す。
   *
   * @param radius - 配置するBlobの半径
   * @param spacing - Blob間の最小余白（デフォルト: BLOB_CONFIG.spacing）
   * @param maxAttempts - 最大試行回数（デフォルト: BLOB_CONFIG.maxPlacementAttempts）
   * @returns 配置可能な座標
   */
  findNonOverlappingPosition(
    radius: number,
    spacing: number = BLOB_CONFIG.spacing,
    maxAttempts: number = BLOB_CONFIG.maxPlacementAttempts
  ): { x: number; y: number } {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const position = this.getRandomPosition();

      if (!this.isOverlapping(position.x, position.y, radius, spacing)) {
        return position;
      }
    }

    // フォールバック: 最大試行回数を超えた場合は重なる可能性があるが位置を返す
    return this.getRandomPosition();
  }

  /**
   * 指定された位置が既存のBlobと重なっているかチェック
   */
  private isOverlapping(
    x: number,
    y: number,
    radius: number,
    spacing: number
  ): boolean {
    for (const pos of this.positions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = radius + pos.radius + spacing;

      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  }

  /**
   * マージンを考慮したランダムな位置を生成
   */
  private getRandomPosition(): { x: number; y: number } {
    return {
      x: Math.random() * (this.width - this.margin * 2) + this.margin,
      y: Math.random() * (this.height - this.margin * 2) + this.margin,
    };
  }

  /**
   * 配置したBlobの位置を記録
   *
   * 次回の配置時に重ならないようにするため、
   * Blobを配置した後に必ず呼び出す必要がある。
   */
  addPosition(x: number, y: number, radius: number): void {
    this.positions.push({ x, y, radius });
  }

  /**
   * 記録された位置情報をクリア
   */
  reset(): void {
    this.positions = [];
  }
}
