// src/components/minimap/Minimap2D.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LOCATIONS } from '../../data/locations'; // Import location data

/**
 * LocationMarker2D component for displaying a location marker on the 2D minimap.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.location - The location object.
 * @param {boolean} props.isCurrent - True if this is the current active location.
 * @param {Function} props.onLocationClick - Callback to navigate to this location.
 * @param {string | null} props.hoveredLocation - ID of the currently hovered location.
 * @param {Function} props.setHoveredLocation - Setter for hovered location state.
 */
const LocationMarker2D = ({ location, isCurrent, onLocationClick, hoveredLocation, setHoveredLocation }) => {
  const pos = location.minimap2DPosition; // Direct 2D position from location data

  return (
    <div
      className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-200 z-20 ${
        isCurrent ? 'bg-yellow-400 border-yellow-600 scale-125' : 'bg-gray-600 border-gray-400'
      } ${hoveredLocation === location.id ? 'scale-110' : ''}`}
      style={{
        left: pos.x - 12, // Adjust for centering the marker
        top: pos.y - 12, // Adjust for centering the marker
        backgroundColor: isCurrent ? location.color : '#6B7280', // Current location uses its color, others gray
        borderColor: location.color // Border always uses location color
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling to parent (minimap pan/zoom)
        onLocationClick(location.id, location.viewpoints[0].id); // Navigate to first viewpoint of this location
      }}
      onMouseEnter={() => setHoveredLocation(location.id)} // Set hovered state
      onMouseLeave={() => setHoveredLocation(null)} // Clear hovered state
    >
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div
          className="text-white text-xs font-medium bg-black bg-opacity-75 px-2 py-1 rounded cursor-pointer"
          style={{ borderLeft: `3px solid ${location.color}` }} // Color-coded left border
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            onLocationClick(location.id, location.viewpoints[0].id);
          }}
        >
          {location.name}
          {isCurrent && <span className="ml-1 text-yellow-400">●</span>} {/* Current indicator */}
        </div>
      </div>
    </div>
  );
};

/**
 * ViewpointMarker2D component for displaying individual viewpoint markers on the 2D minimap.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.location - The parent location object.
 * @param {Object} props.viewpoint - The viewpoint object.
 * @param {boolean} props.isCurrent - True if this is the current active viewpoint.
 * @param {Function} props.onLocationClick - Callback to navigate to this viewpoint.
 */
const ViewpointMarker2D = ({ location, viewpoint, isCurrent, onLocationClick }) => {
  const pos = viewpoint.minimap2DPosition; // Direct 2D position from viewpoint data

  return (
    <div
      className={`absolute w-4 h-4 rounded-full cursor-pointer transition-all duration-200 z-20 ${
        isCurrent ? 'bg-yellow-400 scale-125' : 'bg-blue-400'
      }`}
      style={{
        left: pos.x - 8, // Adjust for centering
        top: pos.y - 8, // Adjust for centering
        backgroundColor: isCurrent ? '#FFD700' : location.color, // Yellow if current, otherwise location color
        opacity: isCurrent ? 1 : 0.7
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        onLocationClick(location.id, viewpoint.id); // Navigate to this specific viewpoint
      }}
    >
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div
          className="text-white bg-black bg-opacity-75 px-1 py-0.5 rounded cursor-pointer hover:bg-opacity-90 transition-colors"
          style={{ fontSize: '10px' }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            onLocationClick(location.id, viewpoint.id);
          }}
        >
          {viewpoint.name}
        </div>
      </div>
    </div>
  );
};

/**
 * DirectionIndicator2D component displays a directional arrow on the 2D minimap,
 * showing the user's current viewing direction.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.location - The current location object.
 * @param {Object} props.viewpoint - The current viewpoint object.
 * @param {number} props.direction - The user's current camera direction in radians.
 */
const DirectionIndicator2D = ({ location, viewpoint, direction }) => {
  // Add safety check for viewpoint
  if (!viewpoint) {
    console.warn('DirectionIndicator2D: viewpoint is undefined');
    return null;
  }

  // Adjust the direction by adding the viewpoint's specific direction offset.
  const adjustedDirection = direction + (viewpoint.directionOffset ? (viewpoint.directionOffset * Math.PI / 180) : 0);
  const pos = viewpoint.minimap2DPosition; // Position the indicator at the current viewpoint

  return (
    <div
      className="absolute w-8 h-8 pointer-events-none z-30"
      style={{
        left: pos.x - 16, // Adjust for centering
        top: pos.y - 16, // Adjust for centering
        transform: `rotate(${adjustedDirection + Math.PI / 2}rad)` // Rotate the arrow
      }}
    >
      {/* Outer circle of the indicator */}
      <div className="w-full h-full bg-blue-500 rounded-full opacity-30"></div>
      {/* Triangle representing the arrow head */}
      <div
        className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '12px solid #3B82F6' // Blue arrow color
        }}
      ></div>
    </div>
  );
};

/**
 * Minimap2D component provides a pannable and zoomable 2D minimap with a floor plan image.
 * It displays location and viewpoint markers, and a directional indicator.
 *
 * @param {Object} props - Component props.
 * @param {string} props.currentLocation - ID of the currently active location.
 * @param {string} props.currentViewpoint - ID of the currently active viewpoint.
 * @param {number} props.userDirection - Current direction of the user's camera in radians.
 * @param {Function} props.onLocationClick - Callback to navigate to a new location/viewpoint.
 * @param {string} props.floorPlanImage - URL to the 2D floor plan image.
 */
function Minimap2D({ currentLocation, currentViewpoint, userDirection, onLocationClick, floorPlanImage }) {
  const [hoveredLocation, setHoveredLocation] = useState(null); // State for hovered location labels
  const [zoom, setZoom] = useState(1); // Zoom level state
  const [pan, setPan] = useState({ x: 0, y: 0 }); // Pan position state
  const [isDragging, setIsDragging] = useState(false); // Flag for dragging
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Starting point of a drag
  const containerRef = useRef(); // Ref for the pannable container

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault(); // Prevent default scroll behavior
    e.stopPropagation(); // Stop event propagation
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // Determine zoom direction
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta)); // Clamp zoom within bounds
    setZoom(newZoom);
  }, [zoom]); // Dependency: zoom state

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 0) { // Only for left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); // Calculate drag start offset
    }
  }, [pan]); // Dependency: pan state

  // Handle mouse move for continuous dragging
  const handleMouseMove = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]); // Dependencies: isDragging, dragStart

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Effect to add/remove global mouse listeners when dragging starts/stops
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      };

      const handleGlobalMouseUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      };

      // Add global listeners to ensure drag continues even if mouse leaves the element
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });

      // Cleanup function to remove listeners when component unmounts or dragging stops
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart]); // Dependencies: isDragging, dragStart

  // Reset zoom and pan to initial state
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Zoom in/out functions for buttons
  const zoomIn = () => setZoom(prev => Math.min(3, prev * 1.2));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev / 1.2));

  // Find current viewpoint with safety check
  const currentViewpointObj = LOCATIONS[currentLocation]?.viewpoints.find(v => v.id === currentViewpoint);
  
  // Add debug logging
  if (!currentViewpointObj) {
    console.warn('Minimap2D: Could not find viewpoint', currentViewpoint, 'in location', currentLocation);
    console.warn('Available viewpoints:', LOCATIONS[currentLocation]?.viewpoints.map(v => v.id));
  }

  return (
    <div className="w-full h-full relative overflow-hidden rounded ">
      {/* Zoom and Reset controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-40">
        <button
          onClick={zoomIn}
          className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded text-xs font-bold w-6 h-6 flex items-center justify-center"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded text-xs font-bold w-6 h-6 flex items-center justify-center"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded text-xs w-6 h-6 flex items-center justify-center"
          title="Reset View"
        >
          ⌂
        </button>
      </div>

      {/* Instruction text */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 z-40 bg-black bg-opacity-50 px-2 py-1 rounded">
        Drag to pan • Scroll to zoom
      </div>

      {/* Pannable and Zoomable container for the minimap content */}
      <div
        ref={containerRef}
        className="w-full h-full relative select-none"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab', // Change cursor based on dragging state
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, // Apply pan and zoom transforms
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out', // Smooth transition when not dragging
          userSelect: 'none', // Prevent text selection during drag
          touchAction: 'none' // Disable default touch actions to prevent browser gestures
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // End drag if mouse leaves the container
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right-click
      >
        {/* Floor plan image */}
        {floorPlanImage && (
          <img
            src={floorPlanImage}
            alt="Floor Plan"
            className="w-full h-full object-cover opacity-60 pointer-events-none" // Make image slightly transparent and non-interactive
            draggable={false} // Prevent image dragging
          />
        )}

        {/* Optional grid overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Render 2D markers for all locations */}
        {Object.values(LOCATIONS).map((location) => (
          <LocationMarker2D
            key={location.id}
            location={location}
            isCurrent={location.id === currentLocation}
            onLocationClick={onLocationClick}
            hoveredLocation={hoveredLocation}
            setHoveredLocation={setHoveredLocation}
          />
        ))}

        {/* Render 2D markers for all viewpoints within the current location */}
        {LOCATIONS[currentLocation]?.viewpoints.map((viewpoint) => (
          <ViewpointMarker2D
            key={`${currentLocation}-${viewpoint.id}`}
            location={LOCATIONS[currentLocation]}
            viewpoint={viewpoint}
            isCurrent={viewpoint.id === currentViewpoint}
            onLocationClick={onLocationClick}
          />
        ))}

        {/* Render the 2D directional indicator at the current viewpoint - only if viewpoint exists */}
        {currentViewpointObj && (
          <DirectionIndicator2D
            location={LOCATIONS[currentLocation]}
            viewpoint={currentViewpointObj}
            direction={userDirection}
          />
        )}
      </div>
    </div>
  );
}

export default Minimap2D;