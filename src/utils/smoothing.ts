/**
 * Adaptive Exponential Moving Average (EMA) Lerp.
 * Dynamically adjusts responsiveness:
 * - Small changes (holding head still) -> lower lerp factor to freeze out micro-jitter.
 * - Large changes (turning head fast) -> higher lerp factor to follow smoothly without lag.
 */
export function adaptiveLerp(
  prev: number,
  curr: number,
  baseFactor: number = 0.25,
  maxFactor: number = 0.85,
  sensitivity: number = 0.02
): number {
  if (isNaN(prev)) return curr;
  const diff = Math.abs(curr - prev);
  const factor = Math.min(maxFactor, baseFactor + diff * sensitivity);
  return prev + (curr - prev) * factor;
}

export interface EarAnchorState {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  perspectiveScaleX: number;
  visible: boolean;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    opacity: number;
  };
}

export class AnchorSmoother {
  private state: EarAnchorState | null = null;

  public smooth(target: EarAnchorState): EarAnchorState {
    if (!this.state) {
      this.state = { ...target };
      return this.state;
    }

    // If visibility toggles off, update immediately
    if (!target.visible) {
      this.state.visible = false;
      this.state.shadow = target.shadow;
      return { ...this.state };
    }

    if (!this.state.visible && target.visible) {
      // Snapping back on visibility
      this.state = { ...target };
      return this.state;
    }

    this.state = {
      x: adaptiveLerp(this.state.x, target.x, 0.3, 0.9, 0.03),
      y: adaptiveLerp(this.state.y, target.y, 0.3, 0.9, 0.03),
      rotation: adaptiveLerp(this.state.rotation, target.rotation, 0.35, 0.9, 0.04),
      scale: adaptiveLerp(this.state.scale, target.scale, 0.2, 0.75, 0.02),
      perspectiveScaleX: adaptiveLerp(this.state.perspectiveScaleX, target.perspectiveScaleX, 0.25, 0.8, 0.03),
      visible: true,
      shadow: target.shadow,
    };

    return { ...this.state };
  }

  public reset(): void {
    this.state = null;
  }
}
