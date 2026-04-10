import React, { useRef, useState, useEffect } from 'react';
import { useTexture, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import Hotspot from '../common/Hotspot';
import { isHotspotInternal } from '../../data/locations';

function PanoramaSphere({ viewpoint, onNavigate, opacity = 1, zOffset = 0, interactive = true }) {
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoUrl, setTransitionVideoUrl] = useState(null);
  const [pendingViewpoint, setPendingViewpoint] = useState(null);
  const groupRef = useRef();

  // 1. Asynchronously load the Low-Quality Image Placeholder (LQIP)
  // We avoid useTexture() here because Suspense would freeze the animation frame loop
  // during crossfades, causing a stutter.
  const lqipPath = viewpoint.image.replace(/\.jpg$/i, '_low.jpg');
  const [lowResTexture, setLowResTexture] = useState(null);

  useEffect(() => {
    setLowResTexture(null);
    const loader = new THREE.TextureLoader();
    loader.load(lqipPath, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      setLowResTexture(tex);
    });
  }, [lqipPath]);

  // 2. Asynchronously load the High-Quality Image
  const [hiResTexture, setHiResTexture] = useState(null);
  const [hiResOpacity, setHiResOpacity] = useState(0);

  useEffect(() => {
    // Reset state for new viewpoint
    setHiResTexture(null);
    setHiResOpacity(0);

    // Delay loading the heavy 8K texture until AFTER the cinematic crossfade 
    // and zoom animations complete to prevent main-thread decoding stutters.
    // The crossfade takes 600ms, and the landing zoom takes ~400ms.
    const timer = setTimeout(() => {
      const loader = new THREE.TextureLoader();
      loader.load(viewpoint.image, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.repeat.x = -1;
        setHiResTexture(tex);
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [viewpoint.image]);

  // Video transition texture
  const videoTexture = useVideoTexture(transitionVideoUrl || '', {
    unsuspend: 'loadstart',
    crossOrigin: 'Anonymous',
    muted: true,
    loop: false,
    start: isTransitioning,
  });

  // Configure Video Texture
  useEffect(() => {
    if (videoTexture) {
      videoTexture.wrapS = THREE.RepeatWrapping;
      videoTexture.repeat.x = 1; // repeat.x is 1 for video, unlike panoramas
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.needsUpdate = true;
    }
  }, [videoTexture]);

  // Handle smooth fade-in for hi-res texture
  useEffect(() => {
    if (hiResTexture) {
      let animationFrameId;
      let opacity = 0;

      const fadeIn = () => {
        opacity += 0.06; // Quick fade
        if (opacity >= 1) {
          setHiResOpacity(1);
        } else {
          setHiResOpacity(opacity);
          animationFrameId = requestAnimationFrame(fadeIn);
        }
      };

      // Give a tiny delay before fading in to ensure smooth rendering
      setTimeout(() => {
        animationFrameId = requestAnimationFrame(fadeIn);
      }, 50);

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }
  }, [hiResTexture]);

  useEffect(() => {
    if (groupRef.current && viewpoint.rotationOffset !== undefined) {
      const rotationRadians = (viewpoint.rotationOffset * Math.PI) / 180;
      groupRef.current.rotation.y = rotationRadians;
    }
  }, [viewpoint.rotationOffset]);

  useEffect(() => {
    const handleTransition = (newViewpoint, transitionVideo) => {
      if (transitionVideo) {
        setPendingViewpoint(newViewpoint);
        setTransitionVideoUrl(transitionVideo);
        setIsTransitioning(true);
      }
    };
    window.handlePanoramaTransition = handleTransition;
  }, []);

  useEffect(() => {
    if (videoTexture?.image && isTransitioning) {
      const video = videoTexture.image;

      const handleVideoEnd = () => {
        setIsTransitioning(false);
        setTransitionVideoUrl(null);
        setPendingViewpoint(null);
        onNavigate(pendingViewpoint.locationId, pendingViewpoint.id);
      };

      const handleVideoError = (e) => {
        console.error("🎬 Video Transition Error:", e);
        setIsTransitioning(false);
        setTransitionVideoUrl(null);
        setPendingViewpoint(null);
      };

      video.addEventListener('ended', handleVideoEnd);
      video.addEventListener('error', handleVideoError);

      return () => {
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('error', handleVideoError);
      };
    }
  }, [videoTexture, isTransitioning, pendingViewpoint, onNavigate]);

  return (
    <group ref={groupRef}>
      {/* Base Layer: Low-Quality Placeholder */}
      {!isTransitioning && lowResTexture && (
        <mesh raycast={interactive ? undefined : null}>
          {/* Apply zOffset to ensure proper depth sorting when two spheres overlap */}
          <sphereGeometry args={[50 - zOffset * 2, 64, 64]} />
          <meshBasicMaterial
            map={lowResTexture}
            side={THREE.BackSide}
            transparent={opacity < 1}
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Hi-Res Layer (Fades in over the LQIP) */}
      {!isTransitioning && hiResTexture && (
        <mesh raycast={null}>
          {/* Slightly smaller sphere radius to render inside the LQIP sphere */}
          <sphereGeometry args={[49.9 - zOffset * 2, 64, 64]} />
          <meshBasicMaterial
            map={hiResTexture}
            side={THREE.BackSide}
            transparent={true}
            opacity={Math.min(hiResOpacity, opacity)}
            depthWrite={false} // Prevent z-fighting depth issues
          />
        </mesh>
      )}


      {/* Transition Video Layer */}
      {isTransitioning && (
        <mesh raycast={null}>
          <sphereGeometry args={[50 - zOffset * 2, 64, 64]} />
          <meshBasicMaterial
            map={videoTexture}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Hotspots */}
      {!isTransitioning && viewpoint.hotspots.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.panoramaPosition}
          label={hotspot.label}
          isInternalNavigation={isHotspotInternal(hotspot, viewpoint.id)}
          onClick={() => onNavigate(hotspot.target, hotspot.targetViewpoint)}
          onHover={() => setHoveredHotspot(hotspot.id)}
          onUnhover={() => setHoveredHotspot(null)}
          isHovered={hoveredHotspot === hotspot.id}
        />
      ))}
    </group>
  );
}

export default PanoramaSphere;
