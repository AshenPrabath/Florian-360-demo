import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';

/**
 * TourControls component provides navigation buttons (previous/next)
 * for moving between viewpoints within the current location.
 * Updated for horizontal bottom bar layout and Day/Night toggle.
 */
function TourControls({
  currentViewpointName,
  currentViewpointIndex,
  totalViewpoints,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  isNightMode,
  onToggleNightMode,
  hasNight
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

      {/* Day/Night Toggle */}
      <button
        onClick={onToggleNightMode}
        disabled={!hasNight}
        className={`p-2 rounded-full transition-all flex items-center justify-center gap-2 px-3 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale ${
          isNightMode 
            ? 'bg-indigo-900/40 text-blue-300 border-blue-500/30' 
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        } ${!hasNight ? '' : 'hover:scale-105 active:scale-95'}`}
        title={!hasNight ? "Night version not available for this room" : (isNightMode ? "Switch to Day" : "Switch to Night")}
      >
        {isNightMode ? <Moon size={18} /> : <Sun size={18} />}
        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">
          {isNightMode ? 'Night' : 'Day'}
        </span>
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