import { Landmark, RenderDimensions, normalizedToPixel, LANDMARK_INDICES, POSE_LANDMARK_INDICES } from '../utils/landmarkUtils';
import { HeadPose } from './headPose';

export type TryOnType = 'Earrings' | 'Necklace' | 'Dress' | 'Bangle' | 'Shoes' | 'Glasses' | 'Other';
export type FrameMode = 'half' | 'full' | 'auto';

export interface AccessoryAnchorItem {
  id: string; // 'left' | 'right' | 'main' | 'dress' | 'glasses' | 'necklace' | 'bangle' | 'shoe_left' | 'shoe_right'
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  perspectiveScaleX: number;
  visible: boolean;
  frameMode?: 'half' | 'full';
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  armOcclusion?: {
    leftArm?: { x: number; y: number }[];
    rightArm?: { x: number; y: number }[];
  };
}

export interface AccessoryAnchorsResult {
  type: TryOnType;
  items: AccessoryAnchorItem[];
  faceScale: number;
  frameMode?: 'half' | 'full';
  bodyDetected?: boolean;
}

export interface ProductAccessoryConfig {
  tryOnType?: TryOnType;
  scale: number;
  tryOnWidth?: number;
  tryOnHeight?: number;
  frameMode?: FrameMode;
}

/**
 * Computes exact 3D positioning and perspective transforms for all 7 Try-On accessory types:
 * Earrings, Glasses, Necklace, Dress, Bangles, Shoes, and Other accessories.
 * Utilizes AI Pose landmarks (shoulders, torso, hips, arms, legs) for hyper-realistic tracking.
 */
export function getAccessoryAnchorPoints(
  landmarks: Landmark[] | null,
  dims: RenderDimensions,
  headPose: HeadPose,
  config: ProductAccessoryConfig,
  isMirrored: boolean = false,
  poseLandmarks?: Landmark[] | null
): AccessoryAnchorsResult {
  const type: TryOnType = config.tryOnType || 'Earrings';
  const frameModeSetting: FrameMode = config.frameMode || 'auto';

  let faceScale = 1.0;
  let interEyeDist = 110;
  let faceHeight = 140;

  // Key Face Landmarks (If available)
  let nosePx = { x: dims.containerW / 2, y: dims.containerH * 0.3, z: 0 };
  let chinPx = { x: dims.containerW / 2, y: dims.containerH * 0.45, z: 0 };
  let foreheadPx = { x: dims.containerW / 2, y: dims.containerH * 0.15, z: 0 };
  let lEyePx = { x: dims.containerW * 0.4, y: dims.containerH * 0.25, z: 0 };
  let rEyePx = { x: dims.containerW * 0.6, y: dims.containerH * 0.25, z: 0 };
  let noseBridgePx = { x: dims.containerW / 2, y: dims.containerH * 0.25, z: 0 };

  if (landmarks && landmarks.length >= 468) {
    const nose = landmarks[LANDMARK_INDICES.NOSE_TIP] || landmarks[1];
    const chin = landmarks[LANDMARK_INDICES.CHIN] || landmarks[152];
    const forehead = landmarks[LANDMARK_INDICES.FOREHEAD] || landmarks[10];
    const lEye = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER] || landmarks[33];
    const rEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER] || landmarks[263];
    const noseBridge = landmarks[LANDMARK_INDICES.NOSE_BRIDGE] || landmarks[6];

    lEyePx = normalizedToPixel(lEye, dims, isMirrored);
    rEyePx = normalizedToPixel(rEye, dims, isMirrored);
    nosePx = normalizedToPixel(nose, dims, isMirrored);
    chinPx = normalizedToPixel(chin, dims, isMirrored);
    foreheadPx = normalizedToPixel(forehead, dims, isMirrored);
    noseBridgePx = normalizedToPixel(noseBridge, dims, isMirrored);

    interEyeDist = Math.hypot(rEyePx.x - lEyePx.x, rEyePx.y - lEyePx.y);
    faceHeight = Math.hypot(chinPx.y - foreheadPx.y, chinPx.x - foreheadPx.x) || 120;
    faceScale = Math.max(0.3, Math.min(3.5, interEyeDist / 110.0));
  }

  const scale = faceScale * (config.scale || 1.0);
  const yawRad = (headPose.yaw * Math.PI) / 180;
  const isTurningHeadRight = isMirrored ? headPose.yaw < -15 : headPose.yaw > 15;
  const isTurningHeadLeft = isMirrored ? headPose.yaw > 15 : headPose.yaw < -15;

  const items: AccessoryAnchorItem[] = [];
  let bodyDetected = false;

  // Check if MediaPipe Pose body landmarks exist
  const hasPose = poseLandmarks && poseLandmarks.length >= 24;

  // ==========================================
  // 1. EARRINGS (Face & Ears)
  // ==========================================
  if (type === 'Earrings') {
    if (!landmarks || landmarks.length < 468) {
      return { type, items: [], faceScale: 1.0, bodyDetected: false };
    }
    const lLobeNorm = landmarks[LANDMARK_INDICES.LEFT_EAR_LOBE] || landmarks[132] || landmarks[234];
    const lTopNorm = landmarks[LANDMARK_INDICES.LEFT_EAR_TOP] || landmarks[127];
    const rLobeNorm = landmarks[LANDMARK_INDICES.RIGHT_EAR_LOBE] || landmarks[361] || landmarks[454];
    const rTopNorm = landmarks[LANDMARK_INDICES.RIGHT_EAR_TOP] || landmarks[356];

    const lLobePx = normalizedToPixel(lLobeNorm, dims, isMirrored);
    const lTopPx = normalizedToPixel(lTopNorm, dims, isMirrored);
    const rLobePx = normalizedToPixel(rLobeNorm, dims, isMirrored);
    const rTopPx = normalizedToPixel(rTopNorm, dims, isMirrored);

    const lEarAngle = (Math.atan2(lLobePx.y - lTopPx.y, lLobePx.x - lTopPx.x) * 180) / Math.PI - 90;
    const rEarAngle = (Math.atan2(rLobePx.y - rTopPx.y, rLobePx.x - rTopPx.x) * 180) / Math.PI - 90;

    const leftVisible = !(isTurningHeadRight && (isMirrored ? lLobePx.x < nosePx.x + 10 : lLobePx.x > nosePx.x - 10));
    const rightVisible = !(isTurningHeadLeft && (isMirrored ? rLobePx.x > nosePx.x - 10 : rLobePx.x < nosePx.x + 10));

    const leftPerspective = isTurningHeadRight ? Math.max(0.25, Math.cos(yawRad)) : Math.min(1.1, 1.0 + Math.abs(Math.sin(yawRad)) * 0.15);
    const rightPerspective = isTurningHeadLeft ? Math.max(0.25, Math.cos(yawRad)) : Math.min(1.1, 1.0 + Math.abs(Math.sin(yawRad)) * 0.15);

    const baseItemW = Math.max(25, 45 * scale);

    items.push({
      id: 'left',
      x: lLobePx.x,
      y: lLobePx.y + 5 * faceScale,
      width: baseItemW,
      height: baseItemW,
      rotation: lEarAngle,
      perspectiveScaleX: leftPerspective,
      visible: leftVisible,
      shadow: { offsetX: 3 * faceScale, offsetY: 4 * faceScale, blur: 8 * faceScale },
    });

    items.push({
      id: 'right',
      x: rLobePx.x,
      y: rLobePx.y + 5 * faceScale,
      width: baseItemW,
      height: baseItemW,
      rotation: rEarAngle,
      perspectiveScaleX: rightPerspective,
      visible: rightVisible,
      shadow: { offsetX: 3 * faceScale, offsetY: 4 * faceScale, blur: 8 * faceScale },
    });
  }

  // ==========================================
  // 2. GLASSES (Face & Eyes)
  // ==========================================
  else if (type === 'Glasses') {
    if (!landmarks || landmarks.length < 468) {
      return { type, items: [], faceScale: 1.0, bodyDetected: false };
    }
    const glassesWidth = interEyeDist * 2.2 * (config.scale || 1.0);
    const eyeRoll = (Math.atan2(rEyePx.y - lEyePx.y, rEyePx.x - lEyePx.x) * 180) / Math.PI;

    items.push({
      id: 'glasses',
      x: noseBridgePx.x,
      y: noseBridgePx.y,
      width: glassesWidth,
      height: glassesWidth * 0.45,
      rotation: eyeRoll,
      perspectiveScaleX: Math.max(0.6, Math.cos(yawRad)),
      visible: true,
      shadow: { offsetX: 0, offsetY: 4 * faceScale, blur: 10 * faceScale },
    });
  }

  // ==========================================
  // 3. NECKLACE (Neck & Chest)
  // ==========================================
  else if (type === 'Necklace') {
    let neckX = chinPx.x;
    let neckY = chinPx.y + faceHeight * 0.35;
    let neckWidth = interEyeDist * 2.6 * (config.scale || 1.0);
    let neckRoll = headPose.roll * 0.5;

    if (hasPose && poseLandmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER] && poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER]) {
      const lSh = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER], dims, isMirrored);
      const rSh = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER], dims, isMirrored);
      const shWidth = Math.hypot(rSh.x - lSh.x, rSh.y - lSh.y);
      if (shWidth > 40) {
        bodyDetected = true;
        neckX = (lSh.x + rSh.x) / 2;
        neckY = (lSh.y + rSh.y) / 2 - shWidth * 0.1;
        neckWidth = shWidth * 0.75 * (config.scale || 1.0);
        neckRoll = (Math.atan2(rSh.y - lSh.y, rSh.x - lSh.x) * 180) / Math.PI;
      }
    }

    items.push({
      id: 'necklace',
      x: neckX,
      y: neckY,
      width: neckWidth,
      height: neckWidth * 0.85,
      rotation: neckRoll,
      perspectiveScaleX: Math.max(0.7, Math.cos(yawRad * 0.5)),
      visible: true,
      shadow: { offsetX: 0, offsetY: 6 * faceScale, blur: 12 * faceScale },
    });
  }

  // ==========================================
  // 4. DRESS (AI Full Body / Half Frame Torso)
  // ==========================================
  else if (type === 'Dress') {
    let shoulderCenterX = chinPx.x;
    let shoulderCenterY = chinPx.y + faceHeight * 0.6;
    let shoulderWidth = faceHeight * 2.1;
    let shoulderAngle = headPose.roll * 0.3;
    let torsoHeight = shoulderWidth * 1.35;
    let isFullLegsVisible = false;

    if (hasPose && poseLandmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER] && poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER]) {
      const lShNorm = poseLandmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER];
      const rShNorm = poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER];
      
      const lSh = normalizedToPixel(lShNorm, dims, isMirrored);
      const rSh = normalizedToPixel(rShNorm, dims, isMirrored);

      const calculatedShWidth = Math.hypot(rSh.x - lSh.x, rSh.y - lSh.y);

      if (calculatedShWidth > 35) {
        bodyDetected = true;
        shoulderCenterX = (lSh.x + rSh.x) / 2;
        shoulderCenterY = (lSh.y + rSh.y) / 2;
        shoulderWidth = calculatedShWidth;
        shoulderAngle = (Math.atan2(rSh.y - lSh.y, rSh.x - lSh.x) * 180) / Math.PI;

        // Check Hips
        if (poseLandmarks[POSE_LANDMARK_INDICES.LEFT_HIP] && poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_HIP]) {
          const lHip = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.LEFT_HIP], dims, isMirrored);
          const rHip = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_HIP], dims, isMirrored);
          const hipCenterX = (lHip.x + rHip.x) / 2;
          const hipCenterY = (lHip.y + rHip.y) / 2;
          const calcTorso = Math.hypot(hipCenterY - shoulderCenterY, hipCenterX - shoulderCenterX);
          if (calcTorso > 40) {
            torsoHeight = calcTorso;
          }
        }

        // Check Knees / Legs for Full Body detection
        if (poseLandmarks[POSE_LANDMARK_INDICES.LEFT_KNEE] || poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_KNEE]) {
          isFullLegsVisible = true;
        }
      }
    }

    // Determine Active Frame Mode ('half' vs 'full')
    let activeFrameMode: 'half' | 'full' = 'half';
    if (frameModeSetting === 'full') {
      activeFrameMode = 'full';
    } else if (frameModeSetting === 'half') {
      activeFrameMode = 'half';
    } else {
      // Auto-detect frame mode
      activeFrameMode = (isFullLegsVisible && shoulderWidth < dims.containerW * 0.35) ? 'full' : 'half';
    }

    // Realistic Proportions
    const dressWidth = shoulderWidth * 1.85 * (config.scale || 1.0);
    
    let dressHeight = dressWidth * 2.2;
    if (activeFrameMode === 'full') {
      dressHeight = torsoHeight * 2.5 * (config.scale || 1.0);
    } else {
      // In Half Frame: Preserve natural dress aspect ratio, allow lower portion to extend off-frame
      dressHeight = dressWidth * 2.2;
    }

    // Top Collar alignment (aligned slightly above shoulder line for dress collar/neckline)
    const collarY = shoulderCenterY - dressWidth * 0.08;
    const anchorY = collarY + dressHeight / 2;

    // Detect Arm Overlay for layering (wrists/forearms in front of torso)
    const armOcclusion: { leftArm?: { x: number; y: number }[]; rightArm?: { x: number; y: number }[] } = {};
    if (hasPose) {
      if (poseLandmarks[POSE_LANDMARK_INDICES.LEFT_ELBOW] && poseLandmarks[POSE_LANDMARK_INDICES.LEFT_WRIST]) {
        const lElbow = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.LEFT_ELBOW], dims, isMirrored);
        const lWrist = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.LEFT_WRIST], dims, isMirrored);
        armOcclusion.leftArm = [lElbow, lWrist];
      }
      if (poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_ELBOW] && poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_WRIST]) {
        const rElbow = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_ELBOW], dims, isMirrored);
        const rWrist = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_WRIST], dims, isMirrored);
        armOcclusion.rightArm = [rElbow, rWrist];
      }
    }

    items.push({
      id: 'dress',
      x: shoulderCenterX,
      y: anchorY,
      width: dressWidth,
      height: dressHeight,
      rotation: shoulderAngle,
      perspectiveScaleX: Math.max(0.65, Math.cos(yawRad * 0.5)),
      visible: true,
      frameMode: activeFrameMode,
      armOcclusion,
      shadow: { offsetX: 0, offsetY: 10 * faceScale, blur: 20 * faceScale },
    });
  }

  // ==========================================
  // 5. BANGLE (Hand & Wrist)
  // ==========================================
  else if (type === 'Bangle') {
    let wristX = dims.containerW * (isMirrored ? 0.35 : 0.65);
    let wristY = dims.containerH * 0.75;
    let bangleWidth = interEyeDist * 1.3 * (config.scale || 1.0);
    let bangleAngle = headPose.roll * 0.4;

    if (hasPose) {
      const wristNorm = poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_WRIST] || poseLandmarks[POSE_LANDMARK_INDICES.LEFT_WRIST];
      const elbowNorm = poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_ELBOW] || poseLandmarks[POSE_LANDMARK_INDICES.LEFT_ELBOW];
      if (wristNorm) {
        const wr = normalizedToPixel(wristNorm, dims, isMirrored);
        bodyDetected = true;
        wristX = wr.x;
        wristY = wr.y;
        if (elbowNorm) {
          const el = normalizedToPixel(elbowNorm, dims, isMirrored);
          bangleAngle = (Math.atan2(wr.y - el.y, wr.x - el.x) * 180) / Math.PI;
          const armLen = Math.hypot(wr.x - el.x, wr.y - el.y);
          if (armLen > 30) bangleWidth = armLen * 0.5 * (config.scale || 1.0);
        }
      }
    }

    items.push({
      id: 'bangle',
      x: wristX,
      y: wristY,
      width: bangleWidth,
      height: bangleWidth * 0.8,
      rotation: bangleAngle,
      perspectiveScaleX: 1.0,
      visible: true,
      shadow: { offsetX: 2 * faceScale, offsetY: 4 * faceScale, blur: 8 * faceScale },
    });
  }

  // ==========================================
  // 6. SHOES (Legs & Feet)
  // ==========================================
  else if (type === 'Shoes') {
    let leftFootX = dims.containerW * 0.38;
    let rightFootX = dims.containerW * 0.62;
    let footY = dims.containerH * 0.85;
    let shoeWidth = interEyeDist * 1.4 * (config.scale || 1.0);

    if (hasPose && poseLandmarks[POSE_LANDMARK_INDICES.LEFT_ANKLE] && poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_ANKLE]) {
      const lAnkle = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.LEFT_ANKLE], dims, isMirrored);
      const rAnkle = normalizedToPixel(poseLandmarks[POSE_LANDMARK_INDICES.RIGHT_ANKLE], dims, isMirrored);
      bodyDetected = true;
      leftFootX = lAnkle.x;
      rightFootX = rAnkle.x;
      footY = (lAnkle.y + rAnkle.y) / 2;
      const ankleDist = Math.abs(rAnkle.x - lAnkle.x);
      if (ankleDist > 30) shoeWidth = ankleDist * 0.6 * (config.scale || 1.0);
    }

    items.push({
      id: 'shoe_left',
      x: leftFootX,
      y: footY,
      width: shoeWidth,
      height: shoeWidth * 0.6,
      rotation: 0,
      perspectiveScaleX: 1.0,
      visible: true,
      shadow: { offsetX: 0, offsetY: 6 * faceScale, blur: 10 * faceScale },
    });

    items.push({
      id: 'shoe_right',
      x: rightFootX,
      y: footY,
      width: shoeWidth,
      height: shoeWidth * 0.6,
      rotation: 0,
      perspectiveScaleX: 1.0,
      visible: true,
      shadow: { offsetX: 0, offsetY: 6 * faceScale, blur: 10 * faceScale },
    });
  }

  // ==========================================
  // 7. OTHER ACCESSORIES (General Placement)
  // ==========================================
  else {
    const itemWidth = interEyeDist * 2.0 * (config.scale || 1.0);

    items.push({
      id: 'other',
      x: nosePx.x,
      y: nosePx.y + faceHeight * 0.1,
      width: itemWidth,
      height: itemWidth,
      rotation: headPose.roll,
      perspectiveScaleX: Math.max(0.6, Math.cos(yawRad)),
      visible: true,
      shadow: { offsetX: 0, offsetY: 5 * faceScale, blur: 10 * faceScale },
    });
  }

  return {
    type,
    items,
    faceScale,
    bodyDetected,
  };
}
