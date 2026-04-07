// src/components/navigation/BreadcrumbNavigation.jsx
import React from 'react';
import { LOCATIONS } from '../../data/locations';

/**
 * BreadcrumbNavigation component displays the current location and viewpoint
 * in a hierarchical "breadcrumb" format, allowing quick navigation back to the location's
 * default viewpoint.
 */
function BreadcrumbNavigation({ currentLocationId, currentViewpointId, onNavigate }) {
  const currentLocation = LOCATIONS[currentLocationId];
  const currentViewpoint = currentLocation.viewpoints.find(v => v.id === currentViewpointId);

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onNavigate(currentLocationId, currentLocation.viewpoints[0].id)}
        className="text-gray-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
      >
        {currentLocation.name}
      </button>
      <span className="text-gray-500">/</span>
      <span className="text-white font-medium px-2 py-1">
        {currentViewpoint?.name}
      </span>
    </div>
  );
}

export default BreadcrumbNavigation;