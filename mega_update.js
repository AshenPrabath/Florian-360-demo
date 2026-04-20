const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Zoom indicator and controls removal
content = content.replace(/\{\/\* Zoom Level Indicator \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*/, '');
const zoomControlsRegex = /<div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">\s*<button\s*onClick=\{resetZoom\}[\s\S]*?−\s*<\/button>\s*<\/div>/g;
content = content.replace(zoomControlsRegex, '');
const zoomControlsAltRegex = /\{\/\* Zoom Controls \*\/\}[\s\S]*?<div className="flex items-center bg-gray-700 text-white rounded-full overflow-hidden text-sm">\s*<button\s*onClick=\{resetZoom\}[\s\S]*?−\s*<\/button>\s*<\/div>/g;
content = content.replace(zoomControlsAltRegex, '');

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

// 3. TourControls Props (to use the new global index)
const tourControlsPropsRegex = /currentViewpointIndex={currentLocation\.viewpoints\.findIndex\([\s\S]*?hasNext=\{[\s\S]*?\}/g;
const newTourControlsProps = `currentViewpointIndex={currentGlobalIndex}
                  totalViewpoints={allGlobalViewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={currentGlobalIndex > 0}
                  hasNext={currentGlobalIndex < allGlobalViewpoints.length - 1}`;
content = content.replace(tourControlsPropsRegex, newTourControlsProps);

// 4. Mobile Layout Rearrangement
const mobileLayoutRegex = /\{(\/\* Row 1: Title and Essential Actions \*\/)\}\s*<div className="flex items-center justify-between px-4 py-2 border-b border-white\/10">\s*<div className="flex items-center gap-3">\s*<\/div>\s*<div className="flex items-center gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\{(\/\* Row 2: Navigation and Tour Controls \*\/)\}\s*<div className="flex items-center justify-between px-4 py-2 border-b border-white\/10">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newMobileLayout = `{/* Row 1: Actions & Navigation Toggle */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <button
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className={\`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 text-white \${isNavExpanded
                  ? "bg-gray-700 shadow"
                  : "bg-gray-700/50 hover:bg-gray-600"
                  }\`}
              >
                <Navigation size={16} />
                <span className="text-sm font-medium">Navigation</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                  onClick={() => navigate("/")}
                  title="Home"
                >
                  <Home size={16} />
                </button>
                <div className="flex-shrink-0">
                  <SoundToggleButton />
                </div>
              </div>
            </div>

            {/* Row 2: Viewpoint Navigation (Full Width) */}
            <div className="flex items-center justify-center px-4 py-2 border-b border-white/10">
              <TourControls
                currentViewpointName={currentViewpoint.name}
                currentViewpointIndex={currentGlobalIndex}
                totalViewpoints={allGlobalViewpoints.length}
                onPrev={prevViewpoint}
                onNext={nextViewpoint}
                hasPrev={currentGlobalIndex > 0}
                hasNext={currentGlobalIndex < allGlobalViewpoints.length - 1}
              />
            </div>`;

content = content.replace(mobileLayoutRegex, newMobileLayout);

// 5. Row 3: Utility Controls Distribution (Mobile)
const mobileRow3Regex = /\{\/\* Row 3: Utility Controls \*\/\}\s*<div className="flex items-center justify-between px-4 py-2">\s*<div className="flex items-center gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newMobileRow3 = `{/* Row 3: Utility Controls */}
            <div className="w-full px-2 py-2 pb-4">
              <div className="flex items-center w-full gap-2">
                <button
                  onClick={toggleAutoRotate}
                  className={\`flex-1 flex justify-center items-center gap-1.5 px-2 py-2 text-white rounded-full transition-all text-xs sm:text-sm whitespace-nowrap \${isAutoRotating
                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }\`}
                >
                  <img
                    src="/assets/icons/3d-rotate.png"
                    alt="Rotate Icon"
                    className={\`w-4 h-4 \${isAutoRotating ? "animate-spin" : ""
                      }\`}
                  />
                  <span>{isAutoRotating ? "Stop" : "Rotate"}</span>
                </button>

                <button
                  onClick={handleToggleGyro}
                  className={\`flex-1 flex justify-center items-center gap-1.5 px-2 py-2 text-white rounded-full transition-all text-xs sm:text-sm whitespace-nowrap \${isGyroEnabled
                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                    }\`}
                >
                  <Compass size={16} className={isGyroEnabled ? "animate-pulse" : ""} />
                  <span>Gyro</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="flex-1 flex justify-center items-center gap-1.5 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-xs sm:text-sm whitespace-nowrap"
                >
                  <img
                    src="/assets/icons/arrow-expand.png"
                    alt="Expand Icon"
                    className="w-4 h-4"
                  />
                  <span>Expand</span>
                </button>
              </div>
            </div>`;
content = content.replace(mobileRow3Regex, newMobileRow3);

// 6. Fix text overlap and flex-shrink-0 for other buttons
content = content.replace(/className={\`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2/g, 'className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0');
content = content.replace(/className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2"/g, 'className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0"');

// 7. h-[100dvh] and fixed inset-0 fix
content = content.replace(
  '<div className="w-full h-screen bg-black relative overflow-hidden -mt-20">',
  '<div className="fixed inset-0 w-full h-[100dvh] bg-black overflow-hidden m-0 p-0">'
);

// 8. useMemo import
if (!content.includes('useMemo,')) {
  content = content.replace(
    'useEffect,\n} from "react";',
    'useEffect,\n  useMemo,\n} from "react";'
  );
}

// 9. Remove unused zoom functions
content = content.replace(/const zoomIn = [\s\S]*?const resetZoom = [\s\S]*?;/g, '');

fs.writeFileSync(filePath, content);
console.log('Mega update successful');
