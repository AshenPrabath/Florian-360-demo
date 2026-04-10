// src/utils/assetUtils.js
// NOTE: Bulk preloading has been replaced by the graph-aware wave-based
// system in usePanoramaCache.js. This file is kept for any legacy callers
// but its functions are no longer called by the tour.

import { LOCATIONS } from '../data/locations';

/**
 * @deprecated Use usePanoramaCache from usePanoramaCache.js instead.
 * Returns all unique asset paths from the LOCATIONS data structure.
 */
export const getTourAssets = () => {
  const images = new Set();
  const icons = new Set([
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

  Object.values(LOCATIONS).forEach(location => {
    location.viewpoints?.forEach(viewpoint => {
      if (viewpoint.image) images.add(viewpoint.image.startsWith('/') ? viewpoint.image : `/${viewpoint.image}`);
    });
  });

  return {
    images: Array.from(images),
    icons: Array.from(icons)
  };
};

/**
 * @deprecated No longer used — entry point is determined by the isEntryPoint
 * flag in locations data. See getEntryPoint() in usePanoramaCache.js.
 */
export const getEssentialAssets = (startLocationId = 'living') => {
  const essential = new Set([
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
