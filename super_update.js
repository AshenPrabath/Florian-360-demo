const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Restore the missing useMemo import
content = content.replace(
  'useEffect,\n} from "react";',
  'useEffect,\n  useMemo,\n} from "react";'
);

// 2. Fix the 100dvh mobile URL bar issue
content = content.replace(
  '<div className="w-full h-screen bg-black relative overflow-hidden -mt-20">',
  '<div className="w-full h-[100dvh] bg-black relative overflow-hidden -mt-20">'
);

// 3. Re-run previous regex fixes if needed: Viewpoint Nav Logic
const viewpointRegex = /const nextViewpoint = useCallback\(\(\) => \{[\s\S]*?const prevViewpoint = useCallback\(\(\) => \{[\s\S]*?\}, \[currentLocation, currentViewpointId\]\);/;
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

content = content.replace(viewpointRegex, newViewpointLogic);

// 4. TourControls Props
const tourControlsPropsRegex = /currentViewpointIndex={currentLocation\.viewpoints\.findIndex\([\s\S]*?hasNext=\{[\s\S]*?\}/g;
const newTourControlsProps = `currentViewpointIndex={currentGlobalIndex}
                  totalViewpoints={allGlobalViewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={currentGlobalIndex > 0}
                  hasNext={currentGlobalIndex < allGlobalViewpoints.length - 1}`;

content = content.replace(tourControlsPropsRegex, newTourControlsProps);

// 5. Mobile View Layout for Row 3: Utility Controls
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
            </div>
          </div>`;

content = content.replace(mobileRow3Regex, newMobileRow3);

fs.writeFileSync(filePath, content);
console.log('Update Complete');
