// src/components/minimap/MinimapMarkers.jsx
// This file contains components for markers used within the 3D minimap.
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three'; // Import Three.js for geometry and material

/**
 * MainLocationLabel component for displaying the name of a location on the 3D minimap.
 * This label appears above the general area of a room.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.location - The location object.
 * @param {boolean} props.isCurrent - True if this is the current active location.
 * @param {Function} props.onLocationClick - Callback to navigate to this location.
 */
export const MainLocationLabel = ({ location, isCurrent, onLocationClick }) => {
  // If it's the current location, we typically don't show the main label,
  // as the viewpoint markers within it are more detailed.
  if (isCurrent) return null;

  return (
    <group position={[location.minimap3DPosition.x, 1.2, location.minimap3DPosition.z]}>
      {/* Html component allows rendering React DOM elements in 3D space */}
      <Html center zIndexRange={[0, 10]}>
        <div
          className={`text-white text-xs font-semibold bg-black bg-opacity-75 px-2 py-1 rounded whitespace-nowrap cursor-pointer hover:bg-opacity-90 transition-colors border-l-4`}
          style={{ borderLeftColor: location.color }} // Dynamic border color from location data
          onClick={() => onLocationClick(location.id, location.viewpoints[0].id)} // Navigate to the first viewpoint of this location
        >
          {location.name}
          {isCurrent && <span className="ml-2 text-yellow-400">●</span>} {/* Small indicator if current */}
        </div>
      </Html>
    </group>
  );
};

/**
 * ViewpointMarker component for displaying individual viewpoint markers on the 3D minimap.
 * These are the small spheres representing specific points within a room.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.location - The parent location object.
 * @param {Object} props.viewpoint - The viewpoint object.
 * @param {boolean} props.isCurrent - True if this is the current active viewpoint.
 * @param {Function} props.onLocationClick - Callback to navigate to this viewpoint.
 */
export const ViewpointMarker = ({ location, viewpoint, isCurrent, onLocationClick }) => {
  const meshRef = useRef(); // Ref for the sphere mesh
  const cylinderRef = useRef(); // Ref for the optional cylinder indicator

  // Animation for sphere rotation and cylinder rotation if it's the current viewpoint
  useFrame((state) => {
    if (meshRef.current && isCurrent) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2; // Rotate the sphere
    }
    if (cylinderRef.current && isCurrent) {
      cylinderRef.current.rotation.y = state.clock.elapsedTime; // Rotate the cylinder
    }
  });

  const position = viewpoint.minimap3DPosition; // Get 3D position from viewpoint data

  return (
    <group position={position}>
      {/* Optional cylinder indicator for the current viewpoint */}
      {isCurrent && (
        <mesh
          ref={cylinderRef}
          position={[0, 0.4, 0]} // Position above the sphere
          onClick={() => onLocationClick(location.id, viewpoint.id)}
        >
          <cylinderGeometry args={[0.3, 0.3, 0.8]} /> {/* Cylinder geometry */}
          <meshBasicMaterial
            color={location.color} // Color from parent location
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* The main sphere marker for the viewpoint */}
      <mesh
        ref={meshRef}
        onClick={() => onLocationClick(location.id, viewpoint.id)}
      >
        <sphereGeometry args={[isCurrent ? 0.2 : 0.15, 8, 8]} /> {/* Larger sphere if current */}
        <meshBasicMaterial
          color={isCurrent ? '#FFD700' : location.color} // Yellow if current, otherwise location color
          transparent
          opacity={isCurrent ? 1 : 0.7}
        />
      </mesh>

      {/* HTML label for the viewpoint name */}
      <Html position={[0, 0.6, 0]} center zIndexRange={[0, 10]}>
        <div
          className="text-white text-xs bg-black bg-opacity-75 px-1 py-0.5 rounded text-center whitespace-nowrap cursor-pointer hover:bg-opacity-90 transition-colors"
          onClick={() => onLocationClick(location.id, viewpoint.id)}
          style={{ fontSize: '10px' }}
        >
          {viewpoint.name}
        </div>
      </Html>
    </group>
  );
};

/**
 * GoogleMapsDirectionIndicator component displays a directional cone on the 3D minimap,
 * showing the user's current viewing direction within the panorama.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.location - The current location object.
 * @param {Object} props.viewpoint - The current viewpoint object.
 * @param {number} props.direction - The user's current camera direction in radians.
 */
export const GoogleMapsDirectionIndicator = ({ location, viewpoint, direction }) => {
  // Adjust the direction by adding the viewpoint's specific direction offset.
  const adjustedDirection = direction + (viewpoint.directionOffset ? (viewpoint.directionOffset * Math.PI / 180) : 0);
  const position = viewpoint.minimap3DPosition; // Position the indicator at the current viewpoint

  return (
    <group position={position}>
      {/* Cone representing the direction */}
      <mesh rotation={[Math.PI / 2, 0, adjustedDirection - Math.PI / 2]}> {/* Rotate to point correctly */}
        <meshBasicMaterial color="#4285F4" /> {/* Google Maps blue color */}
        <primitive
          object={
            new THREE.Mesh(
              // Cone geometry, translated to point downwards from its base.
              new THREE.ConeGeometry(1, 1.5, 20).translate(0, -0.75, 0),
              new THREE.MeshBasicMaterial({
                color: "#4285F4",
                transparent: true,
                opacity: 1
              })
            )
          }
          scale={[1, 0.5, 1]} // Scale to make it flatter
        />
      </mesh>

      {/* Semi-transparent circle beneath the cone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#4285F4" transparent opacity={0.3} />
      </mesh>

      {/* White ring on top of the circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.25, 0.35, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};
