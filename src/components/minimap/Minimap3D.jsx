// src/components/minimap/Minimap3D.jsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MinimapModel from './MinimapModel'; // Import the 3D model component
import { MainLocationLabel, ViewpointMarker, GoogleMapsDirectionIndicator } from './MinimapMarkers'; // Import marker components
import { LOCATIONS } from '../../data/locations'; // Import location data

/**
 * Minimap3D component renders a 3D interactive minimap of the apartment.
 * It displays the loaded 3D model, location labels, viewpoint markers,
 * and a directional indicator for the user's current view.
 *
 * @param {Object} props - Component props.
 * @param {string} props.currentLocationId - ID of the currently active location.
 * @param {string} props.currentViewpointId - ID of the currently active viewpoint.
 * @param {number} props.userDirection - Current direction of the user's camera in radians.
 * @param {Function} props.onLocationClick - Callback to navigate to a new location/viewpoint.
 * @param {string|string[]} props.modelUrl - URL(s) to the 3D GLTF model(s) for the minimap.
 */
function Minimap3D({ currentLocationId, currentViewpointId, userDirection, onLocationClick, modelUrl }) {
  const currentLocationData = LOCATIONS[currentLocationId];
  const currentViewpointData = currentLocationData.viewpoints.find(v => v.id === currentViewpointId);

  return (
    <div className="w-full h-full">
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 12, 8], fov: 45 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <Suspense fallback={null}>
          {modelUrl && <MinimapModel modelUrl={modelUrl} />}
          {Object.values(LOCATIONS).map((location) => (
            <MainLocationLabel
              key={`label-${location.id}`}
              location={location}
              isCurrent={location.id === currentLocationId}
              onLocationClick={onLocationClick}
            />
          ))}
          {currentLocationData.viewpoints.map((viewpoint) => (
            <ViewpointMarker
              key={`${currentLocationId}-${viewpoint.id}`}
              location={currentLocationData}
              viewpoint={viewpoint}
              isCurrent={viewpoint.id === currentViewpointId}
              onLocationClick={onLocationClick}
            />
          ))}
          {currentViewpointData && (
            <GoogleMapsDirectionIndicator
              location={currentLocationData}
              viewpoint={currentViewpointData}
              direction={userDirection}
            />
          )}
        </Suspense>
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={8}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

export default Minimap3D;