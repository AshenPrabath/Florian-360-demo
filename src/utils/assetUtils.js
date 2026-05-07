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
    process.env.PUBLIC_URL + '/assets/icons/3d-rotate.webp',
    process.env.PUBLIC_URL + '/assets/icons/arrow-expand.webp',
    process.env.PUBLIC_URL + '/assets/icons/arrow-shrink.webp',
    process.env.PUBLIC_URL + '/assets/icons/music.webp',
    process.env.PUBLIC_URL + '/assets/icons/music-mute.webp',
    process.env.PUBLIC_URL + '/assets/icons/left-arrow.webp',
    process.env.PUBLIC_URL + '/assets/icons/right-arrow.webp',
    process.env.PUBLIC_URL + '/assets/icons/pool.webp',
    process.env.PUBLIC_URL + '/assets/icons/beach.webp',
    process.env.PUBLIC_URL + '/assets/icons/tree-02.webp',
    process.env.PUBLIC_URL + '/assets/icons/yoga-02.webp',
    process.env.PUBLIC_URL + '/assets/icons/bed-single-02.webp'
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
    process.env.PUBLIC_URL + '/assets/icons/3d-rotate.webp',
    process.env.PUBLIC_URL + '/assets/icons/arrow-expand.webp',
    process.env.PUBLIC_URL + '/assets/icons/music.webp'
  ]);

  const startLoc = LOCATIONS[startLocationId];
  if (startLoc) {
    startLoc.viewpoints?.forEach(vp => {
      if (vp.image) essential.add(vp.image.startsWith('/') ? vp.image : `/${vp.image}`);
    });
  }

  return Array.from(essential);
};
