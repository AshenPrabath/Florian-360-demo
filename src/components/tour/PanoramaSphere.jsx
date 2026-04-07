import React, { useRef, useState, useEffect } from 'react';
import { useTexture, useVideoTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Hotspot from '../common/Hotspot';
import { isHotspotInternal } from '../../data/locations';

function PanoramaSphere({ viewpoint, onNavigate, isNightMode }) {
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoUrl, setTransitionVideoUrl] = useState(null);
  const [pendingViewpoint, setPendingViewpoint] = useState(null);
  const groupRef = useRef();
  
  // Transition logic for Day/Night
  const opacityRef = useRef(0);
  const [nightOpacity, setNightOpacity] = useState(0);

  // Load Main (Day) Texture
  const dayTexture = useTexture(viewpoint.image);
  
  // Load Night Texture (if exists)
  const nightTexture = useTexture(viewpoint.nightImage || viewpoint.image);
  
  const pendingImageTexture = useTexture(pendingViewpoint?.image || viewpoint.image);

  // Video transition texture
  const videoTexture = useVideoTexture(transitionVideoUrl || '', {
    unsuspend: 'loadstart',
    crossOrigin: 'Anonymous',
    muted: true,
    loop: false,
    start: isTransitioning,
  });

  // Configure All Textures
  useEffect(() => {
    const textures = [dayTexture, nightTexture, pendingImageTexture, videoTexture];
    textures.forEach(tex => {
      if (tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.repeat.x = -1; // Flip for internal viewing
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
      }
    });
    
    // Video texture exception: repeat.x should be 1
    if (videoTexture) videoTexture.repeat.x = 1;
  }, [dayTexture, nightTexture, pendingImageTexture, videoTexture]);

  // Handle smooth Day/Night fade
  useFrame((state, delta) => {
    const targetOpacity = isNightMode ? 1 : 0;
    if (Math.abs(opacityRef.current - targetOpacity) > 0.001) {
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta * 4);
      setNightOpacity(opacityRef.current);
    }
  });

  useEffect(() => {
    if (groupRef.current && viewpoint.rotationOffset) {
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
      {/* Base Layer: Day Panorama */}
      {/* Base Layer: Day Panorama */}
      {!isTransitioning && (
        <mesh raycast={null}>
          <sphereGeometry args={[50, 64, 64]} />
          <meshBasicMaterial 
            map={dayTexture} 
            side={THREE.BackSide} 
          />
        </mesh>
      )}

      {/* Overlay Layer: Night Panorama (Fades in) */}
      {!isTransitioning && viewpoint.nightImage && (
        <mesh raycast={null}>
          <sphereGeometry args={[49.8, 64, 64]} />
          <meshBasicMaterial 
            map={nightTexture} 
            side={THREE.BackSide} 
            transparent={true}
            opacity={nightOpacity}
          />
        </mesh>
      )}

      {/* Transition Video Layer */}
      {isTransitioning && (
        <mesh raycast={null}>
          <sphereGeometry args={[50, 64, 64]} />
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
