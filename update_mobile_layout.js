const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. In Row 1, replace the empty div with the Navigation button
const emptyDivRegex = /<div className="flex items-center gap-3">\s*<\/div>/;
const navButton = `<button
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className={\`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 text-white \${isNavExpanded
                  ? "bg-gray-700 shadow"
                  : "bg-gray-700/50 hover:bg-gray-600"
                  }\`}
              >
                <Navigation size={16} />
                <span className="text-sm font-medium">Navigation</span>
              </button>`;

content = content.replace(emptyDivRegex, navButton);

// 2. In Row 2, remove the Navigation button (it's the first button in that flex container)
// We look for the Row 2 div and then the button immediately following it
const row2Regex = /(Row 2: Viewpoint Navigation \(Full Width\) \*\/\}\s*<div className="flex items-center justify-center px-4 py-2 border-b border-white\/10">)\s*<button[\s\S]*?<\/button>/;

content = content.replace(row2Regex, '$1');

fs.writeFileSync(filePath, content);
console.log('Mobile layout update successful');
