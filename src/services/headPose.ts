import { Landmark, LANDMARK_INDICES } from '../utils/landmarkUtils';

export interface HeadPose {
  yaw: number;   // Head turn left/right (-90 to +90 deg)
  pitch: number; // Head tilt up/down (-45 to +45 deg)
  roll: number;  // Head tilt left/right (-180 to +180 deg)
}

/**
 * Calculates 3D Head Pose Angles (Yaw, Pitch, Roll) from MediaPipe 3D face landmarks.
 */
export function calculateHeadPose(landmarks: Landmark[]): HeadPose {
  if (!landmarks || landmarks.length < 468) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const nose = landmarks[LANDMARK_INDICES.NOSE_TIP] || landmarks[1];
  const forehead = landmarks[LANDMARK_INDICES.FOREHEAD] || landmarks[10];
  const chin = landmarks[LANDMARK_INDICES.CHIN] || landmarks[152];
  const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER] || landmarks[33];
  const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER] || landmarks[263];

  // 1. Roll: Angle between left eye and right eye in screen plane
  const dxEye = rightEye.x - leftEye.x;
  const dyEye = rightEye.y - leftEye.y;
  const rollRad = Math.atan2(dyEye, dxEye);
  const roll = (rollRad * 180) / Math.PI;

  // 2. Yaw: Asymmetry between nose-to-left-eye and nose-to-right-eye distances
  const distLeft = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
  const distRight = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);
  const totalDist = distLeft + distRight;

  let yaw = 0;
  if (totalDist > 0) {
    const ratio = (distRight - distLeft) / totalDist;
    const clampedRatio = Math.max(-1, Math.min(1, ratio * 1.8)); // Sensitivity factor
    yaw = Math.asin(clampedRatio) * (180 / Math.PI);
  }

  // 3. Pitch: Asymmetry between nose-to-forehead and nose-to-chin vertical distances
  const distTop = Math.abs(nose.y - forehead.y);
  const distBottom = Math.abs(chin.y - nose.y);
  const totalVert = distTop + distBottom;

  let pitch = 0;
  if (totalVert > 0) {
    const vertRatio = (distBottom - distTop) / totalVert;
    pitch = vertRatio * 45; // Map to approximate degrees
  }

  return { yaw, pitch, roll };
}
