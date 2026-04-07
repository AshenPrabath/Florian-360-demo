// AudioContext.jsx
import React, { createContext, useState, useEffect, useRef } from "react";

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/assets/music/music.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    
    // Listen for user interaction to enable audio
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      
      // Try to play audio after first user interaction
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            console.log("Audio started playing");
          })
          .catch((error) => {
            console.error("Audio play failed:", error);
          });
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasUserInteracted(true);
        })
        .catch((error) => {
          console.error("Audio play failed:", error);
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // If user is unmuting and audio isn't playing, start it
    if (isMuted && !isPlaying && hasUserInteracted) {
      togglePlay();
    }
  };

  return (
    <AudioContext.Provider value={{ 
      isMuted, 
      setIsMuted,
      toggleMute,
      isPlaying, 
      togglePlay,
      hasUserInteracted
    }}>
      {children}
    </AudioContext.Provider>
  );
};