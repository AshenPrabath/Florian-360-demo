const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import useMemo
content = content.replace(
  `import React, {
  useState,
  Suspense,
  useCallback,
  useRef,
  useEffect,
} from "react";`,
  `import React, {
  useState,
  Suspense,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";`
);

// 2. Viewpoint Navigation Logic
const oldViewpointLogic = `  const nextViewpoint = useCallback(() => {
    const currentIndex = currentLocation.viewpoints.findIndex(
      (v) => v.id === currentViewpointId
    );
    if (currentIndex < currentLocation.viewpoints.length - 1) {
      const nextViewpoint = currentLocation.viewpoints[currentIndex + 1];
      setCurrentViewpointId(nextViewpoint.id);
    }
  }, [currentLocation, currentViewpointId]);

  const prevViewpoint = useCallback(() => {
    const currentIndex = currentLocation.viewpoints.findIndex(
      (v) => v.id === currentViewpointId
    );
    if (currentIndex > 0) {
      const prevViewpoint = currentLocation.viewpoints[currentIndex - 1];
      setCurrentViewpointId(prevViewpoint.id);
    }
  }, [currentLocation, currentViewpointId]);`;

const newViewpointLogic = `  const allGlobalViewpoints = useMemo(() => {
    return Object.values(LOCATIONS).flatMap((location) =>
      location.viewpoints.map((vp) => ({ ...vp, locationId: location.id }))
    );
  }, []);

  const currentGlobalIndex = allGlobalViewpoints.findIndex(
    (v) => v.id === currentViewpointId && v.locationId === currentLocationId
  );

  const nextViewpoint = useCallback(() => {
    if (currentGlobalIndex < allGlobalViewpoints.length - 1) {
      const next = allGlobalViewpoints[currentGlobalIndex + 1];
      navigateToViewpoint(next.locationId, next.id);
    }
  }, [currentGlobalIndex, allGlobalViewpoints, navigateToViewpoint]);

  const prevViewpoint = useCallback(() => {
    if (currentGlobalIndex > 0) {
      const prev = allGlobalViewpoints[currentGlobalIndex - 1];
      navigateToViewpoint(prev.locationId, prev.id);
    }
  }, [currentGlobalIndex, allGlobalViewpoints, navigateToViewpoint]);`;
content = content.replace(oldViewpointLogic, newViewpointLogic);

// 3. TourControls Props (all instances)
const oldTourControlsProps = `                  currentViewpointIndex={currentLocation.viewpoints.findIndex(
                    (v) => v.id === currentViewpointId
                  )}
                  totalViewpoints={currentLocation.viewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) > 0
                  }
                  hasNext={
                    currentLocation.viewpoints.findIndex(
                      (v) => v.id === currentViewpointId
                    ) <
                    currentLocation.viewpoints.length - 1
                  }`;

const newTourControlsProps = `                  currentViewpointIndex={currentGlobalIndex}
                  totalViewpoints={allGlobalViewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={currentGlobalIndex > 0}
                  hasNext={currentGlobalIndex < allGlobalViewpoints.length - 1}`;
content = content.split(oldTourControlsProps).join(newTourControlsProps);

// 4. Remove Zoom Indicator
content = content.replace(/\{\/\* Zoom Level Indicator \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*/, '');

// 5. Remove Zoom Controls blocks
const zoomControlsRegex = /<div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">\s*<button\s*onClick=\{resetZoom\}[\s\S]*?−\s*<\/button>\s*<\/div>/g;
content = content.replace(zoomControlsRegex, '');

const zoomControlsAltRegex = /\{\/\* Zoom Controls \*\/\}[\s\S]*?<div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">\s*<button\s*onClick=\{resetZoom\}[\s\S]*?−\s*<\/button>\s*<\/div>/g;
content = content.replace(zoomControlsAltRegex, '');

// 6. Fix text overlap issues (add whitespace-nowrap and flex-shrink-0 to the utility buttons)
content = content.replace(/className={\`flex items-center gap-2 px-3 py-2 text-white rounded-full transition-all text-sm/g, 'className={`flex items-center gap-2 px-3 py-2 text-white rounded-full transition-all text-sm whitespace-nowrap flex-shrink-0');
content = content.replace(/className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm"/g, 'className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm whitespace-nowrap flex-shrink-0"');

content = content.replace(/className={\`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2/g, 'className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0');
content = content.replace(/className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2"/g, 'className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0"');

fs.writeFileSync(filePath, content);
console.log('Update Complete');
