// src/components/navigation/TourControls.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * TourControls component provides navigation buttons (previous/next)
 * for moving between viewpoints within the current location.
 * Updated for horizontal bottom bar layout.
 */
function TourControls({
  currentViewpointName,
  currentViewpointIndex,
  totalViewpoints,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}) {
  // Only render the controls if there's more than one viewpoint available for navigation.
  if (totalViewpoints <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
  {/* Previous Viewpoint Button */}
  <button
    onClick={onPrev}
    disabled={!hasPrev}
    className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <ChevronLeft size={20} />
  </button>

  {/* Current Viewpoint Information */}
  <div className="text-center px-4">
    <div className="text-white text-sm font-medium whitespace-nowrap">
      {currentViewpointName}
    </div>
    <div className="text-gray-400 text-xs">
      {currentViewpointIndex + 1} / {totalViewpoints}
    </div>
  </div>

  {/* Next Viewpoint Button */}
  <button
    onClick={onNext}
    disabled={!hasNext}
    className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <ChevronRight size={20} />
  </button>
</div>

  );
}

export default TourControls;