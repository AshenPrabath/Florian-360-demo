const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace ALL TourControls props blocks to use global state
const oldProps = `currentViewpointIndex={currentLocation.viewpoints.findIndex(
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

const newProps = `currentViewpointIndex={currentGlobalIndex}
                  totalViewpoints={allGlobalViewpoints.length}
                  onPrev={prevViewpoint}
                  onNext={nextViewpoint}
                  hasPrev={currentGlobalIndex > 0}
                  hasNext={currentGlobalIndex < allGlobalViewpoints.length - 1}`;

// Use split/join to replace all occurrences reliably
content = content.split(oldProps).join(newProps);

// 2. Define the exact mobile block to replace
const mobileBlockRegex = /\{(\/\* Mobile Multi-Row Layout \*\/)\}\s*<div className="block md:hidden">[\s\S]*?<\/div>(\s*)\{(\/\* Large Screen 2-Row Layout \*\/)\}/;

const newMobileBlock = `{/* Mobile Multi-Row Layout */}
          <div className="block md:hidden">
            {/* Row 1: Actions & Navigation Toggle */}
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
                currentViewpointIndex={currentGlobalIndex}
                totalViewpoints={allGlobalViewpoints.length}
                onPrev={prevViewpoint}
                onNext={nextViewpoint}
                hasPrev={currentGlobalIndex > 0}
                hasNext={currentGlobalIndex < allGlobalViewpoints.length - 1}
              />
            </div>

            {/* Row 3: Utility Controls */}
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
          </div>$2{/* Large Screen 2-Row Layout */}`;

content = content.replace(mobileBlockRegex, newMobileBlock);

// 3. Fix text overlap and flex-shrink-0 for other layouts
content = content.replace(/className={\`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2/g, 'className={`px-4 py-2 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0');
content = content.replace(/className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2"/g, 'className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0"');

fs.writeFileSync(filePath, content);
console.log('Final UI fix successful');
