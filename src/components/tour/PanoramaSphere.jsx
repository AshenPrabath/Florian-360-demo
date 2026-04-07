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

  const currentImageTexture = useTexture(viewpoint.image);
  const pendingImageTexture = useTexture(pendingViewpoint?.image || viewpoint.image);

  const videoTexture = useVideoTexture(transitionVideoUrl || '', {
    unsuspend: 'loadstart',
    crossOrigin: 'Anonymous',
    muted: true,
    loop: false,
    start: isTransitioning,
  });

  useEffect(() => {
    if (currentImageTexture) {
      currentImageTexture.wrapS = THREE.RepeatWrapping;
      currentImageTexture.repeat.x = -1;
      currentImageTexture.colorSpace = THREE.SRGBColorSpace;
      currentImageTexture.needsUpdate = true;
    }
  }, [currentImageTexture]);

  useEffect(() => {
    if (pendingImageTexture && pendingViewpoint) {
      pendingImageTexture.wrapS = THREE.RepeatWrapping;
      pendingImageTexture.repeat.x = -1;
      pendingImageTexture.colorSpace = THREE.SRGBColorSpace;
      pendingImageTexture.needsUpdate = true;
    }
  }, [pendingImageTexture, pendingViewpoint]);

  useEffect(() => {
    if (videoTexture?.image && isTransitioning) {
      const video = videoTexture.image;

      const handleLoadedMetadata = () => {
        video.currentTime = 0;
      };

      videoTexture.wrapS = THREE.RepeatWrapping;
      videoTexture.repeat.x = 1;
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.needsUpdate = true;

      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [videoTexture, isTransitioning]);

  useEffect(() => {
    if (groupRef.current && viewpoint.rotationOffset) {
      const rotationRadians = (viewpoint.rotationOffset * Math.PI) / 180;
      groupRef.current.rotation.y = rotationRadians;
    }
  }, [viewpoint.rotationOffset]);

  useEffect(() => {
    const handleTransition = (newViewpoint, transitionVideo) => {
      if (transitionVideo) {
        const preloadVideo = document.createElement('video');
        preloadVideo.src = transitionVideo;
        preloadVideo.crossOrigin = 'anonymous';
        preloadVideo.muted = true;
        preloadVideo.playsInline = true;
        preloadVideo.play().then(() => {
          preloadVideo.pause();
          preloadVideo.currentTime = 0;
        });

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
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('error', handleVideoError);
      };

      const handleVideoError = (error) => {
        console.error('🎬 Video error:', error);
        setIsTransitioning(false);
        setTransitionVideoUrl(null);
        setPendingViewpoint(null);
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('error', handleVideoError);
      };

      video.addEventListener('ended', handleVideoEnd);
      video.addEventListener('error', handleVideoError);

      return () => {
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('error', handleVideoError);
      };
    }
  }, [videoTexture, isTransitioning]);

  const getActiveTexture = () => {
    if (isTransitioning && videoTexture) {
      return videoTexture;
    }
    return currentImageTexture;
  };

  const activeTexture = getActiveTexture();

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[50, 64, 64]} />
        {isTransitioning && videoTexture ? (
          <shaderMaterial
            args={[{
              uniforms: {
                uTexture: { value: videoTexture },
              },
              vertexShader: `
                varying vec2 vUv;
                void main() {
                  vUv = vec2(1.0 - uv.x, uv.y);
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                uniform sampler2D uTexture;
                varying vec2 vUv;
                void main() {
                  vec4 texColor = texture2D(uTexture, vUv);
                  texColor.rgb = pow(texColor.rgb, vec3(1.1));
                  gl_FragColor = texColor;
                }
              `,
              side: THREE.BackSide,
            }]}
          />
        ) : (
          <meshBasicMaterial 
            map={activeTexture} 
            side={THREE.BackSide} 
          />
        )}
      </mesh>

      {!isTransitioning && viewpoint.hotspots.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.panoramaPosition}
          label={hotspot.label}
          isHovered={hoveredHotspot === hotspot.id}
          onHover={() => setHoveredHotspot(hotspot.id)}
          onUnhover={() => setHoveredHotspot(null)}
          onClick={() => onNavigate(hotspot.target, hotspot.targetViewpoint)}
          isInternalNavigation={isHotspotInternal(hotspot, viewpoint.id)}
        />
      ))}
    </group>
  );
}

export default PanoramaSphere;
