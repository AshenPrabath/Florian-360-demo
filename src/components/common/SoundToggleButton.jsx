// SoundToggleButton.jsx
import { useContext } from "react";
import { AudioContext } from "../../context/AudioContext";

const SoundToggleButton = () => {
  const { isMuted, isPlaying, toggleMute, togglePlay, hasUserInteracted } = useContext(AudioContext);

  const handleClick = () => {
    if (!hasUserInteracted) {
      // First interaction - start playing
      togglePlay();
    } else {
      // Subsequent interactions - toggle mute
      toggleMute();
    }
  };

  // Determine which icon to show
  const getIcon = () => {
    if (!hasUserInteracted) {
      return "/assets/icons/music.png"; // Show play icon
    }
    return isMuted ? "/assets/icons/music-mute.png" : "/assets/icons/music.png";
  };

  const getAltText = () => {
    if (!hasUserInteracted) {
      return "Click to start music";
    }
    return isMuted ? "Muted - Click to unmute" : "Playing - Click to mute";
  };

  return (
    <button
      onClick={handleClick}
      className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 flex items-center justify-center border border-white/30"
      title={getAltText()}
    >
      <img
        src={getIcon()}
        alt={getAltText()}
        className="w-4 h-4"
      />
      
    </button>
  );
};

export default SoundToggleButton;