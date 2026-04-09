import React, { useRef, useState, useEffect } from 'react';
import { useTexture, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import Hotspot from '../common/Hotspot';
import { isHotspotInternal } from '../../data/locations';

function PanoramaSphere({ viewpoint, onNavigate }) {
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoUrl, setTransitionVideoUrl] = useState(null);
  const [pendingViewpoint, setPendingViewpoint] = useState(null);
  const groupRef = useRef();
  

  // Load Main (Day) Texture
  const dayTexture = useTexture(viewpoint.image);
  

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
    const textures = [dayTexture, pendingImageTexture, videoTexture];
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
  }, [dayTexture, pendingImageTexture, videoTexture]);

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
