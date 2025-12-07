import paper from "paper/dist/paper-core";

/**
 * Paper.jsのセットアップを行う
 *
 * canvasのサイズをウィンドウサイズに合わせ、Paper.jsを初期化する。
 * このユーティリティにより、各ページでの重複したセットアップコードを削減する。
 *
 * @param canvas - セットアップするcanvas要素
 * @param useVisualViewport - visualViewportを使用するかどうか（iPhoneなど）
 * @returns セットアップされたcanvasのサイズ
 */
export function setupPaperCanvas(
  canvas: HTMLCanvasElement,
  useVisualViewport = false
): { width: number; height: number } {
  // canvasのサイズをウィンドウサイズに合わせる
  if (useVisualViewport) {
    const vw = window.visualViewport?.width || window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;
    canvas.width = vw;
    canvas.height = vh;
  } else {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Paper.jsのセットアップ
  paper.setup(canvas);

  return {
    width: paper.view.viewSize.width,
    height: paper.view.viewSize.height,
  };
}

/**
 * Paper.jsプロジェクトのクリーンアップを行う
 *
 * メモリリークを防ぐため、コンポーネントのアンマウント時に呼び出す。
 */
export function cleanupPaperCanvas(): void {
  if (paper.project) {
    paper.project.clear();
  }
}
