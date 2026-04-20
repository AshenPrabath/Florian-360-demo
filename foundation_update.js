const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Zoom indicator and controls removal
content = content.replace(/\{\/\* Zoom Level Indicator \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*/, '');
const zoomControlsRegex = /<div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">\s*<button\s*onClick=\{resetZoom\}[\s\S]*?−\s*<\/button>\s*<\/div>/g;
content = content.replace(zoomControlsRegex, '');

// 2. Navigation logic and Global Viewpoints
const viewpointLogicRegex = /const nextViewpoint = useCallback\(\(\) => \{[\s\S]*?const prevViewpoint = useCallback\(\(\) => \{[\s\S]*?\}, \[currentLocation, currentViewpointId\]\);/;
const newViewpointLogic = `const allGlobalViewpoints = useMemo(() => {
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

content = content.replace(viewpointLogicRegex, newViewpointLogic);

// 3. useMemo import
if (!content.includes('useMemo,')) {
  content = content.replace(
    'useEffect,\n} from "react";',
    'useEffect,\n  useMemo,\n} from "react";'
  );
}

// 4. h-[100dvh] fix
content = content.replace(
  '<div className="w-full h-screen bg-black relative overflow-hidden -mt-20">',
  '<div className="fixed inset-0 w-full h-[100dvh] bg-black overflow-hidden m-0 p-0">'
);

// 5. Remove unused zoom functions
content = content.replace(/const zoomIn = [\s\S]*?const resetZoom = [\s\S]*?;/g, '');

fs.writeFileSync(filePath, content);
console.log('Foundation update successful');
