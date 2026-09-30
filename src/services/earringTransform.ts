import { Landmark, RenderDimensions, normalizedToPixel, LANDMARK_INDICES } from '../utils/landmarkUtils';
import { HeadPose } from './headPose';

export interface EarAnchor {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  perspectiveScaleX: number;
  visible: boolean;
  shadow: {
    offsetX: number;
    offsetY: number;
    blur: number;
    opacity: number;
  };
}

export interface ProductTryOnConfig {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotationOffset: number;
  tryOnWidth?: number;
  tryOnHeight?: number;
}

export interface EarringAnchors {
  left: EarAnchor | null;
  right: EarAnchor | null;
  faceScale: number;
}

/**
 * Calculates accurate 3D-oriented ear anchor points for left and right earrings.
 */
export function getEarringAnchorPoints(
  landmarks: Landmark[],
  dims: RenderDimensions,
  headPose: HeadPose,
  config: ProductTryOnConfig,
  isMirrored: boolean = false
): EarringAnchors {
  if (!landmarks || landmarks.length < 468) {
    return { left: null, right: null, faceScale: 1.0 };
  }

  // Key facial landmarks
  const nose = landmarks[LANDMARK_INDICES.NOSE_TIP] || landmarks[1];
  const lEye = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER] || landmarks[33];
  const rEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER] || landmarks[263];

  const lEyePx = normalizedToPixel(lEye, dims, isMirrored);
  const rEyePx = normalizedToPixel(rEye, dims, isMirrored);
  const nosePx = normalizedToPixel(nose, dims, isMirrored);

  // Face scale based on inter-eye pixel distance (baseline 110px)
  const interEyeDist = Math.hypot(rEyePx.x - lEyePx.x, rEyePx.y - lEyePx.y);
  const faceScale = Math.max(0.3, Math.min(3.5, interEyeDist / 110.0));

  // --- LEFT EAR CALCULATIONS ---
  const lLobeNorm = landmarks[LANDMARK_INDICES.LEFT_EAR_LOBE] || landmarks[132] || landmarks[234];
  const lTopNorm = landmarks[LANDMARK_INDICES.LEFT_EAR_TOP] || landmarks[127];
  const lTragusNorm = landmarks[LANDMARK_INDICES.LEFT_EAR_TRAGUS] || landmarks[234];

  const lLobePx = normalizedToPixel(lLobeNorm, dims, isMirrored);
  const lTopPx = normalizedToPixel(lTopNorm, dims, isMirrored);

  // Angle along ear axis (from top margin to lobe)
  const lEarAngle = (Math.atan2(lLobePx.y - lTopPx.y, lLobePx.x - lTopPx.x) * 180) / Math.PI - 90;

  // Check left ear visibility / head turn occlusion
  // In mirrored mode, left/right coordinates flip visually
  const isTurningHeadRight = isMirrored ? headPose.yaw < -15 : headPose.yaw > 15;
  const isLeftOccluded = isTurningHeadRight && (
    isMirrored ? lLobePx.x < nosePx.x + 10 : lLobePx.x > nosePx.x - 10
  );

  const isLeftInFrame =
    lLobePx.x >= 5 &&
    lLobePx.x <= dims.containerW - 5 &&
    lLobePx.y >= 5 &&
    lLobePx.y <= dims.containerH - 5;

  const leftVisible = !isLeftOccluded && isLeftInFrame;

  // Perspective squeeze for left ear when angled away
  const yawRad = (headPose.yaw * Math.PI) / 180;
  const leftPerspectiveScaleX = isTurningHeadRight
    ? Math.max(0.25, Math.cos(yawRad))
    : Math.min(1.1, 1.0 + Math.abs(Math.sin(yawRad)) * 0.15);

  // Apply calibration offsets
  const leftX = lLobePx.x + (isMirrored ? -config.offsetX : config.offsetX) * faceScale;
  const leftY = lLobePx.y + config.offsetY * faceScale;
  const leftRotation = lEarAngle + config.rotationOffset;

  const leftAnchor: EarAnchor = {
    x: leftX,
    y: leftY,
    rotation: leftRotation,
    scale: faceScale * (config.scale || 1.0),
    perspectiveScaleX: leftPerspectiveScaleX,
    visible: leftVisible,
    shadow: {
      offsetX: Math.cos((leftRotation * Math.PI) / 180) * 3 * faceScale,
      offsetY: 4 * faceScale,
      blur: 8 * faceScale,
      opacity: 0.35,
    },
  };

  // --- RIGHT EAR CALCULATIONS ---
  const rLobeNorm = landmarks[LANDMARK_INDICES.RIGHT_EAR_LOBE] || landmarks[361] || landmarks[454];
  const rTopNorm = landmarks[LANDMARK_INDICES.RIGHT_EAR_TOP] || landmarks[356];
  const rTragusNorm = landmarks[LANDMARK_INDICES.RIGHT_EAR_TRAGUS] || landmarks[454];

  const rLobePx = normalizedToPixel(rLobeNorm, dims, isMirrored);
  const rTopPx = normalizedToPixel(rTopNorm, dims, isMirrored);

  const rEarAngle = (Math.atan2(rLobePx.y - rTopPx.y, rLobePx.x - rTopPx.x) * 180) / Math.PI - 90;

  const isTurningHeadLeft = isMirrored ? headPose.yaw > 15 : headPose.yaw < -15;
  const isRightOccluded = isTurningHeadLeft && (
    isMirrored ? rLobePx.x > nosePx.x - 10 : rLobePx.x < nosePx.x + 10
  );

  const isRightInFrame =
    rLobePx.x >= 5 &&
    rLobePx.x <= dims.containerW - 5 &&
    rLobePx.y >= 5 &&
    rLobePx.y <= dims.containerH - 5;

  const rightVisible = !isRightOccluded && isRightInFrame;

  const rightPerspectiveScaleX = isTurningHeadLeft
    ? Math.max(0.25, Math.cos(yawRad))
    : Math.min(1.1, 1.0 + Math.abs(Math.sin(yawRad)) * 0.15);

  const rightX = rLobePx.x + (isMirrored ? config.offsetX : -config.offsetX) * faceScale;
  const rightY = rLobePx.y + config.offsetY * faceScale;
  const rightRotation = rEarAngle + config.rotationOffset;

  const rightAnchor: EarAnchor = {
    x: rightX,
    y: rightY,
    rotation: rightRotation,
    scale: faceScale * (config.scale || 1.0),
    perspectiveScaleX: rightPerspectiveScaleX,
    visible: rightVisible,
    shadow: {
      offsetX: Math.cos((rightRotation * Math.PI) / 180) * 3 * faceScale,
      offsetY: 4 * faceScale,
      blur: 8 * faceScale,
      opacity: 0.35,
    },
  };

  return {
    left: leftAnchor,
    right: rightAnchor,
    faceScale,
  };
}
