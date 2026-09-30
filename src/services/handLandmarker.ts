import { Landmark, RenderDimensions, normalizedToPixel } from '../utils/landmarkUtils';
import { HeadPose } from './headPose';
import { ProductAccessoryConfig, AccessoryAnchorItem, AccessoryAnchorsResult } from './accessoryTransform';

/**
 * Dynamically loads MediaPipe Hands scripts from CDN if not already loaded.
 */
export function loadMediaPipeHands(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Hands && (window as any).Camera) {
      resolve(true);
      return;
    }

    let loadedCount = 0;
    const totalScripts = 2;

    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= totalScripts) {
        setTimeout(() => {
          resolve(Boolean((window as any).Hands));
        }, 100);
      }
    };

    const loadScript = (src: string) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        checkDone();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = checkDone;
      script.onerror = () => {
        console.warn('Failed to load MediaPipe Hands script:', src);
        checkDone();
      };
      document.body.appendChild(script);
    };

    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  });
}

export class HandLandmarkerService {
  private static instance: HandLandmarkerService | null = null;
  private handsInstance: any = null;
  private isInitialized = false;
  private isLoading = false;

  private constructor() {}

  public static getInstance(): HandLandmarkerService {
    if (!HandLandmarkerService.instance) {
      HandLandmarkerService.instance = new HandLandmarkerService();
    }
    return HandLandmarkerService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized && this.handsInstance) return true;
    if (this.isLoading) {
      let attempts = 0;
      while (this.isLoading && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
      return this.isInitialized;
    }

    this.isLoading = true;
    try {
      const loaded = await loadMediaPipeHands();
      if (!loaded || !(window as any).Hands) {
        this.isLoading = false;
        return false;
      }

      this.handsInstance = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      this.handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitialized = true;
      this.isLoading = false;
      return true;
    } catch (err) {
      console.error('Hands init error:', err);
      this.isLoading = false;
      return false;
    }
  }

  public setOnResultsCallback(callback: (multiHandLandmarks: Landmark[][] | null) => void): void {
    if (!this.handsInstance) return;
    this.handsInstance.onResults((results: any) => {
      if (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        callback(results.multiHandLandmarks);
      } else {
        callback(null);
      }
    });
  }

  public async sendFrame(imageElement: HTMLVideoElement | HTMLImageElement): Promise<void> {
    if (!this.isInitialized || !this.handsInstance) return;
    try {
      await this.handsInstance.send({ image: imageElement });
    } catch (err) {
      // Catch frame drops silently
    }
  }

  public destroy(): void {
    if (this.handsInstance) {
      try {
        this.handsInstance.close();
      } catch (e) {}
      this.handsInstance = null;
    }
    this.isInitialized = false;
    this.isLoading = false;
  }
}

/**
 * Computes exact 3D position, rotation, and scaling for Hand Accessories (Ring, Bracelet, Hand chain).
 */
export function getHandAccessoryAnchorPoints(
  handLandmarks: Landmark[] | null,
  dims: RenderDimensions,
  headPose: HeadPose,
  config: ProductAccessoryConfig,
  isMirrored: boolean = false
): AccessoryAnchorsResult {
  const type = config.tryOnType || 'Bangle';

  if (!handLandmarks || handLandmarks.length < 21) {
    return { type, items: [], faceScale: 1.0, bodyDetected: false };
  }

  const items: AccessoryAnchorItem[] = [];

  // Key Hand Landmarks:
  // 0: WRIST, 5: INDEX_MCP, 9: MIDDLE_MCP, 13: RING_MCP, 14: RING_PIP, 17: PINKY_MCP
  const wristPx = normalizedToPixel(handLandmarks[0], dims, isMirrored);
  const indexMcpPx = normalizedToPixel(handLandmarks[5], dims, isMirrored);
  const middleMcpPx = normalizedToPixel(handLandmarks[9], dims, isMirrored);
  const ringMcpPx = normalizedToPixel(handLandmarks[13], dims, isMirrored);
  const ringPipPx = normalizedToPixel(handLandmarks[14], dims, isMirrored);
  const pinkyMcpPx = normalizedToPixel(handLandmarks[17], dims, isMirrored);

  const palmWidth = Math.hypot(pinkyMcpPx.x - indexMcpPx.x, pinkyMcpPx.y - indexMcpPx.y) || 60;
  const handScale = palmWidth / 60.0;
  const userScale = config.scale || 1.0;

  if (type === 'Ring') {
    // Ring: Fits ring finger (Landmarks 13 & 14)
    const ringAngle = (Math.atan2(ringPipPx.y - ringMcpPx.y, ringPipPx.x - ringMcpPx.x) * 180) / Math.PI;
    const ringWidth = palmWidth * 0.45 * userScale;

    items.push({
      id: 'ring',
      x: (ringMcpPx.x + ringPipPx.x) / 2,
      y: (ringMcpPx.y + ringPipPx.y) / 2,
      width: ringWidth,
      height: ringWidth * 0.8,
      rotation: ringAngle,
      perspectiveScaleX: 1.0,
      visible: true,
      shadow: { offsetX: 1 * handScale, offsetY: 2 * handScale, blur: 4 * handScale },
    });
  } else if (type === 'Bracelet' || type === 'Bangle' || type === 'Hand chain') {
    // Bracelet / Wrist chain: Fits wrist (Landmark 0)
    const wristAngle = (Math.atan2(middleMcpPx.y - wristPx.y, middleMcpPx.x - wristPx.x) * 180) / Math.PI - 90;
    const braceletWidth = palmWidth * 1.35 * userScale;

    items.push({
      id: 'bracelet',
      x: wristPx.x,
      y: wristPx.y,
      width: braceletWidth,
      height: braceletWidth * 0.75,
      rotation: wristAngle,
      perspectiveScaleX: 1.0,
      visible: true,
      shadow: { offsetX: 2 * handScale, offsetY: 4 * handScale, blur: 8 * handScale },
    });
  }

  return {
    type,
    items,
    faceScale: handScale,
    bodyDetected: true,
  };
}
