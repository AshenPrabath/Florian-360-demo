// src/utils/assetUtils.js
import { LOCATIONS } from '../data/locations';

/**
 * Dynamically discovers all unique asset paths from the LOCATIONS data structure.
 * This ensures that any panorama or icon added via the editor is automatically preloaded.
 */
export const getTourAssets = () => {
  const images = new Set();
  const icons = new Set([
     // Static UI icons that might not be in the dynamic location data but are in assets/icons
    '/assets/icons/3d-rotate.png',
    '/assets/icons/arrow-expand.png',
    '/assets/icons/arrow-shrink.png',
    '/assets/icons/music.png',
    '/assets/icons/music-mute.png',
    '/assets/icons/left-arrow.png',
    '/assets/icons/right-arrow.png',
    '/assets/icons/pool.png',
    '/assets/icons/beach.png',
    '/assets/icons/tree-02.png',
    '/assets/icons/yoga-02.png',
    '/assets/icons/bed-single-02.png'
  ]);

  // Navigate through LOCATIONS to find ALL images
  Object.values(LOCATIONS).forEach(location => {
    // Check location-level assets (like if there were any)
    
    // Check viewpoint assets
    location.viewpoints?.forEach(viewpoint => {
      if (viewpoint.image) images.add(viewpoint.image.startsWith('/') ? viewpoint.image : `/${viewpoint.image}`);
      
      // Check for transition videos if any are defined in hotspots
      viewpoint.hotspots?.forEach(hotspot => {
        if (hotspot.transitionVideo) {
          // Add transition videos to a separate set if needed, or just images
        }
      });
    });
  });

  return {
    images: Array.from(images),
    icons: Array.from(icons)
  };
};

/**
 * Returns a list of "essential" assets needed to render the initial home and first room.
 * @param {string} startLocationId - The ID of the starting location.
 */
export const getEssentialAssets = (startLocationId = 'living') => {
  const essential = new Set([
     '/assets/images/7_Day.jpg', // Home Background - adjust if this is dynamic later
     '/assets/icons/3d-rotate.png',
     '/assets/icons/arrow-expand.png',
     '/assets/icons/music.png'
  ]);

  const startLoc = LOCATIONS[startLocationId];
  if (startLoc) {
    startLoc.viewpoints?.forEach(vp => {
      if (vp.image) essential.add(vp.image.startsWith('/') ? vp.image : `/${vp.image}`);
    });
  }

  return Array.from(essential);
};
