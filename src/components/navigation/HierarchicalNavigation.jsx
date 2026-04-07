// src/components/navigation/HierarchicalNavigation.jsx
import React, { useState, useEffect } from 'react';
import { Home, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { LOCATIONS } from '../../data/locations'; // Import location data

/**
 * HierarchicalNavigation component provides a structured list of locations and viewpoints
 * for easy navigation within the virtual tour.
 * It allows expanding/collapsing locations and directly jumping to any viewpoint.
 *
 * @param {Object} props - Component props.
 * @param {string} props.currentLocationId - ID of the currently active location.
 * @param {string} props.currentViewpointId - ID of the currently active viewpoint.
 * @param {Function} props.onNavigate - Callback function to navigate to a new location/viewpoint.
 * @param {boolean} props.isExpanded - State indicating if the main navigation panel is expanded.
 * @param {Function} props.onToggleExpand - Callback to toggle the main navigation panel expansion.
 */
function HierarchicalNavigation({ currentLocationId, currentViewpointId, onNavigate, isExpanded, onToggleExpand }) {
  // State to manage which locations are expanded in the hierarchical list
  // Initializes with the current location expanded.
  const [expandedLocations, setExpandedLocations] = useState({ [currentLocationId]: true });
  const currentLocation = LOCATIONS[currentLocationId]; // Get the data for the current location

  // Toggles the expansion state of a specific location in the list.
  const toggleLocationExpansion = (locationId) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId] // Toggle the boolean for the given locationId
    }));
  };

  // Effect to ensure the current location is always expanded when the current location changes.
  useEffect(() => {
    setExpandedLocations(prev => ({
      ...prev,
      [currentLocationId]: true // Ensure current location is expanded
    }));
  }, [currentLocationId]); // Dependency array: re-run when currentLocationId changes

  return (
    <div className="bg-transparent backdrop-blur-md text-white rounded-2xl border border-white/20 overflow-hidden shadow-lg">
      {/* Header section */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home size={18} className="text-white" />
            <span className="font-semibold">{currentLocation.name}</span>
          </div>
          <button
            onClick={onToggleExpand}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
        <div className="text-sm text-gray-300 mt-1">
          {currentLocation.viewpoints.find(v => v.id === currentViewpointId)?.description}
        </div>
      </div>

      {/* Expandable list */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {Object.values(LOCATIONS).map((location) => (
            <div key={location.id} className="border-b border-gray-700 last:border-b-0">
              {/* Location Header */}
              <div
                className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
    ${location.id === currentLocationId
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                  }`}
                style={{ borderLeft: `4px solid ${location.color}` }}
                onClick={() => toggleLocationExpansion(location.id)}
              >
                <div>
                  <div className="font-medium">{location.name}</div>
                  <div className="text-xs text-gray-400">{location.viewpoints.length} viewpoints</div>
                </div>
                <div className="text-white">
                  {expandedLocations[location.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Viewpoint Items */}
              {expandedLocations[location.id] && (
                <div className="bg-white/5">
                  {location.viewpoints.map((viewpoint) => {
                    const isCurrent = viewpoint.id === currentViewpointId && location.id === currentLocationId;
                    return (
                      <div
                        key={viewpoint.id}
                        onClick={() => onNavigate(location.id, viewpoint.id)}
                        className={`px-8 py-2 cursor-pointer transition-all duration-200 flex items-center gap-3
            ${isCurrent
                            ? 'bg-white/15 text-white'
                            : 'hover:bg-white/10 text-gray-300'
                          }`}
                      >
                        <Circle
                          size={8}
                          className={`${isCurrent
                            ? 'fill-current text-amber-400'
                            : 'text-gray-500'
                            }`}
                        />
                        <div>
                          <div className="text-sm font-medium">{viewpoint.name}</div>
                          <div className="text-xs text-gray-400">{viewpoint.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HierarchicalNavigation;
