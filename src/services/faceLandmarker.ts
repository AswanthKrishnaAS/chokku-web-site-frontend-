import { Landmark } from '../utils/landmarkUtils';

/**
 * Dynamically loads MediaPipe FaceMesh scripts from CDN if not already loaded.
 */
export function loadMediaPipeFaceMesh(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).FaceMesh && (window as any).Camera) {
      resolve(true);
      return;
    }

    let loadedCount = 0;
    const totalScripts = 2;

    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= totalScripts) {
        setTimeout(() => {
          resolve(Boolean((window as any).FaceMesh));
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
        console.warn('Failed to load MediaPipe script:', src);
        checkDone();
      };
      document.body.appendChild(script);
    };

    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
  });
}

export class FaceLandmarkerService {
  private static instance: FaceLandmarkerService | null = null;
  private faceMeshInstance: any = null;
  private isInitialized = false;
  private isLoading = false;

  private constructor() {}

  public static getInstance(): FaceLandmarkerService {
    if (!FaceLandmarkerService.instance) {
      FaceLandmarkerService.instance = new FaceLandmarkerService();
    }
    return FaceLandmarkerService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized && this.faceMeshInstance) return true;
    if (this.isLoading) {
      // Wait if already initializing
      let attempts = 0;
      while (this.isLoading && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
      return this.isInitialized;
    }

    this.isLoading = true;
    try {
      const loaded = await loadMediaPipeFaceMesh();
      if (!loaded || !(window as any).FaceMesh) {
        this.isLoading = false;
        return false;
      }

      this.faceMeshInstance = new (window as any).FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      this.faceMeshInstance.setOptions({
        maxNumFaces: 2,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitialized = true;
      this.isLoading = false;
      return true;
    } catch (err) {
      console.error('FaceMesh init error:', err);
      this.isLoading = false;
      return false;
    }
  }

  public setOnResultsCallback(callback: (multiLandmarks: Landmark[][] | null) => void): void {
    if (!this.faceMeshInstance) return;
    this.faceMeshInstance.onResults((results: any) => {
      if (results && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        callback(results.multiFaceLandmarks);
      } else {
        callback(null);
      }
    });
  }

  public async sendFrame(imageElement: HTMLVideoElement | HTMLImageElement): Promise<void> {
    if (!this.isInitialized || !this.faceMeshInstance) return;
    try {
      await this.faceMeshInstance.send({ image: imageElement });
    } catch (err) {
      // Catch occasional frame drops silently
    }
  }

  public destroy(): void {
    if (this.faceMeshInstance) {
      try {
        this.faceMeshInstance.close();
      } catch (e) {}
      this.faceMeshInstance = null;
    }
    this.isInitialized = false;
    this.isLoading = false;
  }
}
