export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface RenderDimensions {
  renderW: number;
  renderH: number;
  offsetX: number;
  offsetY: number;
  containerW: number;
  containerH: number;
}

// MediaPipe 468 Landmark Indices for key facial features
export const LANDMARK_INDICES = {
  NOSE_TIP: 1,
  NOSE_BRIDGE: 6,
  FOREHEAD: 10,
  CHIN: 152,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  // Left Ear Nodes
  LEFT_EAR_LOBE: 177,
  LEFT_EAR_BASE: 132,
  LEFT_EAR_TRAGUS: 234,
  LEFT_EAR_TOP: 127,
  // Right Ear Nodes
  RIGHT_EAR_LOBE: 401,
  RIGHT_EAR_BASE: 361,
  RIGHT_EAR_TRAGUS: 454,
  RIGHT_EAR_TOP: 356,
};

export const POSE_LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Calculates rendered dimensions for object-fit: cover display mode.
 */
export function getRenderDimensions(
  containerW: number,
  containerH: number,
  mediaW: number,
  mediaH: number
): RenderDimensions {
  if (!containerW || !containerH || !mediaW || !mediaH) {
    return {
      renderW: containerW || 640,
      renderH: containerH || 480,
      offsetX: 0,
      offsetY: 0,
      containerW: containerW || 640,
      containerH: containerH || 480,
    };
  }

  const mediaRatio = mediaW / mediaH;
  const containerRatio = containerW / containerH;

  let renderW = containerW;
  let renderH = containerH;
  let offsetX = 0;
  let offsetY = 0;

  if (containerRatio > mediaRatio) {
    renderW = containerW;
    renderH = containerW / mediaRatio;
    offsetY = (containerH - renderH) / 2;
  } else {
    renderH = containerH;
    renderW = containerH * mediaRatio;
    offsetX = (containerW - renderW) / 2;
  }

  return {
    renderW,
    renderH,
    offsetX,
    offsetY,
    containerW,
    containerH,
  };
}

/**
 * Maps a normalized MediaPipe landmark (0..1) to actual pixel coordinates on container canvas,
 * accounting for object-fit: cover offset and horizontal camera mirroring.
 */
export function normalizedToPixel(
  landmark: Landmark,
  dims: RenderDimensions,
  isMirrored: boolean = false
): { x: number; y: number; z: number } {
  const normX = landmark.x;
  const normY = landmark.y;

  const posXInRender = normX * dims.renderW;
  const finalX = dims.offsetX + (isMirrored ? dims.renderW - posXInRender : posXInRender);
  const finalY = dims.offsetY + normY * dims.renderH;
  // Preserve scaled z relative to face scale in pixels
  const finalZ = landmark.z * dims.renderW;

  return { x: finalX, y: finalY, z: finalZ };
}

/**
 * Selects the primary face (largest bounding box area) if multiple faces are detected.
 */
export function selectPrimaryFace(multiFaceLandmarks: Landmark[][]): Landmark[] | null {
  if (!multiFaceLandmarks || multiFaceLandmarks.length === 0) return null;
  if (multiFaceLandmarks.length === 1) return multiFaceLandmarks[0];

  let maxArea = -1;
  let primaryFace = multiFaceLandmarks[0];

  for (const face of multiFaceLandmarks) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const lm of face) {
      if (lm.x < minX) minX = lm.x;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.y > maxY) maxY = lm.y;
    }

    const area = (maxX - minX) * (maxY - minY);
    if (area > maxArea) {
      maxArea = area;
      primaryFace = face;
    }
  }

  return primaryFace;
}
