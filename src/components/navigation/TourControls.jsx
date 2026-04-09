import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * TourControls component provides navigation buttons (previous/next)
 * for moving between viewpoints within the current location.
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
  return (
    <div className="flex items-center gap-3">
      {/* Previous Viewpoint Button */}
      <button
        onClick={onPrev}
        disabled={!hasPrev || totalViewpoints <= 1}
        className="p-2 rounded-full bg-gray-700/50 text-white hover:bg-[#DCC5B7] hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>


      {/* Current Viewpoint Information */}
      <div className="text-center px-4 min-w-[120px]">
        <div className="text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap opacity-80 mb-0.5">
          {currentViewpointName}
        </div>
        <div className="text-white/30 text-[10px] font-mono tracking-tighter">
          VIEW {currentViewpointIndex + 1} OF {totalViewpoints}
        </div>
      </div>

      {/* Next Viewpoint Button */}
      <button
        onClick={onNext}
        disabled={!hasNext || totalViewpoints <= 1}
        className="p-2 rounded-full bg-gray-700/50 text-white hover:bg-[#DCC5B7] hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default TourControls;