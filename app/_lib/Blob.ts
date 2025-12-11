import paper from "paper";
import { BlobConfig } from "../_types/BlobConfig";
import { BLOB_CONFIG } from "../_constants/theme";

export class Blob {
  path: paper.Path;
  label: paper.PointText;
  baseX: number;
  baseY: number;
  baseRadius: number;
  time: number;
  speed: number;
  color: string;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
  canvasWidth: number;
  canvasHeight: number;
  gravity: number;
  onBottomCollision?: () => void;
  isExpanding: boolean;
  expandProgress: number;
  expandSpeed: number;
  onExpandComplete?: () => void;
  isFadingOut: boolean;
  fadeProgress: number;
  fadeSpeed: number;

  constructor(config: BlobConfig) {
    this.baseX = config.x;
    this.baseY = config.y;
    this.x = config.x;
    this.y = config.y;
    this.baseRadius = config.radius;
    this.color = config.color;
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
    this.time = Math.random() * Math.PI * 2; // ランダムな開始位置
    this.speed = 0.02 + Math.random() * 0.03; // ランダムな速度
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = config.gravity ?? 0;
    this.onBottomCollision = config.onBottomCollision;
    this.isExpanding = false;
    this.expandProgress = 0;
    this.expandSpeed = BLOB_CONFIG.expandSpeed;
    this.onExpandComplete = undefined;
    this.isFadingOut = false;
    this.fadeProgress = 0;
    this.fadeSpeed = BLOB_CONFIG.fadeSpeed;

    // Pathを作成
    const points = 8;
    this.path = new paper.Path();
    this.path.closed = true;

    // 不規則な円（Blob）を作成
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const randomRadius = config.radius + Math.random() * 20 - 10;
      const px = config.x + Math.cos(angle) * randomRadius;
      const py = config.y + Math.sin(angle) * randomRadius;
      this.path.add(new paper.Point(px, py));
    }

    this.path.smooth();
    this.path.fillColor = new paper.Color(config.color);

    // ラベルを作成（中央に配置）
    this.label = new paper.PointText(new paper.Point(config.x, config.y));
    this.label.content = config.label;
    this.label.fontSize = Math.max(16, config.radius * 0.4);
    this.label.fillColor = new paper.Color('#FFFFFF');
    this.label.fontWeight = 'bold';
    this.label.justification = 'center';

    // タップイベント（PathとLabelの両方に設定）
    this.path.onMouseDown = () => {
      // 拡大中またはフェードアウト中はクリックを無視
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      config.onTap();
    };

    this.label.onMouseDown = () => {
      // 拡大中またはフェードアウト中はクリックを無視
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      config.onTap();
    };

    // マウスオーバーでカーソルをポインターに（PathとLabelの両方に設定）
    this.path.onMouseEnter = () => {
      // 拡大中またはフェードアウト中はカーソルを変更しない
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      document.body.style.cursor = 'pointer';
    };

    this.label.onMouseEnter = () => {
      // 拡大中またはフェードアウト中はカーソルを変更しない
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      document.body.style.cursor = 'pointer';
    };

    // マウスアウトでカーソルを元に戻す（PathとLabelの両方に設定）
    this.path.onMouseLeave = () => {
      document.body.style.cursor = 'default';
    };

    this.label.onMouseLeave = () => {
      document.body.style.cursor = 'default';
    };
  }

  // 拡大アニメーション開始
  startExpanding(onComplete?: () => void) {
    this.isExpanding = true;
    this.expandProgress = 0;
    this.onExpandComplete = onComplete;
    // 拡大中は重力と速度をリセット
    this.gravity = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    // Blobを最前面に移動
    this.path.bringToFront();
    this.label.bringToFront();
  }

  // アニメーション更新（メインループから呼ばれる）
  update() {
    if (this.isFadingOut) {
      this.updateFadeOut();
      return;
    }

    if (this.isExpanding) {
      this.updateExpanding();
      return;
    }

    this.updateNormalState();
  }

  // フェードアウトアニメーション更新
  private updateFadeOut() {
    this.fadeProgress += this.fadeSpeed;

    if (this.fadeProgress >= 1) {
      this.fadeProgress = 1;
      this.remove();
      return;
    }

    // PathとLabelの透明度を更新
    const opacity = 1 - this.fadeProgress;
    if (this.path.fillColor) {
      this.path.fillColor.alpha = opacity;
    }
    if (this.label.fillColor) {
      this.label.fillColor.alpha = opacity;
    }
  }

  // 拡大アニメーション更新
  private updateExpanding() {
    this.expandProgress += this.expandSpeed;

    if (this.expandProgress >= 1) {
      this.expandProgress = 1;
      this.isExpanding = false;
      this.isFadingOut = true;
      // 拡大完了時にコールバックを実行
      if (this.onExpandComplete) {
        this.onExpandComplete();
        this.onExpandComplete = undefined;
      }
    }

    // 画面全体に広がるように計算
    const maxDimension = Math.max(this.canvasWidth, this.canvasHeight);
    const targetRadius = maxDimension * 1.5;

    // イージング（easeInQuad）
    const eased = this.expandProgress * this.expandProgress;
    const radius = this.baseRadius + (targetRadius - this.baseRadius) * eased;

    // パスの各セグメントを更新
    const points = this.path.segments.length;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const px = this.x + Math.cos(angle) * radius;
      const py = this.y + Math.sin(angle) * radius;
      this.path.segments[i].point = new paper.Point(px, py);
    }
    this.path.smooth();

    // ラベルをフェードアウト
    this.label.opacity = 1 - this.expandProgress;
    this.label.position = new paper.Point(this.x, this.y);
  }

  // 通常状態の更新
  private updateNormalState() {
    this.updatePhysics();
    this.checkBoundaryCollision();
    this.updateWobbleAnimation();
  }

  // 物理演算（時間、重力、摩擦、位置）を更新
  private updatePhysics() {
    this.time += this.speed;

    // 重力を適用
    this.velocityY += this.gravity;

    // 速度を減衰させる（摩擦）
    this.velocityX *= 0.98;
    this.velocityY *= 0.98;

    // 位置を更新
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  // 画面端との衝突判定
  private checkBoundaryCollision() {
    const margin = this.baseRadius;

    // 左端
    if (this.x - margin < 0) {
      this.x = margin;
      this.velocityX *= -0.8;
    }
    // 右端
    if (this.x + margin > this.canvasWidth) {
      this.x = this.canvasWidth - margin;
      this.velocityX *= -0.8;
    }
    // 上端
    if (this.y - margin < 0) {
      this.y = margin;
      this.velocityY *= -0.8;
    }
    // 下端
    if (this.y + margin > this.canvasHeight) {
      this.y = this.canvasHeight - margin;
      this.velocityY *= -0.8;
      // 下端に衝突したときのコールバックを呼び出す
      if (this.onBottomCollision) {
        this.onBottomCollision();
        this.onBottomCollision = undefined;
      }
    }
  }

  // ふよふよアニメーション（形状変形とラベル位置更新）
  private updateWobbleAnimation() {
    // ふよふよと動く
    const offsetX = Math.sin(this.time) * 10;
    const offsetY = Math.cos(this.time * 1.3) * 10;

    // パスの各セグメントを更新
    const points = this.path.segments.length;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wave = Math.sin(this.time * 2 + i) * 5;
      const randomRadius = this.baseRadius + wave;
      const px = this.x + offsetX + Math.cos(angle) * randomRadius;
      const py = this.y + offsetY + Math.sin(angle) * randomRadius;
      this.path.segments[i].point = new paper.Point(px, py);
    }

    this.path.smooth();

    // ラベルの位置も更新
    this.label.position = new paper.Point(this.x + offsetX, this.y + offsetY);
  }

  // 他のBlobとの衝突判定
  checkCollision(other: Blob) {
    // 拡大中またはフェードアウト中のBlobは衝突判定をスキップ
    if (this.isExpanding || this.isFadingOut || other.isExpanding || other.isFadingOut) {
      return;
    }

    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = this.baseRadius + other.baseRadius;

    if (distance < minDistance) {
      // 衝突している場合
      const angle = Math.atan2(dy, dx);
      const targetX = this.x + Math.cos(angle) * minDistance;
      const targetY = this.y + Math.sin(angle) * minDistance;

      // 位置を補正
      const ax = (targetX - other.x) * 0.05;
      const ay = (targetY - other.y) * 0.05;

      // 速度を反映（弾性衝突）
      this.velocityX -= ax;
      this.velocityY -= ay;
      other.velocityX += ax;
      other.velocityY += ay;
    }
  }

  // Blobを削除
  remove() {
    this.path.remove();
    this.label.remove();
  }
}
