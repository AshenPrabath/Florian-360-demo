// src/components/common/Hotspot.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Modern Hotspot component for clickable navigation points within the 360 panorama.
 * Features a sleek ring design with pulsing animation and modern tooltip.
 *
 * @param {Object} props - Component props.
 * @param {Array<number>} props.position - 3D position of the hotspot.
 * @param {Function} props.onClick - Function to call when hotspot is clicked.
 * @param {string} props.label - Text label for the hotspot.
 * @param {boolean} props.isHovered - True if the hotspot is currently hovered.
 * @param {Function} props.onHover - Callback for mouse enter event.
 * @param {Function} props.onUnhover - Callback for mouse leave event.
 * @param {boolean} props.isInternalNavigation - True if navigating within the same room.
 */
function Hotspot({ position, onClick, label, isHovered, onHover, onUnhover, isInternalNavigation }) {
  const outerRingRef = useRef();
  const innerDotRef = useRef();
  const pulseRingRef = useRef();

  // Smooth animations for all elements
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (outerRingRef.current) {
      // Gentle rotation for outer ring
      outerRingRef.current.rotation.z = time * 0.5;
      
      // Smooth scale transition on hover
      const targetScale = isHovered ? 1.4 : 1;
      outerRingRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    
    if (innerDotRef.current) {
      // Subtle pulsing for inner dot
      const pulseScale = 1 + Math.sin(time * 3) * 0.15;
      innerDotRef.current.scale.setScalar(pulseScale);
    }
    
    if (pulseRingRef.current) {
      // Continuous pulse animation
      const pulsePhase = (time * 2) % (Math.PI * 2);
      const pulseScale = 1 + Math.sin(pulsePhase) * 0.3;
      const pulseOpacity = Math.max(0, 0.3 - (Math.sin(pulsePhase) * 0.3));
      
      pulseRingRef.current.scale.setScalar(pulseScale);
      pulseRingRef.current.material.opacity = pulseOpacity;
    }
  });

  // Modern color scheme
  const colors = {
  internal: {
    primary: '#E5FFFB',     // soft mint-white
    secondary: '#CCF4EB',   // slightly stronger for inner dot
    accent: '#B2EFE2',      // hover accent
    pulse: '#D1FAF0'        // pulse glow
  },
  external: {
    primary: '#E6F0FF',     // soft blue-white
    secondary: '#D1E3FF',   // slightly stronger
    accent: '#BBD6FF',      // hover accent
    pulse: '#CFE3FF'        // pulse glow
  }
};

  const colorScheme = isInternalNavigation ? colors.internal : colors.external;

  return (
    <group position={position}>
  {/* ✅ Transparent interactive area for full hitbox */}
  <mesh
    onClick={onClick}
    onPointerOver={onHover}
    onPointerOut={onUnhover}
    rotation={[Math.PI / 2, 0, 0]}
    position={[0, 0.001, 0]} // tiny Z offset to avoid depth fight
    renderOrder={10}          // High priority for raycasting
  >
    <circleGeometry args={[0.8, 32]} />
    <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
  </mesh>


  {/* Pulse ring for ambient animation */}
  <mesh ref={pulseRingRef} rotation={[Math.PI / 2, 0, 0]}>
    <ringGeometry args={[0.4, 0.5, 32]} />
    <meshBasicMaterial
      color={colorScheme.pulse}
      transparent
      opacity={0.3}
      side={THREE.DoubleSide}
    />
  </mesh>

  {/* Outer ring - main visual */}
  <mesh
    ref={outerRingRef}
    rotation={[Math.PI / 2, 0, 0]}
    position={[0, 0.001, 0]}
  >
    <ringGeometry args={[0.2, 0.3, 32]} />
    <meshBasicMaterial
      color={isHovered ? colorScheme.accent : colorScheme.primary}
      transparent
      opacity={0.9}
      side={THREE.DoubleSide}
    />
  </mesh>

  {/* Inner dot - visual center */}
  <mesh ref={innerDotRef} rotation={[Math.PI / 2, 0, 0]}>
    <circleGeometry args={[0.08, 32]} />
    <meshBasicMaterial
      color={isHovered ? colorScheme.accent : colorScheme.secondary}
      transparent
      opacity={1}
    />
  </mesh>

  {/* Tooltip */}
  {isHovered && (
    <Html position={[0, 0.8, 0]} center>
  <div className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-xl">
    <div className="flex items-center gap-2">
      {/* Colored dot indicating navigation type */}
      <div 
        className={`w-2.5 h-2.5 rounded-full ${
          isInternalNavigation ? 'bg-emerald-400' : 'bg-blue-400'
        }`}
      />
      <span>{label}</span>

      {/* Arrow icon */}
      <svg 
        className="w-3.5 h-3.5 opacity-60" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5l7 7-7 7" 
        />
      </svg>
    </div>
  </div>
</Html>

  )}
</group>

  );
}

export default Hotspot;