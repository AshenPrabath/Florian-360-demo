// src/pages/TourPage.jsx
import React, {
  useState,
  Suspense,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { DeviceOrientationControls, OrbitControls } from "@react-three/drei";

import PanoramaSphere from "../components/tour/PanoramaSphere";
import CameraController from "../components/tour/CameraController";
import HierarchicalNavigation from "../components/navigation/HierarchicalNavigation";
import BreadcrumbNavigation from "../components/navigation/BreadcrumbNavigation";
import TourControls from "../components/navigation/TourControls";
import { Navigation, Map, Home, Volume2, Compass } from "lucide-react";
import { LOCATIONS } from "../data/locations";
import { useNavigate } from "react-router-dom";
import SoundToggleButton from "../components/common/SoundToggleButton";

function ZoomSmoother({ targetFovRef, currentFovRef, controlsRef, setZoomLevel, zoomDebounceRef }) {
  useFrame(() => {
    const diff = targetFovRef.current - currentFovRef.current;
    if (Math.abs(diff) > 0.05) {
      currentFovRef.current += diff * 0.12; // Lower is smoother/slower momentum
      
      if (controlsRef.current && controlsRef.current.object) {
        controlsRef.current.object.fov = currentFovRef.current;
        controlsRef.current.object.updateProjectionMatrix();
      }

      if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current);
      zoomDebounceRef.current = setTimeout(() => {
        setZoomLevel(currentFovRef.current);
      }, 50);
    } else if (Math.abs(diff) > 0 && Math.abs(diff) <= 0.05) {
      currentFovRef.current = targetFovRef.current;
      if (controlsRef.current && controlsRef.current.object) {
        controlsRef.current.object.fov = currentFovRef.current;
        controlsRef.current.object.updateProjectionMatrix();
      }
      setZoomLevel(currentFovRef.current);
    }
  });
  return null;
}

function TourPage() {
  const [currentLocationId, setCurrentLocationId] = useState("living");
  const [currentViewpointId, setCurrentViewpointId] =
    useState("living_entrance");
  const [userDirection, setUserDirection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [isGyroSupported, setIsGyroSupported] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(75); // Default FOV
  const [isZooming, setIsZooming] = useState(false);
  const controlsRef = useRef();
  const zoomAnimationRef = useRef(null);
  const navigate = useNavigate();


  // Zoom limits
  const MIN_FOV = 30; // Maximum zoom in
  const MAX_FOV = 120; // Maximum zoom out
  const ZOOM_STEP = 10; // Zoom increment

  const currentLocation = LOCATIONS[currentLocationId];
  const currentViewpoint =
    currentLocation.viewpoints.find((v) => v.id === currentViewpointId) ||
    currentLocation.viewpoints[0];

  const navigateToViewpoint = (locationId, viewpointId, skipVideo = false) => {
    if (
      LOCATIONS[locationId] &&
      (locationId !== currentLocationId || viewpointId !== currentViewpointId)
    ) {
      const currentLoc = LOCATIONS[currentLocationId];
      const currentVp = currentLoc.viewpoints.find(
        (v) => v.id === currentViewpointId
      );

      const hotspot = currentVp?.hotspots?.find(
        (h) => h.target === locationId && h.targetViewpoint === viewpointId
      );

      const transitionVideo = hotspot?.transitionVideo;

      // Only attempt video transition if not skipped and video exists
      if (!skipVideo && transitionVideo && window.handlePanoramaTransition) {
        const newViewpoint = LOCATIONS[locationId].viewpoints.find(
          (v) => v.id === viewpointId
        );
        window.handlePanoramaTransition(
          { ...newViewpoint, locationId: locationId }, 
          transitionVideo
        );
        return; // Don't update state yet, PanoramaSphere will call us back
      }

      // Fallback: Simple fade transition
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentLocationId(locationId);
        setCurrentViewpointId(viewpointId);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const nextViewpoint = useCallback(() => {
    const currentIndex = currentLocation.viewpoints.findIndex(
      (v) => v.id === currentViewpointId
    );
    if (currentIndex < currentLocation.viewpoints.length - 1) {
      const nextViewpoint = currentLocation.viewpoints[currentIndex + 1];
      setCurrentViewpointId(nextViewpoint.id);
    }
  }, [currentLocation, currentViewpointId]);

  const prevViewpoint = useCallback(() => {
    const currentIndex = currentLocation.viewpoints.findIndex(
      (v) => v.id === currentViewpointId
    );
    if (currentIndex > 0) {
      const prevViewpoint = currentLocation.viewpoints[currentIndex - 1];
      setCurrentViewpointId(prevViewpoint.id);
    }
  }, [currentLocation, currentViewpointId]);

  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  // --- Native Zoom Gestures Override ---
  const initialPinchDistance = useRef(null);
  const currentFovRef = useRef(zoomLevel);
  const targetFovRef = useRef(zoomLevel);
  const zoomDebounceRef = useRef(null);

  // Sync ref with state when mounting or external forces
  useEffect(() => {
    currentFovRef.current = zoomLevel;
    targetFovRef.current = zoomLevel;
  }, []);

  const updateCameraFOV = (newFov) => {
    targetFovRef.current = Math.max(MIN_FOV, Math.min(MAX_FOV, newFov));
  };

  const zoomIn = () => updateCameraFOV(targetFovRef.current - ZOOM_STEP);
  const zoomOut = () => updateCameraFOV(targetFovRef.current + ZOOM_STEP);
  const resetZoom = () => updateCameraFOV(75);

  const handleWheel = (e) => {
    // Standardize delta scroll factor
    const factor = 0.05; 
    updateCameraFOV(targetFovRef.current + e.deltaY * factor);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      if (controlsRef.current) controlsRef.current.enableRotate = false; // Lock rotation
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.hypot(dx, dy);
      
      const distanceDelta = initialPinchDistance.current - currentDistance;
      const factor = 0.3; // Responsive pinch factor
      
      updateCameraFOV(targetFovRef.current + distanceDelta * factor);
      initialPinchDistance.current = currentDistance;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      if (controlsRef.current) controlsRef.current.enableRotate = true; // Unlock rotation
      initialPinchDistance.current = null;
    }
  };
  const handleToggleGyro = async () => {
    if (isGyroEnabled) {
      setIsGyroEnabled(false);
      return;
    }

    if (!window.isSecureContext) {
      alert(
        'Gyroscope requires a Secure Context (HTTPS).\n\n' +
        'If testing locally, please run the server with HTTPS enabled or use a secure tunnel (e.g., ngrok).\n\n' +
        'Current Origin: ' + window.location.origin
      );
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setIsGyroEnabled(true);
          setIsAutoRotating(false);
        } else {
          alert('Permission to access motion sensors was denied.');
        }
      } catch (error) {
        console.error('Error requesting gyroscope permission:', error);
        alert('Could not request gyroscope permission. Ensure you are using HTTPS.');
      }
    } else {
      setIsGyroEnabled(true);
      setIsAutoRotating(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Hide minimap and navigation when entering fullscreen
      setIsNavExpanded(false);

      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.log(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden -mt-20">
      {isTransitioning && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white text-xl font-semibold">Loading...</div>
        </div>
      )}

      <div 
        className="absolute inset-0 touch-none"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Canvas
          camera={{ position: [0, 0, 0.1], fov: 75 }} // Initial FOV only, manually tracked afterwards
          flat
          colorSpace="srgb-linear"
        >
          <Suspense fallback={null}>
            <PanoramaSphere
              viewpoint={currentViewpoint}
              onNavigate={navigateToViewpoint}
            />
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={false} // Disabled native zoom so custom FOV handlers take over smoothly
              zoomSpeed={0.5}
              minDistance={0.1}
              maxDistance={0.1}
              rotateSpeed={-0.4}
              autoRotate={isAutoRotating}
              autoRotateSpeed={1.0}
              target={[0, 0, 0]}
              enableDamping={true}
              dampingFactor={0.05} // Lower damping factor for buttery smooth rotation momentum
              enabled={!isGyroEnabled}
            />
            <ZoomSmoother 
              targetFovRef={targetFovRef} 
              currentFovRef={currentFovRef} 
              controlsRef={controlsRef} 
              setZoomLevel={setZoomLevel} 
              zoomDebounceRef={zoomDebounceRef} 
            />
          <CameraController onDirectionChange={setUserDirection} />
          {isGyroEnabled && (
            <DeviceOrientationControls />
          )}
        </Suspense>
      </Canvas>
    </div>


      {/* Hierarchical Navigation - positioned to stack perfectly above the bottom bar */}
      {isNavExpanded && (
        <div
          className="
      absolute z-20
      bottom-[170px] left-0
      w-screen md:w-auto md:max-w-md
      md:bottom-[115px] lg:bottom-[115px] xl:bottom-[140px] 2xl:bottom-[90px]
      px-4 md:px-16
    "
        >
          <HierarchicalNavigation
            currentLocationId={currentLocationId}
            currentViewpointId={currentViewpointId}
            onNavigate={navigateToViewpoint}
            isExpanded={isNavExpanded}
            onToggleExpand={() => setIsNavExpanded(!isNavExpanded)}
          />
        </div>
      )}


      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div
          className={`bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur-sm text-sm transition-all duration-200 ${isZooming ? "ring-2 ring-blue-400/50" : ""
            }`}
        >
          Zoom:{" "}
          {Math.round(((MAX_FOV - zoomLevel) / (MAX_FOV - MIN_FOV)) * 100)}%
          {isZooming && (
            <span className="ml-2 inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          )}
        </div>
      </div>

      {/* Bottom UI Bar */}
      {!isFullscreen && (
        <div className="absolute bottom-0 left-0 right-0 bg-transparent backdrop-blur-md border-t border-white/20">
          {/* Mobile Multi-Row Layout */}
          <div className="block md:hidden">
            {/* Row 1: Title and Essential Actions */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-3">
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                  onClick={() => navigate("/")}
                  title="Home"
                >
                  <Home size={16} />
                </button>
                <div className="flex-shrink-0">
                  <SoundToggleButton />
                </div>
              </div>
            </div>

            {/* Row 2: Navigation and Tour Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <button
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 text-white ${isNavExpanded
                  ? "bg-gray-700 shadow"
                  : "bg-gray-700/50 hover:bg-gray-600"
                  }`}
              >
                <Navigation size={16} />
                <span className="text-sm font-medium">Navigation</span>
              </button>

              <div className="flex items-center">
                <TourControls
                  currentViewpointName={currentViewpoint.name}
                  currentViewpointIndex={currentLocation.viewpoints.findIndex(
                    (v) => v.id === currentViewpointId
                  )}
                  totalViewpoints={currentLocation.viewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) > 0
                  }
                  hasNext={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) <
                    currentLocation.viewpoints.length - 1
                  }
                />
              </div>
            </div>

            {/* Row 3: Utility Controls */}
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAutoRotate}
                  className={`flex items-center gap-2 px-3 py-2 text-white rounded-full transition-all text-sm ${isAutoRotating
                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }`}
                >
                  <img
                    src="/assets/icons/3d-rotate.png"
                    alt="Rotate Icon"
                    className={`w-4 h-4 ${isAutoRotating ? "animate-spin" : ""
                      }`}
                  />
                  <span>{isAutoRotating ? "Stop Rotate" : "Rotate"}</span>
                </button>

                <button
                  onClick={handleToggleGyro}
                  className={`flex items-center gap-2 px-3 py-2 text-white rounded-full transition-all text-sm ${isGyroEnabled
                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }`}
                >
                  <Compass size={16} className={isGyroEnabled ? "animate-pulse" : ""} />
                  <span>Gyro</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm"
                >
                  <img
                    src="/assets/icons/arrow-expand.png"
                    alt="Expand Icon"
                    className="w-4 h-4"
                  />
                  <span>Fullscreen</span>
                </button>
              </div>

              <div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">
                <button
                  onClick={resetZoom}
                  disabled={isZooming}
                  className={`px-3 py-2 transition-all duration-200 ${isZooming
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-600 active:bg-gray-500"
                    }`}
                  title="Reset Zoom"
                >
                  Zoom
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoomLevel <= MIN_FOV || isZooming}
                  className={`px-3 py-2 transition-all duration-200 ${zoomLevel <= MIN_FOV || isZooming
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-600 active:bg-gray-500"
                    }`}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel >= MAX_FOV || isZooming}
                  className={`px-3 py-2 transition-all duration-200 ${zoomLevel >= MAX_FOV || isZooming
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-600 active:bg-gray-500"
                    }`}
                  title="Zoom Out"
                >
                  −
                </button>
              </div>
            </div>
          </div>

          {/* Large Screen 2-Row Layout */}
          <div className="hidden md:block xl:hidden">
            {/* Row 1: Title and Main Actions */}
            <div className="flex items-center justify-between mx-4 lg:mx-8 px-6 py-2 border-b border-white/10">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 text-white ${isNavExpanded
                    ? "bg-gray-700 shadow"
                    : "bg-gray-700/50 hover:bg-gray-600"
                    }`}
                >
                  <Navigation size={18} />
                  <span className="text-sm font-medium">Navigation</span>
                </button>
              </div>
              <div className="px-3">
                <BreadcrumbNavigation
                  currentLocationId={currentLocationId}
                  currentViewpointId={currentViewpointId}
                  onNavigate={navigateToViewpoint}
                />
              </div>

              <div className="flex items-center gap-4">

                <button
                  className="w-10 h-10 text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                  onClick={() => navigate("/")}
                >
                  <Home size={18} />
                </button>

                <SoundToggleButton />
              </div>
            </div>

            {/* Row 2: Tour Controls and Utilities */}
            <div className="flex items-center justify-between mx-4 lg:mx-8 px-6 py-2">
              <div className="flex items-center gap-6">
                <TourControls
                  currentViewpointName={currentViewpoint.name}
                  currentViewpointIndex={currentLocation.viewpoints.findIndex(
                    (v) => v.id === currentViewpointId
                  )}
                  totalViewpoints={currentLocation.viewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) > 0
                  }
                  hasNext={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) <
                    currentLocation.viewpoints.length - 1
                  }
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAutoRotate}
                  className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 ${isAutoRotating
                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }`}
                >
                  {isAutoRotating ? "Stop Rotate" : "Rotate"}
                  <img
                    src="/assets/icons/3d-rotate.png"
                    alt="Rotate Icon"
                    className={`w-4 h-4 ${isAutoRotating ? "animate-spin" : ""
                      }`}
                  />
                </button>

                <div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">
                  <button
                    onClick={resetZoom}
                    disabled={isZooming}
                    className={`px-3 py-2 transition-all duration-200 ${isZooming
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-600 active:bg-gray-500"
                      }`}
                    title="Reset Zoom"
                  >
                    Zoom
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoomLevel <= MIN_FOV || isZooming}
                    className={`px-3 py-2 transition-all duration-200 ${zoomLevel <= MIN_FOV || isZooming
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-600 active:bg-gray-500"
                      }`}
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={zoomOut}
                    disabled={zoomLevel >= MAX_FOV || isZooming}
                    className={`px-3 py-2 transition-all duration-200 ${zoomLevel >= MAX_FOV || isZooming
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-600 active:bg-gray-500"
                      }`}
                    title="Zoom Out"
                  >
                    −
                  </button>
                </div>

                <button
                  onClick={handleToggleGyro}
                  className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 ${isGyroEnabled
                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  title="Gyroscope View"
                >
                  Gyro
                  <Compass size={16} className={isGyroEnabled ? "animate-pulse" : ""} />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2"
                >
                  Fullscreen
                  <img
                    src="/assets/icons/arrow-expand.png"
                    alt="Expand Icon"
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Extra Large Desktop 2-Row Layout */}
          <div className="hidden xl:block 2xl:hidden">
            {/* Row 1: Title, Navigation and Core Actions */}
            <div className="flex items-center justify-between mx-8 xl:mx-12 px-6 py-3 border-b border-white/10">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 text-white ${isNavExpanded
                    ? "bg-gray-700 shadow"
                    : "bg-gray-700/50 hover:bg-gray-600"
                    }`}
                >
                  <Navigation size={18} />
                  <span className="text-sm font-medium">Navigation</span>
                </button>
              </div>

              <div className="flex items-center gap-6">

                <button
                  className="w-10 h-10 text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                  onClick={() => navigate("/")}
                >
                  <Home size={18} />
                </button>

                <SoundToggleButton />
              </div>
            </div>

            {/* Row 2: Tour Controls and Utilities */}
            <div className="flex items-center justify-between mx-8 xl:mx-12 px-6 py-3">
              <div className="flex items-center gap-8">
                <BreadcrumbNavigation
                  currentLocationId={currentLocationId}
                  currentViewpointId={currentViewpointId}
                  onNavigate={navigateToViewpoint}
                />
                <TourControls
                  currentViewpointName={currentViewpoint.name}
                  currentViewpointIndex={currentLocation.viewpoints.findIndex(
                    (v) => v.id === currentViewpointId
                  )}
                  totalViewpoints={currentLocation.viewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) > 0
                  }
                  hasNext={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) <
                    currentLocation.viewpoints.length - 1
                  }
                />
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={toggleAutoRotate}
                  className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 ${isAutoRotating
                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }`}
                >
                  {isAutoRotating ? "Stop Rotate" : "Rotate"}
                  <img
                    src="/assets/icons/3d-rotate.png"
                    alt="Rotate Icon"
                    className={`w-4 h-4 ${isAutoRotating ? "animate-spin" : ""
                      }`}
                  />
                </button>

                <div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">
                  <button
                    onClick={resetZoom}
                    disabled={isZooming}
                    className={`px-3 py-2 transition-all duration-200 ${isZooming
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-600 active:bg-gray-500"
                      }`}
                    title="Reset Zoom"
                  >
                    Zoom
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoomLevel <= MIN_FOV || isZooming}
                    className={`px-3 py-2 transition-all duration-200 ${zoomLevel <= MIN_FOV || isZooming
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-600 active:bg-gray-500"
                      }`}
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={zoomOut}
                    disabled={zoomLevel >= MAX_FOV || isZooming}
                    className={`px-3 py-2 transition-all duration-200 ${zoomLevel >= MAX_FOV || isZooming
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-600 active:bg-gray-500"
                      }`}
                    title="Zoom Out"
                  >
                    −
                  </button>
                </div>

                <button
                  onClick={handleToggleGyro}
                  className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 ${isGyroEnabled
                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  title="Gyroscope View"
                >
                  Gyro
                  <Compass size={16} className={isGyroEnabled ? "animate-pulse" : ""} />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2"
                >
                  Fullscreen
                  <img
                    src="/assets/icons/arrow-expand.png"
                    alt="Expand Icon"
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Ultra Large Desktop Single-Row Layout */}
          <div className="hidden 2xl:flex items-center justify-between mx-16 px-6 py-3">
            {/* Center: Navigation + Tour Controls */}
            <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 px-6 flex-1 justify-center min-w-0">
              {/* Navigation Toggle */}
              <button
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 text-white whitespace-nowrap flex-shrink-0 ${isNavExpanded
                  ? "bg-gray-700 shadow"
                  : "bg-gray-700/50 hover:bg-gray-600"
                  }`}
              >
                <Navigation size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">Navigation</span>
              </button>

              {/* Breadcrumb + Controls */}
              <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 min-w-0 flex-1">
                <div className="min-w-0 flex-shrink">
                  <BreadcrumbNavigation
                    currentLocationId={currentLocationId}
                    currentViewpointId={currentViewpointId}
                    onNavigate={navigateToViewpoint}
                  />
                </div>
                <div className="flex-shrink-0">
                  <TourControls
                    currentViewpointName={currentViewpoint.name}
                    currentViewpointIndex={currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    )}
                    totalViewpoints={currentLocation.viewpoints.length}
                    onPrev={prevViewpoint}
                    onNext={nextViewpoint}
                    hasPrev={
                      currentLocation.viewpoints.findIndex(
                        (v) => v.id === currentViewpointId
                      ) > 0
                    }
                    hasNext={
                      currentLocation.viewpoints.findIndex(
                        (v) => v.id === currentViewpointId
                      ) <
                      currentLocation.viewpoints.length - 1
                    }
                  />
                </div>

                {/* Utility Buttons */}
                <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                  {/* Rotate Button */}
                  <button
                    onClick={toggleAutoRotate}
                    className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap ${isAutoRotating
                      ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                      : "bg-gray-700 hover:bg-gray-600"
                      }`}
                  >
                    {isAutoRotating ? "Stop Rotate" : "Rotate"}
                    <img
                      src="/assets/icons/3d-rotate.png"
                      alt="Rotate Icon"
                      className={`w-4 h-4 flex-shrink-0 ${isAutoRotating ? "animate-spin" : ""
                        }`}
                    />
                  </button>

                  {/* Gyro Button */}
                  <button
                    onClick={handleToggleGyro}
                    className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap ${isGyroEnabled
                      ? "bg-purple-600 hover:bg-purple-700 shadow-lg"
                      : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    title="Gyroscope View"
                  >
                    Gyro
                    <Compass size={18} className={`flex-shrink-0 ${isGyroEnabled ? "animate-pulse" : ""}`} />
                  </button>

                  {/* Zoom Controls */}
                  <div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">
                    <button
                      onClick={resetZoom}
                      disabled={isZooming}
                      className={`px-3 py-2 transition-all duration-200 flex items-center justify-center min-w-[60px] whitespace-nowrap ${isZooming
                        ? "text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-600 active:bg-gray-500"
                        }`}
                      title="Reset Zoom"
                    >
                      Zoom
                    </button>
                    <button
                      onClick={zoomIn}
                      disabled={zoomLevel <= MIN_FOV || isZooming}
                      className={`px-3 py-2 transition-all duration-200 flex items-center justify-center min-w-[40px] ${zoomLevel <= MIN_FOV || isZooming
                        ? "text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-600 active:bg-gray-500"
                        }`}
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      onClick={zoomOut}
                      disabled={zoomLevel >= MAX_FOV || isZooming}
                      className={`px-3 py-2 transition-all duration-200 flex items-center justify-center min-w-[40px] ${zoomLevel >= MAX_FOV || isZooming
                        ? "text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-600 active:bg-gray-500"
                        }`}
                      title="Zoom Out"
                    >
                      −
                    </button>
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    Fullscreen
                    <img
                      src="/assets/icons/arrow-expand.png"
                      alt="Expand Icon"
                      className="w-4 h-4 flex-shrink-0"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Minimap Toggle */}
            <div className="flex items-center gap-4 pl-6 flex-shrink-0">

              <button
                className="w-10 h-10 text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-300 flex items-center justify-center flex-shrink-0"
                onClick={() => navigate("/")}
              >
                <Home size={18} />
              </button>

              {/* Sound Button */}
              <div className="flex-shrink-0">
                <SoundToggleButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-black/70 hover:bg-black/60 text-white px-5 py-2 rounded-full text-sm backdrop-blur-md transition-all"
          >
            Restore screen
            <img
              src="/assets/icons/arrow-shrink.png"
              alt="Restore Icon"
              className="w-4 h-4"
            />
          </button>
        </div>
      )}
    </div>
  );
}

export default TourPage;
