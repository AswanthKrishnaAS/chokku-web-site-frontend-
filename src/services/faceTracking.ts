import { Landmark, RenderDimensions, selectPrimaryFace } from '../utils/landmarkUtils';
import { calculateHeadPose, HeadPose } from './headPose';
import { getAccessoryAnchorPoints, AccessoryAnchorsResult, ProductAccessoryConfig, AccessoryAnchorItem } from './accessoryTransform';
import { getEarringAnchorPoints, EarringAnchors } from './earringTransform';
import { AnchorSmoother, adaptiveLerp } from '../utils/smoothing';

export interface TrackingFrameResult {
  detected: boolean;
  primaryFace: boolean;
  landmarks: Landmark[] | null;
  poseLandmarks?: Landmark[] | null;
  headPose: HeadPose;
  anchors: EarringAnchors;
  accessoryAnchors: AccessoryAnchorsResult;
  fps: number;
}

export class FaceTrackingPipeline {
  private leftEarSmoother = new AnchorSmoother();
  private rightEarSmoother = new AnchorSmoother();
  private mainAccessorySmoother = new AnchorSmoother();

  // Head pose smoothing
  private prevYaw = 0;
  private prevPitch = 0;
  private prevRoll = 0;

  // FPS calculation
  private fps = 0;
  private frameCount = 0;
  private fpsTimer = performance.now();

  public processLandmarks(
    multiFaceLandmarks: Landmark[][] | null,
    dims: RenderDimensions,
    config: ProductAccessoryConfig,
    isMirrored: boolean = false,
    poseLandmarks?: Landmark[] | null
  ): TrackingFrameResult {
    const now = performance.now();
    this.frameCount++;
    if (now - this.fpsTimer >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = now;
    }

    const primaryFace = selectPrimaryFace(multiFaceLandmarks || []);
    const tryOnType = config.tryOnType || 'Earrings';
    const hasPoseData = Boolean(poseLandmarks && poseLandmarks.length >= 24);

    // If neither face nor pose is detected
    if (!primaryFace && !hasPoseData) {
      this.leftEarSmoother.reset();
      this.rightEarSmoother.reset();
      this.mainAccessorySmoother.reset();
      return {
        detected: false,
        primaryFace: false,
        landmarks: null,
        poseLandmarks: null,
        headPose: { yaw: 0, pitch: 0, roll: 0 },
        anchors: { left: null, right: null, faceScale: 1.0 },
        accessoryAnchors: { type: tryOnType, items: [], faceScale: 1.0, bodyDetected: false },
        fps: this.fps,
      };
    }

    // 1. Calculate raw 3D Head Pose (or default if face missing)
    const rawHeadPose = primaryFace ? calculateHeadPose(primaryFace) : { yaw: 0, pitch: 0, roll: 0 };

    // Smooth head pose
    this.prevYaw = adaptiveLerp(this.prevYaw, rawHeadPose.yaw, 0.3, 0.85);
    this.prevPitch = adaptiveLerp(this.prevPitch, rawHeadPose.pitch, 0.3, 0.85);
    this.prevRoll = adaptiveLerp(this.prevRoll, rawHeadPose.roll, 0.3, 0.85);

    const smoothedHeadPose: HeadPose = {
      yaw: this.prevYaw,
      pitch: this.prevPitch,
      roll: this.prevRoll,
    };

    // 2. Calculate Legacy Earring Anchors
    const earringConfig = {
      offsetX: 0,
      offsetY: 5,
      scale: config.scale,
      rotationOffset: 0,
    };
    const rawEarringAnchors = primaryFace 
      ? getEarringAnchorPoints(primaryFace, dims, smoothedHeadPose, earringConfig, isMirrored)
      : { left: null, right: null, faceScale: 1.0 };

    const smoothedLeft = rawEarringAnchors.left ? this.leftEarSmoother.smooth(rawEarringAnchors.left) : null;
    const smoothedRight = rawEarringAnchors.right ? this.rightEarSmoother.smooth(rawEarringAnchors.right) : null;

    // 3. Calculate Multi-Accessory Anchors with Pose landmarker
    const accessoryAnchors = getAccessoryAnchorPoints(
      primaryFace,
      dims,
      smoothedHeadPose,
      config,
      isMirrored,
      poseLandmarks
    );

    // Apply EMA smoothing to main accessory item (dress/glasses/necklace/etc.)
    const smoothedItems: AccessoryAnchorItem[] = accessoryAnchors.items.map((item) => {
      const smoothed = this.mainAccessorySmoother.smooth({
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        scale: item.width,
        perspectiveScaleX: item.perspectiveScaleX,
        visible: item.visible,
        shadow: item.shadow ? { ...item.shadow, opacity: 0.35 } : undefined,
      });

      return {
        ...item,
        x: smoothed.x,
        y: smoothed.y,
        rotation: smoothed.rotation,
        perspectiveScaleX: smoothed.perspectiveScaleX,
      };
    });

    return {
      detected: true,
      primaryFace: Boolean(primaryFace),
      landmarks: primaryFace,
      poseLandmarks: poseLandmarks || null,
      headPose: smoothedHeadPose,
      anchors: {
        left: smoothedLeft,
        right: smoothedRight,
        faceScale: rawEarringAnchors.faceScale,
      },
      accessoryAnchors: {
        ...accessoryAnchors,
        items: smoothedItems,
      },
      fps: this.fps,
    };
  }

  public reset(): void {
    this.leftEarSmoother.reset();
    this.rightEarSmoother.reset();
    this.mainAccessorySmoother.reset();
    this.prevYaw = 0;
    this.prevPitch = 0;
    this.prevRoll = 0;
  }
}
