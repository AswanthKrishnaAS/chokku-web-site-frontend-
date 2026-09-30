export type TryOnEngineType = 'accessory-engine' | 'hand-engine' | 'clothing-engine' | 'footwear-engine';

/**
 * Returns the appropriate Try-On engine based on the product category or tryOnType.
 */
export function getTryOnEngine(categoryOrType: string): TryOnEngineType {
  const norm = (categoryOrType || '').toLowerCase().trim();

  // 1. Hand Engine (MediaPipe Hands)
  if (['ring', 'bracelet', 'bangle', 'hand-chain', 'hand chain'].includes(norm)) {
    return 'hand-engine';
  }

  // 2. Clothing Engine (Python AI Service / Open-Source VTON)
  if (['dress', 'shirt', 'top', 'bottom', 'clothing', 'apparel'].includes(norm)) {
    return 'clothing-engine';
  }

  // 3. Footwear Engine (Pose/Foot tracking or AI Photo VTON)
  if (['shoes', 'footwear', 'sneakers'].includes(norm)) {
    return 'footwear-engine';
  }

  // 4. Accessory Engine (MediaPipe Face & Pose) - Default for Earrings, Glasses, Necklace, Chain, etc.
  return 'accessory-engine';
}
