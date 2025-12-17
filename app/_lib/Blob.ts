import paper from "paper";
import { BlobConfig } from "../_types/BlobConfig";
import { BLOB_CONFIG, CHORD_FUNCTION_CONFIG } from "../_constants/theme";

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
    this.time = Math.random() * Math.PI * 2;

    // 和音の機能に基づいてアニメーション速度を設定
    const baseSpeed = 0.02 + Math.random() * 0.03;
    const chordConfig = config.chordFunction
      ? CHORD_FUNCTION_CONFIG[config.chordFunction]
      : CHORD_FUNCTION_CONFIG.T;
    this.speed = baseSpeed * chordConfig.animationSpeed;

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

    const points = 8;
    this.path = new paper.Path();
    this.path.closed = true;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const randomRadius = config.radius + Math.random() * 20 - 10;
      const px = config.x + Math.cos(angle) * randomRadius;
      const py = config.y + Math.sin(angle) * randomRadius;
      this.path.add(new paper.Point(px, py));
    }

    this.path.smooth();
    this.path.fillColor = new paper.Color(config.color);

    this.label = new paper.PointText(new paper.Point(config.x, config.y));
    this.label.content = config.label;
    this.label.fontSize = Math.max(16, config.radius * 0.4);
    this.label.fillColor = new paper.Color('#FFFFFF');
    this.label.fontWeight = 'bold';
    this.label.justification = 'center';

    this.path.onMouseDown = () => {
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      config.onTap();
    };

    this.label.onMouseDown = () => {
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      config.onTap();
    };

    this.path.onMouseEnter = () => {
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      document.body.style.cursor = 'pointer';
    };

    this.label.onMouseEnter = () => {
      if (this.isExpanding || this.isFadingOut) {
        return;
      }
      document.body.style.cursor = 'pointer';
    };

    this.path.onMouseLeave = () => {
      document.body.style.cursor = 'default';
    };

    this.label.onMouseLeave = () => {
      document.body.style.cursor = 'default';
    };
  }

  startExpanding(onComplete?: () => void) {
    this.isExpanding = true;
    this.expandProgress = 0;
    this.onExpandComplete = onComplete;
    this.gravity = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.path.bringToFront();
    this.label.bringToFront();
  }

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

  private updateFadeOut() {
    this.fadeProgress += this.fadeSpeed;

    if (this.fadeProgress >= 1) {
      this.fadeProgress = 1;
      this.remove();
      return;
    }

    const opacity = 1 - this.fadeProgress;
    if (this.path.fillColor) {
      this.path.fillColor.alpha = opacity;
    }
    if (this.label.fillColor) {
      this.label.fillColor.alpha = opacity;
    }
  }

  private updateExpanding() {
    this.expandProgress += this.expandSpeed;

    if (this.expandProgress >= 1) {
      this.expandProgress = 1;
      this.isExpanding = false;
      this.isFadingOut = true;
      if (this.onExpandComplete) {
        this.onExpandComplete();
        this.onExpandComplete = undefined;
      }
    }

    const maxDimension = Math.max(this.canvasWidth, this.canvasHeight);
    const targetRadius = maxDimension * 1.5;
    const eased = this.expandProgress * this.expandProgress;
    const radius = this.baseRadius + (targetRadius - this.baseRadius) * eased;

    const points = this.path.segments.length;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const px = this.x + Math.cos(angle) * radius;
      const py = this.y + Math.sin(angle) * radius;
      this.path.segments[i].point = new paper.Point(px, py);
    }
    this.path.smooth();

    this.label.opacity = 1 - this.expandProgress;
    this.label.position = new paper.Point(this.x, this.y);
  }

  private updateNormalState() {
    this.updatePhysics();
    this.checkBoundaryCollision();
    this.updateWobbleAnimation();
  }

  private updatePhysics() {
    this.time += this.speed;
    this.velocityY += this.gravity;
    this.velocityX *= 0.98;
    this.velocityY *= 0.98;
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  private checkBoundaryCollision() {
    const margin = this.baseRadius;
    const restitution = -0.8;

    if (this.x - margin < 0) {
      this.x = margin;
      this.velocityX *= restitution;
    }
    if (this.x + margin > this.canvasWidth) {
      this.x = this.canvasWidth - margin;
      this.velocityX *= restitution;
    }
    if (this.y - margin < 0) {
      this.y = margin;
      this.velocityY *= restitution;
    }
    if (this.y + margin > this.canvasHeight) {
      this.y = this.canvasHeight - margin;
      this.velocityY *= restitution;
      if (this.onBottomCollision) {
        this.onBottomCollision();
        this.onBottomCollision = undefined;
      }
    }
  }

  private updateWobbleAnimation() {
    const offsetX = Math.sin(this.time) * 10;
    const offsetY = Math.cos(this.time * 1.3) * 10;

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
    this.label.position = new paper.Point(this.x + offsetX, this.y + offsetY);
  }

  /**
   * 他のBlobとの衝突判定と反応
   * @param other 衝突判定対象のBlob
   */
  checkCollision(other: Blob) {
    if (this.isExpanding || this.isFadingOut || other.isExpanding || other.isFadingOut) {
      return;
    }

    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = this.baseRadius + other.baseRadius;

    if (distance < minDistance) {
      const angle = Math.atan2(dy, dx);
      const targetX = this.x + Math.cos(angle) * minDistance;
      const targetY = this.y + Math.sin(angle) * minDistance;
      const ax = (targetX - other.x) * 0.05;
      const ay = (targetY - other.y) * 0.05;

      this.velocityX -= ax;
      this.velocityY -= ay;
      other.velocityX += ax;
      other.velocityY += ay;
    }
  }

  remove() {
    this.path.remove();
    this.label.remove();
  }
}
