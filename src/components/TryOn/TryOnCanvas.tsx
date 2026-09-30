import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { TrackingFrameResult } from '../../services/faceTracking';
import { RenderDimensions } from '../../utils/landmarkUtils';
import { Product } from '../../types';

export interface TryOnCanvasRef {
  generateCompositedSnapshot: () => string | null;
}

interface TryOnCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  overlayImgSrc: string;
  trackingResult: TrackingFrameResult | null;
  dims: RenderDimensions;
  isMirrored: boolean;
  opacity: number;
  blendMode: string;
  showDebug: boolean;
  showLandmarks: boolean;
  product: Product;
}

export const TryOnCanvas = forwardRef<TryOnCanvasRef, TryOnCanvasProps>(({
  videoRef,
  imageRef,
  overlayImgSrc,
  trackingResult,
  dims,
  isMirrored,
  opacity,
  blendMode,
  showDebug,
  showLandmarks,
  product,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedOverlayImgRef = useRef<HTMLImageElement | null>(null);

  // Preload overlay image
  useEffect(() => {
    if (!overlayImgSrc) {
      loadedOverlayImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedOverlayImgRef.current = img;
    };
    img.src = overlayImgSrc;
  }, [overlayImgSrc]);

  // Imperative handler for capturing crisp composited result photo (no debug UI)
  useImperativeHandle(ref, () => ({
    generateCompositedSnapshot: () => {
      const outputCanvas = document.createElement('canvas');
      const w = dims.containerW || 1080;
      const h = dims.containerH || 1080;
      outputCanvas.width = w;
      outputCanvas.height = h;

      const ctx = outputCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // 1. Draw source background (Video or Uploaded Selfie Image)
      let sourceMedia: HTMLVideoElement | HTMLImageElement | null = null;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        sourceMedia = videoRef.current;
      } else if (imageRef.current && imageRef.current.complete) {
        sourceMedia = imageRef.current;
      }

      if (sourceMedia) {
        ctx.save();
        if (isMirrored) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(sourceMedia, dims.offsetX, dims.offsetY, dims.renderW, dims.renderH);
        ctx.restore();
      }

      // 2. Draw Accessory overlay cleanly without debug points
      if (loadedOverlayImgRef.current && trackingResult && trackingResult.detected) {
        const overlayImg = loadedOverlayImgRef.current;
        const items = trackingResult.accessoryAnchors?.items || [];
        const tryType = product.tryOnType || 'Earrings';

        for (const item of items) {
          if (!item.visible) continue;
          const itemW = item.width;
          const itemH = (overlayImg.height / overlayImg.width) * itemW;

          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

          if (item.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = item.shadow.blur;
            ctx.shadowOffsetX = item.shadow.offsetX;
            ctx.shadowOffsetY = item.shadow.offsetY;
          }

          ctx.translate(item.x, item.y);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.perspectiveScaleX, 1.0);

          let offsetYPos = -itemH / 2;
          if (tryType === 'Earrings') offsetYPos = 0;
          else if (tryType === 'Necklace') offsetYPos = -itemH * 0.2;
          else if (tryType === 'Dress') offsetYPos = -itemH / 2;

          ctx.drawImage(overlayImg, -itemW / 2, offsetYPos, itemW, itemH);
          ctx.restore();
        }
      }

      return outputCanvas.toDataURL('image/png');
    },
  }));

  // Render Overlay Loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dims.containerW;
    canvas.height = dims.containerH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dims.containerW, dims.containerH);

    if (!trackingResult || !trackingResult.detected) {
      return;
    }

    const overlayImg = loadedOverlayImgRef.current;
    const items = trackingResult.accessoryAnchors?.items || [];
    const faceScale = trackingResult.anchors?.faceScale || 1.0;
    const tryType = product.tryOnType || 'Earrings';
    const bodyDetected = Boolean(trackingResult.accessoryAnchors?.bodyDetected);
    const activeFrameMode = trackingResult.accessoryAnchors?.frameMode || 'half';

    if (overlayImg && items.length > 0) {
      for (const item of items) {
        if (!item.visible) continue;
        const itemW = item.width;
        const itemH = (overlayImg.height / overlayImg.width) * itemW;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

        if (item.shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = item.shadow.blur;
          ctx.shadowOffsetX = item.shadow.offsetX;
          ctx.shadowOffsetY = item.shadow.offsetY;
        }

        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.scale(item.perspectiveScaleX, 1.0);

        let offsetYPos = -itemH / 2;
        if (tryType === 'Earrings') offsetYPos = 0;
        else if (tryType === 'Necklace') offsetYPos = -itemH * 0.2;
        else if (tryType === 'Dress') offsetYPos = -itemH / 2;

        ctx.drawImage(overlayImg, -itemW / 2, offsetYPos, itemW, itemH);
        ctx.restore();
      }
    }

    // Render Target Anchor Points & Skeleton Lines if enabled
    if (showLandmarks) {
      for (const item of items) {
        if (!item.visible) continue;
        ctx.save();
        
        if (tryType === 'Dress') {
          // Draw dress bounding frame & shoulder alignment guide
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
          ctx.setLineDash([]);

          // Shoulder & Center target dots
          ctx.beginPath();
          ctx.arc(item.x, item.y - item.height / 2.2, 7, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(item.x, item.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Render Debug Telemetry Overlay if enabled
    if (showDebug) {
      const { headPose, fps } = trackingResult;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(12, 12, 280, 130);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, 280, 130);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`★ AR TRY-ON DEBUG TELEMETRY`, 20, 28);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`Type: ${tryType} | Mode: ${activeFrameMode.toUpperCase()}`, 20, 45);
      ctx.fillText(`AI Pose Body Detected: ${bodyDetected ? 'YES (MediaPipe)' : 'NO (Face Mesh)'}`, 20, 60);
      ctx.fillText(`Face Scale: ${faceScale.toFixed(2)}x | FPS: ${fps}`, 20, 75);
      ctx.fillText(`Yaw: ${headPose.yaw.toFixed(1)}° | Pitch: ${headPose.pitch.toFixed(1)}°`, 20, 90);
      ctx.fillText(`Roll: ${headPose.roll.toFixed(1)}° | Mirror: ${isMirrored ? 'YES' : 'NO'}`, 20, 105);
      ctx.fillText(`Items Tracked: ${items.filter(i => i.visible).length}/${items.length}`, 20, 120);

      ctx.restore();
    }
  }, [trackingResult, dims, opacity, blendMode, showDebug, showLandmarks, product, isMirrored]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none w-full h-full"
    />
  );
});
