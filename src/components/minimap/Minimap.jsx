import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import Minimap3D from './Minimap3D';
import Minimap2D from './Minimap2D';

/**
 * Minimap component styled with glassmorphic, warm-toned theme.
 */
function Minimap({ currentLocation, currentViewpoint, userDirection, onLocationClick, modelUrl, floorPlanImage }) {
  const [is3D, setIs3D] = useState(true);

  return (
    <div className="w-full h-full bg-transparent border border-white/20  bg-opacity-70 backdrop-blur-md rounded-2xl p-4 shadow-xl">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="text-white text-sm font-semibold flex items-center gap-2">
      <MapPin size={16} />
      {is3D ? '3D' : '2D'} Minimap
    </div>

    {/* Toggle Buttons */}
    <div className="flex bg-gray-700/40 rounded-full p-1 border border-amber-500/10">
      <button
        onClick={() => setIs3D(true)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
          is3D
            ? 'bg-gray-700 text-white shadow'
            : 'text-white hover:bg-gray-600'
        }`}
      >
        3D
      </button>
      <button
        onClick={() => setIs3D(false)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
          !is3D
            ? 'bg-gray-700 text-white shadow'
            : 'text-white hover:bg-gray-600'
        }`}
      >
        2D
      </button>
    </div>
  </div>

  {/* Minimap Content */}
  <div className="w-[24rem] h-[16rem] rounded-xl overflow-hidden">
    {is3D ? (
      <Minimap3D
        currentLocationId={currentLocation}
        currentViewpointId={currentViewpoint}
        userDirection={userDirection}
        onLocationClick={onLocationClick}
        modelUrl={modelUrl}
      />
    ) : (
      <Minimap2D
        currentLocation={currentLocation}
        currentViewpoint={currentViewpoint}
        userDirection={userDirection}
        onLocationClick={onLocationClick}
        floorPlanImage={floorPlanImage}
      />
    )}
  </div>
</div>

  );
}

export default Minimap;
