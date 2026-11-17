export interface PhotographFrame {
  frame: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
  radius: string;
}

/** Measure the photograph rather than its caption or the rotated bounding box. */
export function photograph(origin?: HTMLElement | null): PhotographFrame | null {
  if (!origin?.isConnected) return null;
  const frame = origin.querySelector<HTMLElement>('.portfolio-photo') ?? origin;
  const bounds = frame.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0 || bounds.bottom <= 0 || bounds.top >= innerHeight || bounds.right <= 0 || bounds.left >= innerWidth) return null;
  let rotation = 0;
  let parent: HTMLElement | null = frame;
  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent);
    const transform = style.transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      rotation += Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    }
    // Individual CSS rotate is composed outside the transform matrix.
    const angle = style.rotate?.split(' ').at(-1);
    if (angle && angle !== 'none') {
      const amount = parseFloat(angle);
      if (Number.isFinite(amount)) rotation += angle.endsWith('grad') ? amount * 0.9 : angle.endsWith('rad') ? amount * 180 / Math.PI : angle.endsWith('turn') ? amount * 360 : amount;
    }
    parent = parent.parentElement;
  }
  const width = frame.offsetWidth;
  const height = frame.offsetHeight;
  return { frame, left: bounds.left + bounds.width / 2 - width / 2, top: bounds.top + bounds.height / 2 - height / 2, width, height, rotation, radius: getComputedStyle(frame).borderRadius };
}

