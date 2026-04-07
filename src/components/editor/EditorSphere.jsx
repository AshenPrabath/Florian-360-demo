// src/components/editor/EditorSphere.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Hotspot from '../common/Hotspot';
import { isHotspotInternal } from '../../data/locations';

/**
 * Specialized version of PanoramaSphere for the Tour Creator.
 * 
 * @param {Object} props
 * @param {Object} props.viewpoint - The current viewpoint being edited.
 * @param {Function} props.onAddHotspot - Callback when user clicks to add a hotspot.
 * @param {Function} props.onSelectHotspot - Callback when user selects an existing hotspot.
 * @param {string} props.selectedHotspotId - Currently selected hotspot ID.
 */
function EditorSphere({ viewpoint, onAddHotspot, onSelectHotspot, selectedHotspotId }) {
  const groupRef = useRef();
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  
  // Use previewUrl if available (from recent upload), otherwise use project path
  const imageSource = viewpoint.previewUrl || viewpoint.image;
  const isPending = viewpoint.image === 'pending_upload' && !viewpoint.previewUrl;

  // Only load texture if we have a valid source
  const currentImageTexture = useTexture(isPending ? 'assets/images/placeholder.jpg' : imageSource);

  useEffect(() => {
    if (currentImageTexture) {
      currentImageTexture.wrapS = THREE.RepeatWrapping;
      currentImageTexture.repeat.x = -1; // Flip for internal view
      currentImageTexture.colorSpace = THREE.SRGBColorSpace;
      currentImageTexture.needsUpdate = true;
    }
  }, [currentImageTexture]);

  useEffect(() => {
    if (groupRef.current && viewpoint.rotationOffset !== undefined) {
      const rotationRadians = (viewpoint.rotationOffset * Math.PI) / 180;
      groupRef.current.rotation.y = rotationRadians;
    }
  }, [viewpoint.rotationOffset]);

  const handleSphereClick = (e) => {
    // Stop propagation so we don't trigger multiple things
    e.stopPropagation();
    
    // We only trigger add hotspot if we're in 'add' mode, handled by parent
    // However, the point on the sphere surface is exactly what we need
    if (onAddHotspot) {
      onAddHotspot(e.point);
    }
  };

  return (
    <group ref={groupRef}>
      {/* The main Panorama Sphere */}
      <mesh onPointerUp={handleSphereClick}>
        <sphereGeometry args={[50, 64, 64]} />
        <meshBasicMaterial 
          map={isPending ? null : currentImageTexture} 
          color={isPending ? "#222222" : "white"}
          side={THREE.BackSide} 
        />
      </mesh>

      {/* Render Hotspots */}
      {viewpoint.hotspots.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.panoramaPosition}
          label={hotspot.label}
          isHovered={hoveredHotspot === hotspot.id || selectedHotspotId === hotspot.id}
          onHover={() => setHoveredHotspot(hotspot.id)}
          onUnhover={() => setHoveredHotspot(null)}
          onClick={(e) => {
            e.stopPropagation(); // Don't trigger sphere click
            onSelectHotspot(hotspot.id);
          }}
          isInternalNavigation={isHotspotInternal(hotspot, viewpoint.id)}
        />
      ))}

      {/* Selection Highlight Ring (Optional: can be added inside Hotspot or here) */}
      {selectedHotspotId && viewpoint.hotspots.find(h => h.id === selectedHotspotId) && (
        <mesh 
          position={viewpoint.hotspots.find(h => h.id === selectedHotspotId).panoramaPosition}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial color="#DCC5B7" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default EditorSphere;
