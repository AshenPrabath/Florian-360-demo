import { LOCATIONS } from './src/data/locations.js';

function getEntryPoint() {
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

console.log(getEntryPoint());
