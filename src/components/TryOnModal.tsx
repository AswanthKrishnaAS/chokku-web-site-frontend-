import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Camera, Upload, RefreshCw, RotateCcw, 
  Sparkles, AlertCircle, ArrowRight, ShieldCheck, Check,
  Sliders, Cpu, Scan, AlertTriangle, Maximize2, Minimize2, Download, Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';
import { FaceLandmarkerService } from '../services/faceLandmarker';
import { PoseLandmarkerService } from '../services/poseLandmarker';
import { HandLandmarkerService, getHandAccessoryAnchorPoints } from '../services/handLandmarker';
import { FaceTrackingPipeline, TrackingFrameResult } from '../services/faceTracking';
import { getRenderDimensions, RenderDimensions, Landmark } from '../utils/landmarkUtils';
import { TryOnCanvas, TryOnCanvasRef } from './TryOn/TryOnCanvas';
import { TryOnControls } from './TryOn/TryOnControls';
import { FrameMode } from '../services/accessoryTransform';
import { getTryOnEngine, TryOnEngineType } from '../services/tryOnEngineRouter';

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedProductImage?: string;
}

export const TryOnModal: React.FC<TryOnModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [sourceType, setSourceType] = useState<'camera' | 'upload' | null>(null);
  
  // User base photo state
  const [userImage, setUserImage] = useState<string | null>(null);
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Tracking & AI Model Loading State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiLoaded, setIsAiLoaded] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingFrameResult | null>(null);
  
  // Clothing AI VTON Service State
  const [isGeneratingVton, setIsGeneratingVton] = useState(false);
  const [vtonResultImage, setVtonResultImage] = useState<string | null>(null);
  const [vtonError, setVtonError] = useState<string | null>(null);

  // Frame mode (Half Frame vs Full Body for Dress)
  const [frameMode, setFrameMode] = useState<FrameMode>('auto');

  // Visual Target Points & Debug Controls
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  // Calibration parameters (initialized from product size model)
  const initialScale = product?.tryOnScale ?? (product?.tryOnSize === 'Small' ? 0.75 : product?.tryOnSize === 'Large' ? 1.35 : 1.0);
  const [earringScale, setEarringScale] = useState<number>(initialScale);
  const opacity = 0.95;
  const blendMode = 'normal';

  // Display Render Dimensions
  const [renderDims, setRenderDims] = useState<RenderDimensions>({
    renderW: 640,
    renderH: 480,
    offsetX: 0,
    offsetY: 0,
    containerW: 640,
    containerH: 480,
  });

  // Try On Engine Type
  const categoryStr = product?.tryOnCategory || product?.tryOnType || 'Earrings';
  const engineType: TryOnEngineType = getTryOnEngine(categoryStr);

  // Try On Images Selector
  const tryOnImagesList = Boolean(product?.tryOn || product?.tryOnEnabled) && (
    (Array.isArray(product?.tryOnImages) && product.tryOnImages.length > 0)
      ? product.tryOnImages
      : product?.tryOnImage ? [product.tryOnImage] : [product?.image]
  ) || [];

  const [selectedTryOnIndex, setSelectedTryOnIndex] = useState<number>(0);
  const overlayImgSrc = tryOnImagesList[selectedTryOnIndex] || tryOnImagesList[0] || product?.image || '';

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uploadedImgRef = useRef<HTMLImageElement | null>(null);
  const tryOnCanvasRef = useRef<TryOnCanvasRef | null>(null);

  // Pipeline service ref
  const pipelineRef = useRef<FaceTrackingPipeline>(new FaceTrackingPipeline());

  const isMirroredCamera = facingMode === 'user' && isCameraActive;

  // Cleanup camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('hide-bottom-nav');
    } else {
      document.body.classList.remove('hide-bottom-nav');
      stopCameraStream();
      setSourceType(null);
      setUserImage(null);
      setVtonResultImage(null);
      setVtonError(null);
      setIsGeneratingVton(false);
      setSelectedTryOnIndex(0);
      setTrackingResult(null);
      pipelineRef.current.reset();
    }
    return () => {
      document.body.classList.remove('hide-bottom-nav');
    };
  }, [isOpen, stopCameraStream]);

  // Handle switching camera mode
  useEffect(() => {
    if (sourceType === 'camera' && isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Update container display dimensions on resize or media change
  const updateRenderDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    let mediaW = 640;
    let mediaH = 480;

    if (videoRef.current && videoRef.current.videoWidth) {
      mediaW = videoRef.current.videoWidth;
      mediaH = videoRef.current.videoHeight;
    } else if (uploadedImgRef.current && uploadedImgRef.current.naturalWidth) {
      mediaW = uploadedImgRef.current.naturalWidth;
      mediaH = uploadedImgRef.current.naturalHeight;
    }

    const dims = getRenderDimensions(containerW, containerH, mediaW, mediaH);
    setRenderDims(dims);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateRenderDimensions);
    return () => window.removeEventListener('resize', updateRenderDimensions);
  }, [updateRenderDimensions]);

  // Real-time AI Tracking Loop (Face, Pose, Hand Landmarkers)
  useEffect(() => {
    if (!isOpen || (!isCameraActive && !userImage)) {
      return;
    }

    let animFrameId: number;
    let isCancelled = false;

    setIsAiLoading(true);

    const faceService = FaceLandmarkerService.getInstance();
    const poseService = PoseLandmarkerService.getInstance();
    const handService = HandLandmarkerService.getInstance();

    const initPromises: Promise<boolean>[] = [
      faceService.initialize(),
      poseService.initialize(),
    ];

    if (engineType === 'hand-engine') {
      initPromises.push(handService.initialize());
    }

    Promise.all(initPromises).then((results) => {
      if (isCancelled) return;
      setIsAiLoading(false);
      const isAnyOk = results.some(Boolean);
      setIsAiLoaded(isAnyOk);

      if (!isAnyOk) {
        console.warn('AI tracking models initialization failed.');
        return;
      }

      let latestFaceLandmarks: Landmark[][] | null = null;
      let latestPoseLandmarks: Landmark[] | null = null;
      let latestHandLandmarks: Landmark[][] | null = null;

      const triggerPipeline = () => {
        if (isCancelled) return;
        updateRenderDimensions();

        const currentDims = containerRef.current ? {
          renderW: renderDims.renderW,
          renderH: renderDims.renderH,
          offsetX: renderDims.offsetX,
          offsetY: renderDims.offsetY,
          containerW: containerRef.current.clientWidth,
          containerH: containerRef.current.clientHeight,
        } : renderDims;

        const config = {
          tryOnType: (product?.tryOnCategory || product?.tryOnType || 'Earrings') as any,
          scale: earringScale,
          frameMode: frameMode,
        };

        if (engineType === 'hand-engine' && latestHandLandmarks && latestHandLandmarks.length > 0) {
          const handAnchors = getHandAccessoryAnchorPoints(
            latestHandLandmarks[0],
            currentDims,
            { yaw: 0, pitch: 0, roll: 0 },
            config,
            isMirroredCamera
          );
          setTrackingResult({
            detected: true,
            primaryFace: false,
            landmarks: null,
            headPose: { yaw: 0, pitch: 0, roll: 0 },
            anchors: { left: null, right: null, faceScale: 1.0 },
            accessoryAnchors: handAnchors,
            fps: 30,
          });
        } else {
          const result = pipelineRef.current.processLandmarks(
            latestFaceLandmarks,
            currentDims,
            config,
            isMirroredCamera,
            latestPoseLandmarks
          );
          setTrackingResult(result);
        }
      };

      faceService.setOnResultsCallback((multiLandmarks) => {
        latestFaceLandmarks = multiLandmarks;
        triggerPipeline();
      });

      poseService.setOnResultsCallback((poseLandmarks) => {
        latestPoseLandmarks = poseLandmarks;
        triggerPipeline();
      });

      if (engineType === 'hand-engine') {
        handService.setOnResultsCallback((multiHands) => {
          latestHandLandmarks = multiHands;
          triggerPipeline();
        });
      }

      // Processing Loop for Camera Stream
      const processFrameLoop = async () => {
        if (isCancelled) return;
        if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
          await faceService.sendFrame(videoRef.current);
          await poseService.sendFrame(videoRef.current);
          if (engineType === 'hand-engine') {
            await handService.sendFrame(videoRef.current);
          }
        }
        animFrameId = requestAnimationFrame(processFrameLoop);
      };

      // Static Image Processing
      if (userImage && uploadedImgRef.current) {
        const processStatic = async () => {
          if (uploadedImgRef.current && uploadedImgRef.current.complete) {
            await faceService.sendFrame(uploadedImgRef.current);
            await poseService.sendFrame(uploadedImgRef.current);
            if (engineType === 'hand-engine') {
              await handService.sendFrame(uploadedImgRef.current);
            }
          }
        };
        processStatic();
      } else if (isCameraActive) {
        processFrameLoop();
      }
    });

    return () => {
      isCancelled = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [
    isOpen,
    isCameraActive,
    userImage,
    facingMode,
    earringScale,
    frameMode,
    product,
    engineType,
    isMirroredCamera,
    updateRenderDimensions,
    renderDims,
  ]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    stopCameraStream();
    setSourceType('camera');
    setIsCameraActive(true);
    setUserImage(null);
    setVtonResultImage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      setCameraError(
        err.message || 'Unable to access camera. Please check browser permissions or upload a photo.'
      );
      setIsCameraActive(false);
    }
  };

  // Trigger Python AI Virtual Try-On for Clothing
  const triggerClothingVtonAI = async (baseUserPhotoUrl: string) => {
    if (engineType !== 'clothing-engine') return;

    setIsGeneratingVton(true);
    setVtonError(null);

    try {
      const response = await fetch('/api/try-on/clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_image: baseUserPhotoUrl,
          product_image: overlayImgSrc || product.image,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setVtonResultImage(data.result);
      } else {
        console.warn('VTON Fallback to AR Overlay:', data.message);
        setVtonError(data.message || 'AI Clothing Try-On service unavailable');
      }
    } catch (err: any) {
      console.error('Clothing VTON AI fetch error:', err);
      setVtonError('AI Clothing service offline. Displaying Real-Time AR Overlay.');
    } finally {
      setIsGeneratingVton(false);
    }
  };

  // Capture Camera Snapshot
  const captureCameraSnapshot = () => {
    if (tryOnCanvasRef.current) {
      const snapshot = tryOnCanvasRef.current.generateCompositedSnapshot();
      if (snapshot) {
        setUserImage(snapshot);
        stopCameraStream();
        setSourceType('upload');
        if (engineType === 'clothing-engine') {
          triggerClothingVtonAI(snapshot);
        }
      }
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const photoUrl = event.target.result as string;
          stopCameraStream();
          setUserImage(photoUrl);
          setSourceType('upload');
          if (engineType === 'clothing-engine') {
            triggerClothingVtonAI(photoUrl);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Download final photo snapshot
  const downloadSnapshot = () => {
    const dataUrl = vtonResultImage || (tryOnCanvasRef.current ? tryOnCanvasRef.current.generateCompositedSnapshot() : null) || userImage;
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `tryon-${product.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  if (!isOpen || !(product?.tryOn || product?.tryOnEnabled)) return null;

  // Real-Time Try-On Experience Screen (Camera or Uploaded Image or AI Generated Result)
  if (isCameraActive || userImage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between w-full h-full overflow-hidden select-none animate-fadeIn">
        
        {/* Top Control Bar with AI Status & Close */}
        <div className="absolute top-4 inset-x-4 z-50 flex items-center justify-between pointer-events-none">
          
          {/* AI Tracking Status HUD */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-lg transition-all ${
              isGeneratingVton || isAiLoading
                ? 'bg-amber-950/80 border-amber-400/50 text-amber-200'
                : trackingResult?.detected || vtonResultImage
                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}>
              <div className="relative flex items-center justify-center">
                {isGeneratingVton || isAiLoading ? (
                  <Scan className="w-4 h-4 text-amber-400 animate-spin" />
                ) : trackingResult?.detected || vtonResultImage ? (
                  <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                )}
              </div>
              
              <span className="text-[11px] font-black uppercase tracking-wide">
                {isGeneratingVton
                  ? 'Creating your AI Try-On...'
                  : isAiLoading
                  ? 'Preparing Virtual Try-On...'
                  : trackingResult?.detected || vtonResultImage
                  ? `${product?.tryOnCategory || product?.tryOnType || 'Product'} AR Active`
                  : `Position inside Frame`}
              </span>
            </div>

            {/* Engine Pill Badge */}
            <div className="px-3 py-1.5 rounded-full bg-slate-900/80 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" /> {engineType}
            </div>

            {/* Debug Mode Quick Toggle */}
            <button
              onClick={() => setShowDebug((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md pointer-events-auto border ${
                showDebug ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-black/60 text-gray-300 border-white/20 hover:bg-black/80'
              }`}
              title="Toggle Telemetry HUD"
            >
              <Cpu className="w-3 h-3" /> {showDebug ? 'HUD ON' : 'HUD'}
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all cursor-pointer border border-white/20 shadow-lg pointer-events-auto"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Container: AI Generated VTON Result OR Live Video / Upload + Canvas Overlay */}
        <div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
        >
          {isGeneratingVton ? (
            /* Generating AI Try-On Loading Screen */
            <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
                <Sparkles className="w-10 h-10 text-amber-300 absolute animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Creating your AI Try-On...</h3>
              <p className="text-xs text-gray-400 max-w-sm font-medium">
                Fitting <span className="text-amber-300 font-extrabold">{product.name}</span> onto your photo using Open-Source Virtual Try-On AI.
              </p>
            </div>
          ) : vtonResultImage ? (
            /* AI Generated Try-On Result View */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={vtonResultImage}
                alt="AI Try-On Result"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-16 left-6 bg-emerald-950/90 border border-emerald-400/60 px-3.5 py-1.5 rounded-full text-emerald-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-4 h-4 text-emerald-400" /> AI Virtual Try-On Result
              </div>
            </div>
          ) : (
            /* AR Canvas Live Video / Photo overlay */
            <>
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={updateRenderDimensions}
                  className={`w-full h-full object-cover ${isMirroredCamera ? 'scale-x-[-1]' : ''}`}
                />
              ) : userImage ? (
                <img
                  ref={uploadedImgRef}
                  src={userImage}
                  alt="User selfie"
                  onLoad={updateRenderDimensions}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : null}

              <TryOnCanvas
                ref={tryOnCanvasRef}
                videoRef={videoRef}
                imageRef={uploadedImgRef}
                overlayImgSrc={overlayImgSrc}
                trackingResult={trackingResult}
                dims={renderDims}
                isMirrored={isMirroredCamera}
                opacity={opacity}
                blendMode={blendMode}
                showDebug={showDebug}
                showLandmarks={showLandmarks}
                product={product}
              />
            </>
          )}

          {vtonError && (
            <div className="absolute top-20 inset-x-6 z-40 bg-amber-950/90 border border-amber-500/50 p-3 rounded-2xl text-amber-200 text-xs font-bold text-center">
              ⚠️ {vtonError}
            </div>
          )}
        </div>

        {/* Collapsible Fine-Tuning Drawer */}
        {showControlsDrawer && (
          <TryOnControls
            product={product}
            earringScale={earringScale}
            setEarringScale={setEarringScale}
            frameMode={frameMode}
            setFrameMode={setFrameMode}
            showLandmarks={showLandmarks}
            setShowLandmarks={setShowLandmarks}
            showDebug={showDebug}
            setShowDebug={setShowDebug}
            onClose={() => setShowControlsDrawer(false)}
          />
        )}

        {/* Bottom Control Actions */}
        {isCameraActive ? (
          <div className="absolute bottom-8 inset-x-0 z-40 flex items-center justify-around sm:justify-center sm:gap-12 px-6 pointer-events-auto">
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all cursor-pointer shadow-lg"
              title="Flip camera"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={captureCameraSnapshot}
              className="w-20 h-20 rounded-full border-4 border-white p-1.5 flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-2xl"
              title="Take photo"
            >
              <div className="w-full h-full bg-white rounded-full shadow-inner" />
            </button>

            <button
              onClick={() => setShowControlsDrawer((prev) => !prev)}
              className={`w-12 h-12 rounded-full backdrop-blur-md border text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-lg ${
                showControlsDrawer ? 'bg-emerald-500 border-emerald-300' : 'bg-black/40 border-white/20 hover:bg-black/60'
              }`}
              title="Adjust Alignment"
            >
              <Sliders className="w-5 h-5 text-white" />
            </button>
          </div>
        ) : (
          /* Review / Save Controls */
          <div className="absolute bottom-8 inset-x-0 z-40 flex items-center justify-around sm:justify-center sm:gap-8 px-6 pointer-events-auto">
            <button
              onClick={() => {
                setUserImage(null);
                setVtonResultImage(null);
                startCamera();
              }}
              className="px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>

            <button
              onClick={downloadSnapshot}
              className="px-6 py-3.5 rounded-full bg-[#01589D] text-white text-xs font-black tracking-wide uppercase flex items-center gap-2 shadow-xl shadow-blue-600/40 active:scale-95 transition-all cursor-pointer border-2 border-white/30"
            >
              <Download className="w-4 h-4" /> Save Image
            </button>
          </div>
        )}

      </div>
    );
  }

  // Source Selection Modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-white sm:bg-black/60 sm:backdrop-blur-sm p-0 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
      <div className="relative bg-white text-gray-900 shadow-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-xl md:max-w-4xl rounded-none sm:rounded-3xl overflow-hidden flex flex-col border-0 sm:border border-gray-100">
        
        <div className="relative flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#64A901] text-white shadow-md shadow-[#64A901]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-base sm:text-xl tracking-tight leading-tight flex items-center gap-2 text-gray-900 truncate">
                Virtual AI Try-On Room
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#eef5fb] text-[#01589D] flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-[#01589D]" /> {engineType.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                Trying on: <span className="font-extrabold text-[#01589D]">{product.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 bg-white z-10">
          <div className="py-4 sm:py-6 px-1 sm:px-4 max-w-xl mx-auto space-y-6 w-full flex flex-col items-stretch">
            
            <div className="text-center space-y-1.5">
              <h4 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                How would you like to <span className="text-[#64A901]">try this on?</span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Select your camera or upload a photo for automatic AI tracking.
              </p>
            </div>

            {cameraError && (
              <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">Camera Access Error</p>
                  <p className="text-amber-700 mt-0.5">{cameraError}</p>
                </div>
              </div>
            )}

            {/* 1. Live Camera Button */}
            <button
              onClick={startCamera}
              className="w-full group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#64A901] via-[#3B9241] to-[#01589D] text-white shadow-lg hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between min-h-[170px] sm:min-h-[190px] cursor-pointer overflow-hidden border border-white/20 box-border"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#1d5830]/80 text-white backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE AI STREAM
                </span>
              </div>

              <div className="flex items-end justify-between gap-3 mt-4">
                <div>
                  <h5 className="font-black text-lg sm:text-xl text-white">Use Camera</h5>
                  <p className="text-xs text-white/90 font-medium mt-1">
                    Align your body inside frame for real-time AI tracking.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white text-[#01589D] flex items-center justify-center shadow-md shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </button>

            {/* OR Divider */}
            <div className="w-full relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <span className="relative bg-[#eef5fb] text-[#01589D] font-extrabold text-[11px] px-3.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                OR
              </span>
            </div>

            {/* 2. Upload Photo Card */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full group relative p-5 sm:p-6 rounded-3xl bg-white/60 border-2 border-dashed border-[#d0e3f5] hover:border-[#01589D] text-gray-900 shadow-2xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between min-h-[170px] sm:min-h-[190px] cursor-pointer overflow-hidden box-border"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-[#eef5fb] rounded-2xl flex items-center justify-center text-[#01589D] group-hover:bg-[#01589D] group-hover:text-white transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold bg-[#eef5fb] text-[#01589D] px-4 py-1.5 rounded-full border border-blue-100 group-hover:bg-[#01589D] group-hover:text-white transition-colors">
                  Browse Files
                </span>
              </div>
              <div className="mt-4">
                <h5 className="font-black text-lg sm:text-xl text-gray-900">Upload Photo</h5>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Choose any photo from your device.
                </p>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default TryOnModal;
