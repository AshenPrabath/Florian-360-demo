// src/utils/usePanoramaCache.js
//
// Graph-aware, wave-based background preloader for panorama images.
//
// Strategy:
//   Wave 0 – the active viewpoint's image (loaded by Three.js useTexture automatically)
//   Wave 1 – all viewpoints directly reachable via hotspots from the active viewpoint
//   Wave N – repeated every time the user navigates to a new viewpoint
//
// Mechanism: prime the browser's HTTP cache via `new Image()` so that when
// Three.js `useTexture` fires it fetches from memory/disk cache — instant.

import { useRef, useCallback, useEffect } from 'react';
import { LOCATIONS } from '../data/locations';

// ---------------------------------------------------------------------------
// Helper: schedule work on the idle thread (graceful degradation for Safari)
// ---------------------------------------------------------------------------
const scheduleIdle = (fn) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 100);
  }
};

// ---------------------------------------------------------------------------
// Helper: normalise image path to an absolute URL the browser can fetch
// ---------------------------------------------------------------------------
const toAbsoluteUrl = (imagePath) => {
  if (!imagePath || imagePath === 'pending_upload') return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) return imagePath;
  // Strip any leading slash then re-add so we're always consistent
  const clean = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return clean;
};

// ---------------------------------------------------------------------------
// Helper: collect all viewpoint IDs linked from a given viewpoint's hotspots
// ---------------------------------------------------------------------------
const getNeighborViewpointIds = (locationId, viewpointId) => {
  const location = LOCATIONS[locationId];
  if (!location) return [];
  const viewpoint = location.viewpoints.find((v) => v.id === viewpointId);
  if (!viewpoint) return [];

  const neighborIds = [];
  viewpoint.hotspots?.forEach((hotspot) => {
    const targetLoc = LOCATIONS[hotspot.target];
    if (!targetLoc) return;
    const targetVp = targetLoc.viewpoints.find((v) => v.id === hotspot.targetViewpoint);
    if (targetVp) {
      neighborIds.push({
        locationId: hotspot.target,
        viewpointId: hotspot.targetViewpoint,
        imagePath: targetVp.image,
      });
    }
  });
  return neighborIds;
};

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------
export function usePanoramaCache() {
  // Map<viewpointId, HTMLImageElement> — holds references keeping browser cache warm
  const cache = useRef(new Map());
  // Set<viewpointId> — tracks in-flight fetches to avoid duplicates
  const inFlight = useRef(new Set());

  /**
   * Preload a list of { locationId, viewpointId, imagePath } descriptors
   * in the background. Safe to call multiple times with overlapping lists.
   */
  const preloadBatch = useCallback((descriptors) => {
    const toFetch = descriptors.filter(
      ({ viewpointId, imagePath }) =>
        imagePath &&
        imagePath !== 'pending_upload' &&
        !cache.current.has(viewpointId) &&
        !inFlight.current.has(viewpointId)
    );

    if (toFetch.length === 0) return;

    scheduleIdle(() => {
      toFetch.forEach(({ viewpointId, imagePath }) => {
        const urlHi = toAbsoluteUrl(imagePath);
        const urlLow = urlHi ? urlHi.replace(/\.jpg$/i, '_low.jpg') : null;
        if (!urlLow) return;

        inFlight.current.add(viewpointId);

        // Preload Low-Res first
        const imgLow = new window.Image();
        // Load High-Res in parallel
        const imgHi = new window.Image();

        let loadedCount = 0;
        const markDone = () => {
          loadedCount++;
          if (loadedCount === 2) {
            cache.current.set(viewpointId, true); // Value doesn't matter, just presence
            inFlight.current.delete(viewpointId);
          }
        };

        imgLow.onload = markDone;
        imgHi.onload = markDone;

        const handleError = () => {
          inFlight.current.delete(viewpointId);
        };

        imgLow.onerror = handleError;
        imgHi.onerror = handleError;

        imgLow.src = urlLow;
        imgHi.src = urlHi;
      });
    });
  }, []);

  /**
   * Call this whenever the user navigates to a new viewpoint.
   * It queues a background preload of all viewpoints reachable from the new position.
   *
   * @param {string} locationId
   * @param {string} viewpointId
   */
  const onViewpointChange = useCallback(
    (locationId, viewpointId) => {
      const neighbors = getNeighborViewpointIds(locationId, viewpointId);
      preloadBatch(neighbors);
    },
    [preloadBatch]
  );

  /**
   * Returns true if the image for the given viewpoint has been preloaded
   * and is sitting in the browser cache.
   */
  const isCached = useCallback((viewpointId) => cache.current.has(viewpointId), []);

  return { isCached, onViewpointChange, preloadBatch };
}

// ---------------------------------------------------------------------------
// Pure helper (no hook) — find the entry point from LOCATIONS
// ---------------------------------------------------------------------------
export function getEntryPoint() {
  for (const [locationId, location] of Object.entries(LOCATIONS)) {
    for (const viewpoint of location.viewpoints) {
      if (viewpoint.isEntryPoint) {
        return { locationId, viewpointId: viewpoint.id };
      }
    }
  }
  // Graceful fallback: first viewpoint of first location
  const firstLocationId = Object.keys(LOCATIONS)[0];
  const firstViewpointId = LOCATIONS[firstLocationId]?.viewpoints[0]?.id;
  return { locationId: firstLocationId, viewpointId: firstViewpointId };
}
