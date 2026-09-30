import { Landmark } from '../utils/landmarkUtils';

/**
 * Dynamically loads MediaPipe Pose scripts from CDN if not already loaded.
 */
export function loadMediaPipePose(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Pose && (window as any).Camera) {
      resolve(true);
      return;
    }

    let loadedCount = 0;
    const totalScripts = 2;

    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= totalScripts) {
        setTimeout(() => {
          resolve(Boolean((window as any).Pose));
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
        console.warn('Failed to load MediaPipe Pose script:', src);
        checkDone();
      };
      document.body.appendChild(script);
    };

    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
  });
}

export class PoseLandmarkerService {
  private static instance: PoseLandmarkerService | null = null;
  private poseInstance: any = null;
  private isInitialized = false;
  private isLoading = false;

  private constructor() {}

  public static getInstance(): PoseLandmarkerService {
    if (!PoseLandmarkerService.instance) {
      PoseLandmarkerService.instance = new PoseLandmarkerService();
    }
    return PoseLandmarkerService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized && this.poseInstance) return true;
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
      const loaded = await loadMediaPipePose();
      if (!loaded || !(window as any).Pose) {
        this.isLoading = false;
        return false;
      }

      this.poseInstance = new (window as any).Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      this.poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitialized = true;
      this.isLoading = false;
      return true;
    } catch (err) {
      console.error('Pose init error:', err);
      this.isLoading = false;
      return false;
    }
  }

  public setOnResultsCallback(callback: (poseLandmarks: Landmark[] | null) => void): void {
    if (!this.poseInstance) return;
    this.poseInstance.onResults((results: any) => {
      if (results && results.poseLandmarks && results.poseLandmarks.length > 0) {
        callback(results.poseLandmarks);
      } else {
        callback(null);
      }
    });
  }

  public async sendFrame(imageElement: HTMLVideoElement | HTMLImageElement): Promise<void> {
    if (!this.isInitialized || !this.poseInstance) return;
    try {
      await this.poseInstance.send({ image: imageElement });
    } catch (err) {
      // Catch occasional frame drops silently
    }
  }

  public destroy(): void {
    if (this.poseInstance) {
      try {
        this.poseInstance.close();
      } catch (e) {}
      this.poseInstance = null;
    }
    this.isInitialized = false;
    this.isLoading = false;
  }
}
