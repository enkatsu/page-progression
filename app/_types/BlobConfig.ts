export interface BlobConfig {
  x: number;
  y: number;
  radius: number;
  color: string;
  canvasWidth: number;
  canvasHeight: number;
  label: string;
  onTap: () => void;
  gravity?: number;
  onBottomCollision?: () => void;
}
